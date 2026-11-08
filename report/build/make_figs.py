"""Figures for the final report (white background, print-friendly, one blue + one orange)."""
import pathlib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

ROOT = pathlib.Path(r'D:\claude_anti\Rooftop solar potential(b_spatial)')
DATA = ROOT / 'dashboard' / 'data'
OUT = ROOT / 'report' / 'figures'
BLUE, ORANGE, GREY, DARK = '#2a78d6', '#eb6834', '#898781', '#1a1a19'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False,
                     'axes.edgecolor': '#898781', 'axes.labelcolor': DARK, 'xtick.color': DARK, 'ytick.color': DARK})
dist = pd.read_csv(DATA / 'district.csv')


def save(fig, name):
    fig.savefig(OUT / name, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print('saved', name)


# 2 Spark vs Sedona
sv = pd.read_csv(DATA / 'spark_vs_sedona.csv')
fig, ax = plt.subplots(figsize=(7.5, 3.8))
x = np.arange(len(sv)); w = 0.38
ax.bar(x - w / 2, sv.plain_spark_s, w, color=GREY, label='Plain Spark (Python UDF with Shapely, no spatial index)')
ax.bar(x + w / 2, sv.sedona_s, w, color=BLUE, label='Apache Sedona (spatial join)')
ax.set_yscale('log')
ax.set_xticks(x); ax.set_xticklabels(['10 thousand', '100 thousand', '1 million', '19.4 million\n(plain Spark estimated)'])
ax.set_ylabel('Seconds (log scale)')
for i, r in sv.iterrows():
    ax.text(i + w / 2, r.sedona_s * 1.15, f'{r.speedup_x:.1f}x faster', ha='center', fontsize=8.5, color=BLUE)
ax.legend(frameon=False, fontsize=8.5, loc='upper left')
ax.set_title('Same district join, two methods', loc='left', fontsize=11)
save(fig, 'fig_spark_sedona.png')

# 3 districts
d = dist.sort_values('twh_real')
fig, ax = plt.subplots(figsize=(7.5, 4.8))
y = np.arange(len(d)); h = 0.38
ax.barh(y + h / 2, d.twh_max, h, color=GREY, label='Technical maximum')
ax.barh(y - h / 2, d.twh_real, h, color=BLUE, label='Realistic (at most 3 kW per good roof)')
ax.set_yticks(y); ax.set_yticklabels(d.district); ax.set_xlabel('Electricity per year (TWh)')
for i, v in enumerate(d.twh_real):
    ax.text(v + 0.15, i - h / 2, f'{v:.2f}', va='center', fontsize=8, color=DARK)
ax.legend(frameon=False, fontsize=9, loc='lower right')
save(fig, 'fig_districts.png')

# 4 sensitivity
sens = pd.read_csv(DATA / 'usable_sensitivity.csv')
sens['label'] = sens.method.str.replace('  <- main', ' (main)').str.replace('old guess: 60% of every suitable roof', 'Earlier guess: 60% of every roof')
fig, ax = plt.subplots(figsize=(7.5, 4.0))
cols = [BLUE if 'main' in m else '#9ec5f4' for m in sens.method]
cols[0] = GREY
ax.barh(np.arange(len(sens))[::-1], sens.gw, color=cols, height=0.7)
ax.set_yticks(np.arange(len(sens))[::-1]); ax.set_yticklabels(sens.label, fontsize=8.5)
for i, v in zip(np.arange(len(sens))[::-1], sens.gw):
    ax.text(v + 0.8, i, f'{v:.1f}', va='center', fontsize=8.5)
ax.set_xlabel('Technical maximum capacity (GW)')
save(fig, 'fig_sensitivity.png')

# 5 model: accuracy + importance
acc = pd.read_csv(DATA / 'rf_accuracy.csv')
imp = pd.read_csv(DATA / 'rf_feature_importance.csv').head(8)
names = {'log_area': 'Roof size', 'tall_pct_15m': 'Tall trees within 15 m', 'ai_confidence': 'Outline confidence',
         'chm_roof_max': 'Tallest tree at roof', 'compactness': 'Roof shape', 'tall_pct_30m': 'Tall trees within 30 m',
         'tree_140m': 'Tree cover ~140 m', 'log_crowding': 'Building crowding'}
short = {'RF without tree height - leave one district out': 'Random Forest, no tree height',
         'RF with tree height - leave one district out': 'Random Forest, with tree height',
         'RF with tree height - random 5-fold': 'Random Forest, random 5-fold',
         'RF with tree height - real buildings only (no label 2)': 'Random Forest, real buildings only',
         'Simple rule (>= 40 m2 and seen built-up)': 'Simple rule (>= 40 m2, built-up)',
         'Always say "not good" (baseline)': 'Always "not good"', 'Always say "good" (baseline)': 'Always "good"'}
fig, (a1, a2) = plt.subplots(1, 2, figsize=(10, 3.9), gridspec_kw={'width_ratios': [1.15, 1]})
a1.barh(np.arange(len(acc))[::-1], acc.accuracy * 100, color=[BLUE if 'Forest' in short[c] else GREY for c in acc.check], height=0.65)
a1.set_yticks(np.arange(len(acc))[::-1]); a1.set_yticklabels([short[c] for c in acc.check], fontsize=8.5)
for i, v in zip(np.arange(len(acc))[::-1], acc.accuracy * 100):
    a1.text(v + 0.8, i, f'{v:.0f}%', va='center', fontsize=8.5)
a1.set_xlim(0, 85); a1.set_xlabel('Accuracy (%)  [leave-one-district-out unless stated]'); a1.set_title('Accuracy', loc='left', fontsize=10.5)
a2.barh(np.arange(len(imp))[::-1], imp.importance * 100, color=BLUE, height=0.65)
a2.set_yticks(np.arange(len(imp))[::-1]); a2.set_yticklabels([names[f] for f in imp.feature], fontsize=8.5)
a2.set_xlabel('Share of the model\'s decisions (%)'); a2.set_title('What the model looks at', loc='left', fontsize=10.5)
fig.tight_layout()
save(fig, 'fig_model.png')

# 6 map of hexagon centres
hx = pd.read_csv(DATA / 'hex7.csv')
fig, ax = plt.subplots(figsize=(5.4, 7.4))
o = hx.sort_values('mw_real')
sc = ax.scatter(o.lon, o.lat, c=o.mw_real, s=7, cmap='YlOrBr', vmin=0, vmax=o.mw_real.quantile(0.98), linewidths=0)
ax.set_aspect(1 / np.cos(np.radians(10.5))); ax.set_xlabel('Longitude'); ax.set_ylabel('Latitude')
cb = fig.colorbar(sc, shrink=0.6, pad=0.02); cb.set_label('Realistic solar capacity per hexagon (MW)')
ax.set_title('Rooftop solar capacity, realistic scenario (7,070 hexagons of ~5 km²)', fontsize=9.5, loc='left')
save(fig, 'fig_map.png')

# 7 free share by roof size
fs = pd.read_csv(DATA / 'usable_share_by_size.csv')
fs = fs[~fs.roof_size.str.contains('ALL')]
fig, ax = plt.subplots(figsize=(6.5, 3.0))
ax.bar([s[2:].replace(' (', '\n(') for s in fs.roof_size], fs.free_share_pct, color=BLUE, width=0.6)
for i, v in enumerate(fs.free_share_pct):
    ax.text(i, v + 1.5, f'{v:.0f}%', ha='center', fontsize=9)
ax.set_ylim(0, 105); ax.set_ylabel('Free share of roof (%)')
save(fig, 'fig_freeshare.png')

# 8 PostGIS
pg = pd.read_csv(DATA / 'postgis_query_times.csv')
fig, ax = plt.subplots(figsize=(7.5, 3.3))
labels = ['Radius query (1 km),\nno index', 'Radius query (1 km),\nGiST index', 'Wayanad count,\nnormal table', 'Wayanad count,\npartitioned table']
vals = pg.ms.iloc[:4].values
ax.bar(range(4), vals, color=[GREY, BLUE, GREY, BLUE], width=0.6)
ax.set_yscale('log'); ax.set_xticks(range(4)); ax.set_xticklabels(labels, fontsize=8.5); ax.set_ylabel('Milliseconds (log scale)')
for i, v in enumerate(vals):
    ax.text(i, v * 1.2, f'{v:,.0f} ms', ha='center', fontsize=8.5)
save(fig, 'fig_postgis.png')

# 9 crop of Spark timeline for the report
from PIL import Image
im = Image.open(OUT / 'spark_timeline.png')
im.crop((0, 0, im.width, 640)).save(OUT / 'fig_spark_timeline_crop.png')
print('saved fig_spark_timeline_crop.png')
