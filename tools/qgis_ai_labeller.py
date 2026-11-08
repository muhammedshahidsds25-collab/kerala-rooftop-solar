"""
AI roof labeller for QGIS (tested with QGIS 3.28): a second, automatic labeller to check your own labels.

It never changes your labels. It writes a copy, roofs_to_label_ai.gpkg (next to your file), with two new
columns: ai_label (1 good, 0 bad, 2 not a building, empty = AI could not tell) and ai_reason.
When it finishes it compares ai_label with your label and saves ai_vs_human.csv next to the file.

How to use:
  1. Get a free Gemini API key: https://aistudio.google.com -> Get API key -> Create API key
  2. QGIS -> Plugins -> Python Console -> Show Editor -> Open Script... -> this file -> Run Script
  3. Pick your labelled roofs_to_label.gpkg, then paste the API key (it is not saved anywhere)
  4. Wait (about 30-40 minutes for 300 roofs). Progress shows above the map.
     "Stop AI" pauses it; run the script again to continue where it stopped.

The pictures come from the Esri World Imagery basemap: check Esri's terms of use, and say in your
report that a second set of labels came from an AI model.
"""
import base64
import json
import os
import time
import urllib.error
import urllib.request

from qgis.PyQt.QtCore import QBuffer, QByteArray, QIODevice, QSize, QTimer, QVariant
from qgis.PyQt.QtGui import QColor
from qgis.PyQt.QtWidgets import QAction, QApplication, QFileDialog, QInputDialog, QLineEdit
from qgis.core import (NULL, Qgis, QgsCoordinateReferenceSystem, QgsCoordinateTransform, QgsFeature, QgsField,
                       QgsMapRendererParallelJob, QgsMapSettings, QgsProject, QgsRasterLayer, QgsVectorFileWriter,
                       QgsVectorLayer, QgsWkbTypes)
from qgis.gui import QgsRubberBand
from qgis.utils import iface

SAT_URI = ('type=xyz&zmin=0&zmax=18&url=https://server.arcgisonline.com/ArcGIS/rest/services/'
           'World_Imagery/MapServer/tile/%7Bz%7D/%7By%7D/%7Bx%7D')
API = 'https://generativelanguage.googleapis.com/v1beta'
IMAGE_PX = 640
DELAY_MS = 5000            # free Flash Lite 3.x: 15 requests a minute, 500 a day (plain Flash: 5 a minute, 20 a day)
LAYER = 'roofs_to_label'

PROMPT = """You label roofs for a rooftop-solar study in Kerala, India.
The picture is a satellite image. The red outline marks one building footprint drawn by an AI model.
The outline is often shifted a few metres from the real building, so judge the building at or right beside it.
Give one label:
1 = good: a real roof about the size of a normal house or bigger, mostly open, not covered by tree crowns
    (sloped or flat both fine)
0 = bad: a real structure that is small (shed, toilet), mostly hidden or shaded by tree crowns,
    or unusable for panels (round storage tank, very cluttered)
2 = not a building: no structure at or right beside the outline, only ground, trees, road or water
null = you cannot tell (blurry, cloudy, no image)
Reply only with JSON: {"label": 1, "reason": "at most 15 words"}"""


def is_empty(value):
    return value is None or value == NULL or str(value) == 'NULL'


def make_ai_copy(human_path, ai_path):
    """Copy the roof outlines (not your labels) into a new GeoPackage with empty ai_label and ai_reason."""
    src = QgsVectorLayer(f'{human_path}|layername={LAYER}', 'src', 'ogr')
    if not src.isValid():
        raise RuntimeError(f'Could not open the layer "{LAYER}" in {human_path}')
    options = QgsVectorFileWriter.SaveVectorOptions()
    options.driverName = 'GPKG'
    options.layerName = LAYER
    options.attributes = [src.fields().indexOf(n) for n in ('sample_no', 'id', 'district')]
    err = QgsVectorFileWriter.writeAsVectorFormatV3(src, ai_path, QgsProject.instance().transformContext(), options)
    if err[0] != QgsVectorFileWriter.NoError:
        raise RuntimeError(f'Could not write {ai_path}: {err[1]}')
    ai = QgsVectorLayer(f'{ai_path}|layername={LAYER}', 'ai', 'ogr')
    ai.dataProvider().addAttributes([QgsField('ai_label', QVariant.Int), QgsField('ai_reason', QVariant.String)])
    ai.updateFields()


def outline_layer_for(roofs):
    """A one-feature memory layer that draws the current roof as a thick red outline."""
    layer = QgsVectorLayer(f'{QgsWkbTypes.displayString(roofs.wkbType())}?crs={roofs.crs().authid()}', 'outline', 'memory')
    symbol = layer.renderer().symbol().symbolLayer(0)
    symbol.setFillColor(QColor(0, 0, 0, 0))
    symbol.setStrokeColor(QColor('red'))
    symbol.setStrokeWidth(0.8)
    return layer


def render_roof_png(geom, roofs_crs, sat, outline):
    """PNG bytes: the satellite image around one roof, with that roof outlined in red."""
    provider = outline.dataProvider()
    provider.truncate()
    f = QgsFeature()
    f.setGeometry(geom)
    provider.addFeature(f)
    outline.updateExtents()
    box = geom.boundingBox()
    box.grow(max(max(box.width(), box.height()) * 1.5, 0.0005))   # same view as the labelling helper
    settings = QgsMapSettings()
    settings.setLayers([outline, sat])
    settings.setDestinationCrs(sat.crs())
    settings.setExtent(QgsCoordinateTransform(roofs_crs, sat.crs(), QgsProject.instance()).transformBoundingBox(box))
    settings.setOutputSize(QSize(IMAGE_PX, IMAGE_PX))
    settings.setBackgroundColor(QColor('white'))
    job = QgsMapRendererParallelJob(settings)
    job.start()
    job.waitForFinished()
    data = QByteArray()
    buffer = QBuffer(data)
    buffer.open(QIODevice.WriteOnly)
    job.renderedImage().save(buffer, 'PNG')
    return bytes(data)


def pick_model(key):
    """Newest general 'flash' Gemini model this key can use."""
    req = urllib.request.Request(f'{API}/models?pageSize=200', headers={'x-goog-api-key': key})
    with urllib.request.urlopen(req, timeout=30) as r:
        models = json.load(r).get('models', [])
    names = [m['name'].split('/', 1)[1] for m in models
             if 'generateContent' in m.get('supportedGenerationMethods', [])]
    skip = ('image', 'tts', 'live', 'audio', 'transcribe', 'exp', 'thinking', 'omni', 'robotics', 'computer')
    ok = [n for n in names if n.startswith('gemini-') and not n.startswith('gemini-2.0') and not any(w in n for w in skip)]
    # Free tier (checked 2026-11-05): Flash Lite 3.1 / 3.5 get 500 requests a day; plain Flash only 20 a day
    lite = sorted((n for n in ok if 'flash-lite' in n and 'preview' not in n), reverse=True)
    lite += sorted((n for n in ok if 'flash-lite' in n and 'preview' in n), reverse=True)
    flash = sorted((n for n in ok if 'flash' in n and 'lite' not in n and 'preview' not in n), reverse=True)
    models = list(dict.fromkeys(lite + flash))
    if not models:
        raise RuntimeError('No Gemini flash model for this key. Models: ' + ', '.join(names[:20]))
    return models


def ask_gemini(png, key, model):
    """Send one roof picture; return (label 0/1/2 or None, reason)."""
    body = {'contents': [{'parts': [{'text': PROMPT},
                                    {'inline_data': {'mime_type': 'image/png',
                                                     'data': base64.b64encode(png).decode()}}]}],
            'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'}}
    req = urllib.request.Request(f'{API}/models/{model}:generateContent', data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    with urllib.request.urlopen(req, timeout=90) as r:
        out = json.load(r)
    parts = out['candidates'][0]['content']['parts']
    text = ''.join(p.get('text', '') for p in parts if not p.get('thought')).strip().strip('`')
    text = text[text.find('{'):text.rfind('}') + 1]
    answer = json.loads(text)
    try:
        label = int(answer.get('label'))
    except (TypeError, ValueError):
        label = None
    return (label if label in (0, 1, 2) else None), str(answer.get('reason', ''))[:200]


def wait(seconds):
    """Sleep without freezing QGIS."""
    end = time.time() + seconds
    while time.time() < end:
        QApplication.processEvents()
        time.sleep(0.2)


def note(text):
    """Show a short status line above the map (and in the console)."""
    print(text)
    if iface is not None:
        iface.messageBar().clearWidgets()
        iface.messageBar().pushMessage('AI labelling', text, level=Qgis.Warning, duration=0)


def ask_with_retry(png, key, models):
    """Try each model in turn (3 tries each). The model that worked moves to the front of the list."""
    last = 'no model tried'
    for model in list(models):
        for attempt in range(3):
            try:
                answer = ask_gemini(png, key, model)
                models.insert(0, models.pop(models.index(model)))
                return answer
            except urllib.error.HTTPError as e:
                if e.code not in (429, 500, 502, 503, 504):
                    raise RuntimeError(f'Gemini error {e.code}: {e.read().decode(errors="replace")[:300]}')
                last = f'error {e.code}'
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError, IndexError) as e:
                last = type(e).__name__
            note(f'{model}: {last} (busy or rate limit). Waiting {15 * (attempt + 1)} s, try {attempt + 2} of 3')
            wait(15 * (attempt + 1))
        note(f'{model} keeps failing ({last}). Trying the next model.')
    raise RuntimeError(f'All Gemini models failed ({last}). Run the script again later.')


def compare(human_path, ai_layer, out_csv):
    """Agreement between your labels and the AI's; saves a 3 x 3 table as CSV and returns a short summary."""
    human = {f['id']: f['label'] for f in QgsVectorLayer(f'{human_path}|layername={LAYER}', 'h', 'ogr').getFeatures()}
    pairs = [(int(human[f['id']]), int(f['ai_label'])) for f in ai_layer.getFeatures()
             if not is_empty(human.get(f['id'])) and not is_empty(f['ai_label'])]
    n = len(pairs)
    if n == 0:
        return 'No roofs have both your label and an AI label yet.'
    names = {1: 'good', 0: 'bad', 2: 'not a building'}
    with open(out_csv, 'w') as out:
        out.write('your_label,' + ','.join(f'ai_{names[a]}' for a in (1, 0, 2)) + '\n')
        for h in (1, 0, 2):
            out.write(names[h] + ',' + ','.join(str(sum(1 for p in pairs if p == (h, a))) for a in (1, 0, 2)) + '\n')
    exact = sum(h == a for h, a in pairs) / n
    # Good vs not good is what the Random Forest learns, so report its agreement and Cohen's kappa too
    yes_h = sum(h == 1 for h, _ in pairs) / n
    yes_a = sum(a == 1 for _, a in pairs) / n
    binary = sum((h == 1) == (a == 1) for h, a in pairs) / n
    chance = yes_h * yes_a + (1 - yes_h) * (1 - yes_a)
    kappa = (binary - chance) / (1 - chance) if chance < 1 else float('nan')
    return (f'{n} roofs compared | same label: {exact:.0%} | good vs not good: {binary:.0%} '
            f'(kappa {kappa:.2f}) | table saved: {out_csv}')


if iface is not None:
    if globals().get('_AI_TOOLBAR') is not None:
        iface.mainWindow().removeToolBar(_AI_TOOLBAR)
    path, _ = QFileDialog.getOpenFileName(None, 'Choose YOUR labelled roofs_to_label.gpkg', '', 'GeoPackage (*.gpkg)')
    if not path:
        raise SystemExit('No file chosen.')
    if path.endswith('_ai.gpkg'):
        path = path[:-len('_ai.gpkg')] + '.gpkg'
    AI_PATH = os.path.join(os.path.dirname(path), 'roofs_to_label_ai.gpkg')
    KEY, ok = QInputDialog.getText(None, 'Gemini API key', 'Paste your Gemini API key:', QLineEdit.Password)
    KEY = KEY.strip()
    if not ok or not KEY:
        raise SystemExit('No API key given.')

    if not os.path.exists(AI_PATH):
        make_ai_copy(path, AI_PATH)
    ai_layer = QgsVectorLayer(f'{AI_PATH}|layername={LAYER}', 'roofs_ai', 'ogr')
    IDX_LABEL, IDX_REASON = ai_layer.fields().indexOf('ai_label'), ai_layer.fields().indexOf('ai_reason')
    sat = QgsRasterLayer(SAT_URI, 'Esri Satellite (AI)', 'wms')
    outline = outline_layer_for(ai_layer)

    # Live view: satellite + all roofs on the map, the roof being labelled outlined in cyan
    project = QgsProject.instance()
    canvas = iface.mapCanvas()
    for old in project.mapLayersByName('Esri Satellite (AI)') + project.mapLayersByName('roofs_ai'):
        project.removeMapLayer(old)
    project.addMapLayer(sat)
    project.addMapLayer(ai_layer)
    fill = ai_layer.renderer().symbol().symbolLayer(0)
    fill.setFillColor(QColor(0, 0, 0, 0))
    fill.setStrokeColor(QColor('yellow'))
    fill.setStrokeWidth(0.4)
    if globals().get('_AI_BAND') is not None:
        _AI_BAND.reset(QgsWkbTypes.PolygonGeometry)
    _AI_BAND = QgsRubberBand(canvas, QgsWkbTypes.PolygonGeometry)
    _AI_BAND.setStrokeColor(QColor('cyan'))
    _AI_BAND.setFillColor(QColor(0, 0, 0, 0))
    _AI_BAND.setWidth(3)

    def show_roof(geom):
        box = geom.boundingBox()
        box.grow(max(max(box.width(), box.height()) * 1.5, 0.0005))
        canvas.setExtent(QgsCoordinateTransform(ai_layer.crs(), canvas.mapSettings().destinationCrs(),
                                                project).transformBoundingBox(box))
        _AI_BAND.setToGeometry(geom, ai_layer)
        canvas.refresh()
        QApplication.processEvents()

    try:
        MODELS = pick_model(KEY)
    except urllib.error.HTTPError as e:
        raise SystemExit(f'Gemini refused the API key (error {e.code}). Check the key and run again.')
    # Rotate through districts, so a partial run (daily free quota) still covers all of them
    _seen, _order = {}, []
    for f in sorted(ai_layer.getFeatures(), key=lambda f: f['sample_no']):
        _seen[f['district']] = _seen.get(f['district'], 0) + 1
        if is_empty(f['ai_reason']):
            _order.append((_seen[f['district']], f['district'], f.id()))
    TODO = [fid for _, _, fid in sorted(_order)]
    AI_STATE = {'stop': False, 'done': ai_layer.featureCount() - len(TODO)}

    def message(title, text, level=Qgis.Info):
        iface.messageBar().clearWidgets()
        iface.messageBar().pushMessage(title, text, level=level, duration=0)
        print(f'{title}: {text}')

    def finish(title):
        iface.mainWindow().removeToolBar(_AI_TOOLBAR)
        _AI_BAND.reset(QgsWkbTypes.PolygonGeometry)
        message(title, compare(path, ai_layer, os.path.join(os.path.dirname(path), 'ai_vs_human.csv')), Qgis.Success)

    def step():
        if AI_STATE['stop']:
            finish('AI labelling paused')
            return
        if not TODO:
            finish('AI labelling done')
            return
        fid = TODO.pop(0)
        f = ai_layer.getFeature(fid)
        show_roof(f.geometry())
        try:
            label, reason = ask_with_retry(render_roof_png(f.geometry(), ai_layer.crs(), sat, outline), KEY, MODELS)
        except Exception as e:
            iface.mainWindow().removeToolBar(_AI_TOOLBAR)
            message('AI labelling stopped',
                    f'{e} (run the script again to continue; free quota is about 20 requests a day per model) | '
                    + compare(path, ai_layer, os.path.join(os.path.dirname(path), 'ai_vs_human.csv')), Qgis.Critical)
            return
        ai_layer.dataProvider().changeAttributeValues(
            {fid: {IDX_LABEL: NULL if label is None else label, IDX_REASON: reason or 'no reason given'}})
        AI_STATE['done'] += 1
        message(f"AI: roof {AI_STATE['done']} of {ai_layer.featureCount()}",
                f"{f['district']} | ai_label {label} | {reason} | model {MODELS[0]} | click Stop AI to pause")
        QTimer.singleShot(DELAY_MS, step)

    def stop_ai():
        AI_STATE['stop'] = True

    _AI_TOOLBAR = iface.addToolBar('AI labelling')
    stop_button = QAction('Stop AI', iface.mainWindow())
    stop_button.triggered.connect(stop_ai)
    _AI_TOOLBAR.addAction(stop_button)
    message('AI labelling started', f'{len(TODO)} roofs to go, models to try: {", ".join(MODELS[:4])}')
    QTimer.singleShot(100, step)
