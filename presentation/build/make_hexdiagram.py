"""Illustration: buildings inside H3 hexagons (crowding) and tree rings around one roof (shade)."""
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import RegularPolygon, Rectangle, Circle, Polygon

F = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/'
AMB, DARK, GREEN, BLUE, GREY = '#f6b73c', '#1a1a19', '#2f8f4e', '#2a78d6', '#898781'
rng = np.random.default_rng(4)
fig, (a, b) = plt.subplots(1, 2, figsize=(10, 4.3), gridspec_kw={'width_ratios': [1.1, 1]})
for ax in (a, b):
    ax.set_aspect('equal')
    ax.axis('off')

# ---- left: hexagons with buildings ----
R = 1.0                                       # hexagon radius
centres = [(0, 0)] + [(np.sqrt(3) * R * np.cos(np.radians(60 * k)), np.sqrt(3) * R * np.sin(np.radians(60 * k))) for k in range(6)]
counts = [14, 9, 4, 11, 2, 6, 3]              # dense town centre, sparser edges (illustration)
shade = {14: '#fde08a', 11: '#f6c45c', 9: '#f6b73c', 6: '#e8a52e', 4: '#c98b22', 3: '#a8721c', 2: '#86560f'}
for (cx, cy), n in zip(centres, counts):
    a.add_patch(RegularPolygon((cx, cy), 6, radius=R, orientation=0, facecolor=shade[n], edgecolor='#1f1f1d', linewidth=2.2, alpha=0.9))
    for _ in range(n):
        while True:
            dx, dy = rng.uniform(-0.7, 0.7, 2)
            if np.hypot(dx, dy) < 0.68 and dy > -0.5:
                break
        w = rng.uniform(0.11, 0.17)
        a.add_patch(Rectangle((cx + dx - w / 2, cy + dy - w / 2), w, w, facecolor='#1f1f1d', edgecolor='white', linewidth=0.8, zorder=3))
    a.text(cx, cy - 0.68, f'{n}', ha='center', va='center', fontsize=13, fontweight='bold', color=DARK, zorder=4, bbox=dict(boxstyle='circle,pad=0.25', facecolor='white', edgecolor='#1f1f1d', linewidth=1))
a.set_xlim(-3.0, 3.0)
a.set_ylim(-2.7, 2.7)

# ---- right: rings of trees around one roof ----
b.set_xlim(-3.2, 3.2)
b.set_ylim(-2.7, 2.7)
for r, lab, col in ((2.3, '300 m', '#cfe8d6'), (1.45, '140 m', '#a5d3b3'), (0.75, '28 m', '#74b98b')):
    b.add_patch(Circle((0, 0), r, facecolor=col, edgecolor='#1f1f1d', linewidth=1.6, alpha=0.85))
for r, lab, ang in ((2.3, '300 m', 215), (1.45, '140 m', 300), (0.75, '28 m', 150)):
    b.text(r * np.cos(np.radians(ang)), r * np.sin(np.radians(ang)), lab, ha='center', va='center', fontsize=10, fontweight='bold', color=DARK, zorder=8,
           bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='#1f1f1d', linewidth=1))
for _ in range(34):
    ang, rad = rng.uniform(0, 2 * np.pi), np.sqrt(rng.uniform(0.04, 1)) * 2.1
    x, y = rad * np.cos(ang), rad * np.sin(ang)
    if np.hypot(x, y) < 0.32:
        continue
    b.add_patch(Circle((x, y), rng.uniform(0.09, 0.17), facecolor=GREEN, edgecolor='#14532d', linewidth=0.8, alpha=0.95, zorder=3))
b.add_patch(Rectangle((-0.17, -0.12), 0.34, 0.24, facecolor=AMB, edgecolor=DARK, linewidth=2, zorder=5))
b.text(0.0, 0.0, '', zorder=6)
b.annotate('the roof', xy=(0.12, 0.1), xytext=(2.0, 2.2), fontsize=11, fontweight='bold', color=DARK,
           arrowprops=dict(arrowstyle='-|>', color=DARK, lw=1.6), zorder=7)

fig.savefig(F + 'hex_tree_diagram.png', dpi=200, bbox_inches='tight', facecolor='white', pad_inches=0.12)
print('ok')
