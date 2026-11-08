"""
Blind check of the roofs where you and the AI disagree (QGIS 3.28).

It picks roofs where your label and the AI's label differ on good vs not good, in random order, and shows
each one WITHOUT either label. You judge the roof again (same rules as before). At the end it counts who
was right more often, and saves your answers in adjudication.csv next to your roofs_to_label.gpkg.

How to use: Python Console -> Show Editor -> Open Script... -> this file -> Run Script,
then pick YOUR roofs_to_label.gpkg (roofs_to_label_ai.gpkg must be in the same folder).
Buttons: 1 Good | 0 Bad | 2 Not a building | Skip | Stop. Run again later to continue.
Judge the real roof at or right beside the outline, as before.
"""
import csv
import os
import random

from qgis.PyQt.QtCore import QTimer
from qgis.PyQt.QtGui import QColor
from qgis.PyQt.QtWidgets import QAction, QFileDialog
from qgis.core import (NULL, Qgis, QgsCoordinateTransform, QgsProject, QgsRasterLayer, QgsVectorLayer,
                       QgsWkbTypes)
from qgis.gui import QgsRubberBand
from qgis.utils import iface

SAT_URI = ('type=xyz&zmin=0&zmax=18&url=https://server.arcgisonline.com/ArcGIS/rest/services/'
           'World_Imagery/MapServer/tile/%7Bz%7D/%7By%7D/%7Bx%7D')
# Sharper in most of Kerala (zoom 20). For viewing only: Google's terms do not allow reusing these tiles.
GOOGLE_URI = 'type=xyz&zmin=0&zmax=20&url=https://mt1.google.com/vt/lyrs%3Ds%26x%3D%7Bx%7D%26y%3D%7By%7D%26z%3D%7Bz%7D'
LAYER = 'roofs_to_label'
N_ROOFS = 1000           # all disagreements; the order is fixed, so earlier answers stay valid


def is_empty(value):
    return value is None or value == NULL or str(value) == 'NULL'


def read_labels(path, field):
    layer = QgsVectorLayer(f'{path}|layername={LAYER}', 'l', 'ogr')
    return {f['id']: int(f[field]) for f in layer.getFeatures() if not is_empty(f[field])}


def pick_disagreements(human, ai, n=N_ROOFS, seed=7):
    """Roof ids where one says good and the other does not, in a fixed random order."""
    ids = sorted(i for i in human if i in ai and (human[i] == 1) != (ai[i] == 1))
    random.Random(seed).shuffle(ids)
    return ids[:n]


def score(verdicts, human, ai):
    """verdicts: id -> your new label (0/1/2). Returns (n, you_right, ai_right)."""
    n = len(verdicts)
    you = sum((human[i] == 1) == (v == 1) for i, v in verdicts.items())
    return n, you, n - you          # they disagree on good vs not good, so exactly one of you is right


def summary(verdicts, human, ai):
    if not verdicts:
        return 'No roofs judged yet.'
    n, you, a = score(verdicts, human, ai)
    return f'{n} roofs judged blind: your first label was right on {you}, the AI on {a}.'


if iface is not None:
    if globals().get('_ADJ_TOOLBAR') is not None:
        iface.mainWindow().removeToolBar(_ADJ_TOOLBAR)
    if globals().get('_ADJ_BAND') is not None:
        _ADJ_BAND.reset(QgsWkbTypes.PolygonGeometry)
    path, _ = QFileDialog.getOpenFileName(None, 'Choose YOUR labelled roofs_to_label.gpkg', '', 'GeoPackage (*.gpkg)')
    if not path:
        raise SystemExit('No file chosen.')
    folder = os.path.dirname(path)
    ai_path = os.path.join(folder, 'roofs_to_label_ai.gpkg')
    CSV = os.path.join(folder, 'adjudication.csv')
    human, ai = read_labels(path, 'label'), read_labels(ai_path, 'ai_label')
    VERDICTS = {}
    if os.path.exists(CSV):
        with open(CSV) as fh:
            VERDICTS = {r['id']: int(r['verdict']) for r in csv.DictReader(fh)}
    ids = pick_disagreements(human, ai)
    TODO = [i for i in ids if i not in VERDICTS]

    project = QgsProject.instance()
    canvas = iface.mapCanvas()
    for old in (project.mapLayersByName('Esri Satellite (check)') + project.mapLayersByName('Google Satellite (check)')
                + project.mapLayersByName('roofs_check')):
        project.removeMapLayer(old)
    sat = QgsRasterLayer(SAT_URI, 'Esri Satellite (check)', 'wms')
    google = QgsRasterLayer(GOOGLE_URI, 'Google Satellite (check)', 'wms')   # on top; untick it to see Esri
    roofs = QgsVectorLayer(f'{path}|layername={LAYER}', 'roofs_check', 'ogr')
    project.addMapLayer(sat)
    project.addMapLayer(google)
    project.addMapLayer(roofs)
    fill = roofs.renderer().symbol().symbolLayer(0)
    fill.setFillColor(QColor(0, 0, 0, 0))
    fill.setStrokeColor(QColor('yellow'))
    fill.setStrokeWidth(0.4)
    FID = {f['id']: f.id() for f in roofs.getFeatures()}
    _ADJ_BAND = QgsRubberBand(canvas, QgsWkbTypes.PolygonGeometry)
    _ADJ_BAND.setStrokeColor(QColor('cyan'))
    _ADJ_BAND.setFillColor(QColor(0, 0, 0, 0))
    _ADJ_BAND.setWidth(3)

    def message(title, text, level=Qgis.Info):
        iface.messageBar().clearWidgets()
        iface.messageBar().pushMessage(title, text, level=level, duration=0)

    def show():
        if not TODO:
            return finish()
        geom = roofs.getFeature(FID[TODO[0]]).geometry()
        box = geom.boundingBox()
        box.grow(max(max(box.width(), box.height()) * 1.5, 0.0005))
        canvas.setExtent(QgsCoordinateTransform(roofs.crs(), canvas.mapSettings().destinationCrs(),
                                                project).transformBoundingBox(box))
        _ADJ_BAND.setToGeometry(geom, roofs)
        canvas.refresh()
        message(f'Roof {len(ids) - len(TODO) + 1} of {len(ids)}',
                'Judge it again, without looking at the old labels: 1 good, 0 bad, 2 not a building, Skip, Stop.')

    def answer(value):
        rid = TODO.pop(0)
        if value is not None:
            VERDICTS[rid] = value
            with open(CSV, 'w', newline='') as fh:
                w = csv.writer(fh)
                w.writerow(['id', 'verdict'])
                w.writerows(VERDICTS.items())
        show()

    def finish():
        _ADJ_BAND.reset(QgsWkbTypes.PolygonGeometry)
        iface.mainWindow().removeToolBar(_ADJ_TOOLBAR)
        done = {i: v for i, v in VERDICTS.items() if i in human and i in ai}
        message('Check finished', summary(done, human, ai) + f' Saved: {CSV}', Qgis.Success)

    _ADJ_TOOLBAR = iface.addToolBar('Blind check')
    for text, value in (('1  Good', 1), ('0  Bad', 0), ('2  Not a building', 2), ('Skip', None)):
        action = QAction(text, iface.mainWindow())
        action.triggered.connect(lambda _=False, v=value: answer(v))
        _ADJ_TOOLBAR.addAction(action)
    stop_action = QAction('Stop', iface.mainWindow())
    stop_action.triggered.connect(finish)
    _ADJ_TOOLBAR.addAction(stop_action)
    message('Blind check', f'{len(ids)} roofs where you and the AI disagree; {len(TODO)} left to judge.')
    QTimer.singleShot(1500, show)       # an empty project zooms to all layers after loading; zoom to the roof after that
