"""Pack the dashboard CSVs (from notebook 12's dashboard_data.zip, unzipped in dashboard/data) into web/data.js.

Run:  python dashboard/web/build_data.py
"""
import csv
import json
import pathlib

HERE = pathlib.Path(__file__).parent
DATA = HERE.parent / 'data'


def rows(name):
    path = DATA / name
    if not path.exists():
        return []
    with open(path, encoding='utf-8') as f:
        return list(csv.DictReader(f))


def num(v):
    try:
        x = float(v)
        return int(x) if x.is_integer() else x
    except (TypeError, ValueError):
        return v


def table(name, keep=None):
    return [{k: num(v) for k, v in r.items() if keep is None or k in keep} for r in rows(name)]


hexes = rows('hex7.csv')
sample = rows('roof_sample.csv')
out = {
    # one array per column keeps the file small
    'hex': {k: [num(r[k]) for r in hexes] for k in
            ('h3', 'district', 'roofs', 'pct_suitable', 'mw_max', 'gwh_max', 'mw_real', 'gwh_real', 'avg_tree_m')},
    'roofs': [[round(float(r['lon']), 5), round(float(r['lat']), 5), 1 if r['suitable'] == 'True' else 0,
               num(r['area_m2']), num(r['kw_max'])] for r in sample],
    'district': table('district.csv'),
    'area_type': table('area_type.csv'),
    'sensitivity': table('usable_sensitivity.csv'),
    'accuracy': table('rf_accuracy.csv', {'check', 'accuracy', 'roc_auc', 'precision', 'recall'}),
    'importance': table('rf_feature_importance.csv'),
    'share_by_size': table('usable_share_by_size.csv'),
    'spark_vs_sedona': table('spark_vs_sedona.csv'),
    'postgis': table('postgis_query_times.csv'),
    'geo': json.loads((DATA / 'districts.geojson').read_text(encoding='utf-8')),
}
for r in out['district']:
    r['kwh_per_kw'] = round(r['twh_real'] * 1e9 / (r['gw_real'] * 1e6)) if r['gw_real'] else 0
text = 'window.DATA = ' + json.dumps(out, separators=(',', ':')) + ';\n'
(HERE / 'data.js').write_text(text, encoding='utf-8')
print(f"data.js: {len(text) / 1e6:.2f} MB | {len(hexes):,} hexagons | {len(sample):,} roofs | "
      f"{len(out['district'])} districts")
assert len(out['district']) == 14 and len(hexes) > 1000, 'dashboard data looks incomplete'
