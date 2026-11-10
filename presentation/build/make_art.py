"""Cover hexagon art and a 'night lights' map of sampled roofs for the slides."""
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

D = 'D:/claude_anti/Rooftop solar potential(b_spatial)/dashboard/data/'
F = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/'
asp = 1 / np.cos(np.radians(10.5))

h = pd.read_csv(D + 'hex7.csv').sort_values('mw_real')
cm = LinearSegmentedColormap.from_list('amber', ['#3b2a10', '#86560f', '#e09412', '#f6b73c', '#fde08a'])
fig = plt.figure(figsize=(5, 7), facecolor='#1f1f1d')
ax = fig.add_axes([0, 0, 1, 1])
ax.set_facecolor('#1f1f1d')
ax.axis('off')
ax.scatter(h.lon, h.lat, c=h.mw_real, cmap=cm, vmin=0, vmax=h.mw_real.quantile(0.97), s=14, marker='h', linewidths=0)
ax.set_aspect(asp)
fig.savefig(F + 'cover_kerala_hex.png', dpi=220, facecolor='#1f1f1d', bbox_inches='tight', pad_inches=0.1)

s = pd.read_csv(D + 'roof_sample.csv')
fig = plt.figure(figsize=(5, 7), facecolor='#0d0d0d')
ax = fig.add_axes([0, 0, 1, 1])
ax.set_facecolor('#0d0d0d')
ax.axis('off')
ax.scatter(s.lon, s.lat, s=0.6, c='#fde08a', alpha=0.55, linewidths=0)
ax.set_aspect(asp)
fig.savefig(F + 'roofs_nightlights.png', dpi=220, facecolor='#0d0d0d', bbox_inches='tight', pad_inches=0.1)
print('ok')
