"""
Roof labelling helper for QGIS (tested with QGIS 3.28).

How to use:
  1. QGIS -> Plugins -> Python Console (or Ctrl+Alt+P)
  2. In the console, click "Show Editor", then "Open Script..." and choose this file
  3. Click "Run Script" and pick your roofs_to_label.gpkg
  4. Use the new "Roof labelling" toolbar buttons:
     1 Good | 0 Bad | 2 Not a building | Skip | Back | Stop

Every button press saves to the GeoPackage immediately. You can stop and run the script again later;
it continues from the first roof without a label.
"""
from qgis.PyQt.QtGui import QColor
from qgis.PyQt.QtWidgets import QAction, QFileDialog
from qgis.core import (NULL, Qgis, QgsCoordinateTransform, QgsProject, QgsRasterLayer, QgsVectorLayer,
                       QgsWkbTypes)
from qgis.gui import QgsRubberBand
from qgis.utils import iface

SAT_URI = ('type=xyz&zmin=0&zmax=18&url=https://server.arcgisonline.com/ArcGIS/rest/services/'
           'World_Imagery/MapServer/tile/%7Bz%7D/%7By%7D/%7Bx%7D')
MEANING = {1: 'good', 0: 'bad', 2: 'not a building'}

# If the script was run before in this QGIS session, remove the old toolbar and outline first
if globals().get('_ROOF_TOOLBAR') is not None:
    iface.mainWindow().removeToolBar(_ROOF_TOOLBAR)
    _ROOF_TOOLBAR.deleteLater()
if globals().get('_ROOF_BAND') is not None:
    _ROOF_BAND.reset(QgsWkbTypes.PolygonGeometry)


def is_empty(value):
    return value is None or value == NULL or str(value) == 'NULL'


path, _ = QFileDialog.getOpenFileName(None, 'Choose roofs_to_label.gpkg', '', 'GeoPackage (*.gpkg)')
if not path:
    raise SystemExit('No file chosen.')

project = QgsProject.instance()
for old_layer in project.mapLayersByName('roofs_to_label'):
    project.removeMapLayer(old_layer)
roofs = QgsVectorLayer(f'{path}|layername=roofs_to_label', 'roofs_to_label', 'ogr')
if not roofs.isValid():
    raise SystemExit(f'Could not open the layer "roofs_to_label" in {path}')

for old_layer in project.mapLayersByName('Esri Satellite'):     # re-add, so the zoom limit below applies
    project.removeMapLayer(old_layer)
project.addMapLayer(QgsRasterLayer(SAT_URI, 'Esri Satellite', 'wms'))
project.addMapLayer(roofs)                                   # added last, so it is drawn on top

fill = roofs.renderer().symbol().symbolLayer(0)              # other roofs: no fill, thin yellow outline
fill.setFillColor(QColor(0, 0, 0, 0))
fill.setStrokeColor(QColor('yellow'))
fill.setStrokeWidth(0.4)
roofs.triggerRepaint()

canvas = iface.mapCanvas()
_ROOF_BAND = QgsRubberBand(canvas, QgsWkbTypes.PolygonGeometry)   # the current roof: cyan outline, no fill
_ROOF_BAND.setStrokeColor(QColor('cyan'))
_ROOF_BAND.setFillColor(QColor(0, 0, 0, 0))
_ROOF_BAND.setWidth(3)

LABEL_IDX = roofs.fields().indexOf('label')
# Rotate through districts (1st roof of every district, then the 2nd of every district, ...), so that
# wherever you stop, all districts have about the same number of labels
_seen, _order = {}, []
for f in sorted(roofs.getFeatures(), key=lambda f: f['sample_no']):
    _seen[f['district']] = _seen.get(f['district'], 0) + 1
    _order.append((_seen[f['district']], f['district'], f.id()))
FIDS = [fid for _, _, fid in sorted(_order)]
first_empty = next((i for i, fid in enumerate(FIDS) if is_empty(roofs.getFeature(fid)['label'])), len(FIDS) - 1)
STATE = {'i': first_empty}


def labelled_count():
    return sum(1 for f in roofs.getFeatures() if not is_empty(f['label']))


def show():
    """Zoom to the current roof, outline it in cyan and say where we are."""
    f = roofs.getFeature(FIDS[STATE['i']])
    box = f.geometry().boundingBox()
    # some space around the roof, and never closer than ~120 m across (closer zooms have no satellite photo)
    box.grow(max(max(box.width(), box.height()) * 1.5, 0.0005))
    to_map = QgsCoordinateTransform(roofs.crs(), canvas.mapSettings().destinationCrs(), project)
    canvas.setExtent(to_map.transformBoundingBox(box))
    _ROOF_BAND.setToGeometry(f.geometry(), roofs)
    canvas.refresh()
    current = 'not labelled yet' if is_empty(f['label']) else f"{int(f['label'])} = {MEANING.get(int(f['label']), '?')}"
    iface.messageBar().clearWidgets()
    iface.messageBar().pushMessage(
        f"Roof {STATE['i'] + 1} of {len(FIDS)}",
        f"{f['district']} | now: {current} | done: {labelled_count()}/{len(FIDS)} | use the Roof labelling buttons",
        level=Qgis.Info, duration=0)


def move(step):
    STATE['i'] = min(max(STATE['i'] + step, 0), len(FIDS) - 1)
    show()


def set_label(value):
    """Save the label for the current roof, then go to the next one."""
    if not roofs.isEditable():
        roofs.startEditing()
    roofs.changeAttributeValue(FIDS[STATE['i']], LABEL_IDX, value)
    if not roofs.commitChanges():
        iface.messageBar().pushMessage('Not saved', '; '.join(roofs.commitErrors()), level=Qgis.Critical)
        return
    if STATE['i'] == len(FIDS) - 1:
        iface.messageBar().clearWidgets()
        iface.messageBar().pushMessage('All roofs done',
                                       f'{labelled_count()} labelled. Close QGIS, then upload the .gpkg file '
                                       'back to Google Drive.', level=Qgis.Success, duration=0)
        return
    move(1)


def stop():
    _ROOF_BAND.reset(QgsWkbTypes.PolygonGeometry)
    iface.mainWindow().removeToolBar(_ROOF_TOOLBAR)
    iface.messageBar().clearWidgets()
    iface.messageBar().pushMessage('Labelling paused',
                                   f'{labelled_count()} of {len(FIDS)} labelled and saved. Run the script again to continue.',
                                   level=Qgis.Info, duration=0)


_ROOF_TOOLBAR = iface.addToolBar('Roof labelling')
for text, key, action in (('1  Good', '1', lambda: set_label(1)), ('0  Bad', '0', lambda: set_label(0)),
                          ('2  Not a building', '2', lambda: set_label(2)), ('Skip', 'N', lambda: move(1)),
                          ('Back', 'B', lambda: move(-1)), ('Stop', 'Q', stop)):
    button = QAction(text, iface.mainWindow())
    button.setShortcut(key)                          # the keys may also work once you click on the map
    button.triggered.connect(action)
    _ROOF_TOOLBAR.addAction(button)

show()
