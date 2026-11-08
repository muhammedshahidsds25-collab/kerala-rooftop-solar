"""
Measure how much of a good roof is really free for solar panels (QGIS 3.28).

It shows good roofs (gold labels) one by one, rotating through districts. On each roof you DRAW the part
where panels could really go (leave out water tanks, stair rooms, the edge strip, and shaded parts).
At the end it prints the average free share, which replaces the 60% guess in the potential.

How to use: Python Console -> Show Editor -> Open Script... -> this file -> Run Script,
then pick YOUR roofs_to_label.gpkg (roofs_to_label_ai.gpkg and adjudication.csv must be in the same folder).
Draw: the "Add Polygon" tool is switched on for you. Left-click the corners, right-click to finish one
area. Draw several areas if the free space is in pieces. Then press "Roof done".
Buttons: Roof done | Skip roof (can't see it well) | Undo last area | Stop. Run again later to continue.
Drawings are saved in free_space.gpkg, progress in free_space_done.csv (same folder).
"""
import csv
import os
import random

from qgis.PyQt.QtCore import QTimer
from qgis.PyQt.QtGui import QColor
from qgis.PyQt.QtWidgets import QAction, QFileDialog
from qgis.core import (NULL, Qgis, QgsCoordinateTransform, QgsDefaultValue, QgsDistanceArea, QgsEditFormConfig,
                       QgsProject, QgsRasterLayer, QgsVectorFileWriter, QgsVectorLayer, QgsWkbTypes)
from qgis.gui import QgsRubberBand
from qgis.utils import iface

SAT_URI = ('type=xyz&zmin=0&zmax=18&url=https://server.arcgisonline.com/ArcGIS/rest/services/'
           'World_Imagery/MapServer/tile/%7Bz%7D/%7By%7D/%7Bx%7D')
# Sharper in most of Kerala (zoom 20). For viewing only: Google's terms do not allow reusing these tiles.
GOOGLE_URI = 'type=xyz&zmin=0&zmax=20&url=https://mt1.google.com/vt/lyrs%3Ds%26x%3D%7Bx%7D%26y%3D%7By%7D%26z%3D%7Bz%7D'
LAYER = 'roofs_to_label'
CURRENT_SHARE = 0.60          # the guess used in notebooks 03-10
CURRENT_GW = 52.01            # notebook 10 result with that guess


def is_empty(value):
    return value is None or value == NULL or str(value) == 'NULL'


def gold_good(folder):
    """Ids of roofs that are good in the gold labels (agreed good, or blind-checked as good)."""
    def read(name, field):
        layer = QgsVectorLayer(f'{os.path.join(folder, name)}|layername={LAYER}', 'l', 'ogr')
        return {f['id']: int(f[field]) for f in layer.getFeatures() if not is_empty(f[field])}
    human, ai = read('roofs_to_label.gpkg', 'label'), read('roofs_to_label_ai.gpkg', 'ai_label')
    with open(os.path.join(folder, 'adjudication.csv')) as fh:
        verdict = {r['id']: int(r['verdict']) for r in csv.DictReader(fh)}
    good = set()
    for i in human:
        if i in ai and (human[i] == 1) == (ai[i] == 1):
            if human[i] == 1:
                good.add(i)
        elif verdict.get(i) == 1:
            good.add(i)
    return good


def visit_order(roofs, good, seed=11):
    """Good roofs in a fixed order that rotates through districts (balanced wherever you stop)."""
    by_d = {}
    for f in roofs.getFeatures():
        if f['id'] in good:
            by_d.setdefault(f['district'], []).append(f['id'])
    rng = random.Random(seed)
    for d in sorted(by_d):
        by_d[d].sort()
        rng.shuffle(by_d[d])
    order, k = [], 0
    while any(k < len(v) for v in by_d.values()):
        order += [by_d[d][k] for d in sorted(by_d) if k < len(by_d[d])]
        k += 1
    return order


def free_shares(roofs, free, done):
    """roof id -> free area / roof outline area (0-1), for the roofs marked done."""
    da = QgsDistanceArea()
    da.setSourceCrs(roofs.crs(), QgsProject.instance().transformContext())
    da.setEllipsoid('WGS84')
    roof_area = {f['id']: da.measureArea(f.geometry()) for f in roofs.getFeatures() if f['id'] in done}
    drawn = {}
    for f in free.getFeatures():
        if f['roof_id'] in roof_area:
            drawn[f['roof_id']] = drawn.get(f['roof_id'], 0) + da.measureArea(f.geometry())
    # shortcut: outlines can be offset from the photo, so the share uses the outline area, capped at 100%
    return {i: min(drawn.get(i, 0) / a, 1.0) for i, a in roof_area.items() if a > 0}


def report(shares):
    if not shares:
        return 'No roofs measured yet.'
    v = sorted(shares.values())
    mean, median = sum(v) / len(v), v[len(v) // 2]
    return (f'{len(v)} roofs measured: average free share {100 * mean:.0f}% (median {100 * median:.0f}%, '
            f'range {100 * v[0]:.0f}-{100 * v[-1]:.0f}%). With it, the potential is about '
            f'{CURRENT_GW * mean / CURRENT_SHARE:.1f} GW instead of {CURRENT_GW:.1f} GW (60% guess).')


def read_done(path):
    if not os.path.exists(path):
        return {}
    with open(path) as fh:
        return {r['roof_id']: r['status'] for r in csv.DictReader(fh)}


if iface is not None:
    if globals().get('_FS_TOOLBAR') is not None:
        iface.mainWindow().removeToolBar(_FS_TOOLBAR)
    if globals().get('_FS_BAND') is not None:
        _FS_BAND.reset(QgsWkbTypes.PolygonGeometry)
    path, _ = QFileDialog.getOpenFileName(None, 'Choose YOUR labelled roofs_to_label.gpkg', '', 'GeoPackage (*.gpkg)')
    if not path:
        raise SystemExit('No file chosen.')
    folder = os.path.dirname(path)
    FREE_PATH = os.path.join(folder, 'free_space.gpkg')
    DONE_PATH = os.path.join(folder, 'free_space_done.csv')
    project = QgsProject.instance()
    canvas = iface.mapCanvas()

    for name in ('Esri Satellite (free)', 'Google Satellite (free)', 'roofs_free', 'free_space'):
        for old in project.mapLayersByName(name):
            project.removeMapLayer(old)
    roofs = QgsVectorLayer(f'{path}|layername={LAYER}', 'roofs_free', 'ogr')
    if not os.path.exists(FREE_PATH):                       # empty polygon layer with one field: roof_id
        mem = QgsVectorLayer(f'Polygon?crs={roofs.crs().authid()}&field=roof_id:string(64)', 'free_space', 'memory')
        opts = QgsVectorFileWriter.SaveVectorOptions()
        opts.driverName, opts.layerName = 'GPKG', 'free_space'
        QgsVectorFileWriter.writeAsVectorFormatV3(mem, FREE_PATH, project.transformContext(), opts)
    free = QgsVectorLayer(f'{FREE_PATH}|layername=free_space', 'free_space', 'ogr')
    project.addMapLayer(QgsRasterLayer(SAT_URI, 'Esri Satellite (free)', 'wms'))
    project.addMapLayer(QgsRasterLayer(GOOGLE_URI, 'Google Satellite (free)', 'wms'))   # on top; untick to see Esri
    project.addMapLayer(roofs)
    project.addMapLayer(free)
    for layer, colour in ((roofs, 'yellow'), (free, 'lime')):
        sym = layer.renderer().symbol().symbolLayer(0)
        sym.setFillColor(QColor(0, 255, 0, 70) if layer is free else QColor(0, 0, 0, 0))
        sym.setStrokeColor(QColor(colour))
        sym.setStrokeWidth(0.4)
    cfg = free.editFormConfig()
    cfg.setSuppress(QgsEditFormConfig.SuppressOn)            # no pop-up form: roof_id is filled in automatically
    free.setEditFormConfig(cfg)
    ROOF_ID_IDX = free.fields().indexOf('roof_id')

    FID = {f['id']: f.id() for f in roofs.getFeatures()}
    ORDER = visit_order(roofs, gold_good(folder))
    DONE = read_done(DONE_PATH)
    TODO = [i for i in ORDER if i not in DONE]
    _FS_BAND = QgsRubberBand(canvas, QgsWkbTypes.PolygonGeometry)
    _FS_BAND.setStrokeColor(QColor('cyan'))
    _FS_BAND.setFillColor(QColor(0, 0, 0, 0))
    _FS_BAND.setWidth(3)

    def message(title, text, level=Qgis.Info):
        iface.messageBar().clearWidgets()
        iface.messageBar().pushMessage(title, text, level=level, duration=0)

    def save_done():
        with open(DONE_PATH, 'w', newline='') as fh:
            w = csv.writer(fh)
            w.writerow(['roof_id', 'status'])
            w.writerows(DONE.items())

    def show():
        if not TODO:
            return finish()
        rid = TODO[0]
        free.setDefaultValueDefinition(ROOF_ID_IDX, QgsDefaultValue(f"'{rid}'"))
        geom = roofs.getFeature(FID[rid]).geometry()
        box = geom.boundingBox()
        box.grow(max(max(box.width(), box.height()) * 1.0, 0.00035))   # closer than ~1:400 only blurs the photo
        canvas.setExtent(QgsCoordinateTransform(roofs.crs(), canvas.mapSettings().destinationCrs(),
                                                project).transformBoundingBox(box))
        _FS_BAND.setToGeometry(geom, roofs)
        canvas.refresh()
        if not free.isEditable():
            free.startEditing()
        iface.setActiveLayer(free)
        iface.actionAddFeature().trigger()
        n_done = sum(s == 'done' for s in DONE.values())
        message(f'Roof {len(ORDER) - len(TODO) + 1} of {len(ORDER)} ({n_done} measured)',
                'Draw where panels could really go (no tanks, stairs, edges, shade). Right-click ends an area. '
                'Then press Roof done.')

    def next_roof(status):
        if free.isEditable():
            free.commitChanges()
        if status == 'done' and not any(f['roof_id'] == TODO[0] for f in free.getFeatures()):
            free.startEditing()
            iface.actionAddFeature().trigger()
            return message('Nothing drawn yet', 'Draw at least one free area on this roof, or press Skip roof.',
                           Qgis.Warning)
        DONE[TODO.pop(0)] = status
        save_done()
        show()

    def undo_last():
        rid = TODO[0] if TODO else None
        mine = [f.id() for f in free.getFeatures() if f['roof_id'] == rid]
        if mine:
            if not free.isEditable():
                free.startEditing()
            free.deleteFeature(max(mine))
            free.commitChanges()
            free.startEditing()
            canvas.refresh()

    def finish():
        if free.isEditable():
            free.commitChanges()
        _FS_BAND.reset(QgsWkbTypes.PolygonGeometry)
        iface.mainWindow().removeToolBar(_FS_TOOLBAR)
        done_ids = {i for i, s in DONE.items() if s == 'done'}
        message('Free space', report(free_shares(roofs, free, done_ids)) + ' Send this line to Claude.', Qgis.Success)

    _FS_TOOLBAR = iface.addToolBar('Free space')
    for text, fn in (('Roof done', lambda: next_roof('done')), ('Skip roof', lambda: next_roof('skip')),
                     ('Undo last area', undo_last), ('Stop', finish)):
        action = QAction(text, iface.mainWindow())
        action.triggered.connect(lambda _=False, f=fn: f())
        _FS_TOOLBAR.addAction(action)
    message('Free space', f'{len(ORDER)} good roofs; {len(TODO)} left. Aim for about 40.')
    QTimer.singleShot(1500, show)       # an empty project zooms to all layers after loading; zoom to the roof after that
