"""Three clear panels: top view of one roof (size, shape, tree rings), side view (tree height), hexagon (crowding)."""
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle, RegularPolygon, Polygon

F = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/'
AMB, DARK, GREEN, DGREEN, GREY = '#f6b73c', '#1a1a19', '#2f8f4e', '#14532d', '#6b6a66'
rng = np.random.default_rng(11)
fig = plt.figure(figsize=(11, 4.4))
A = fig.add_axes([0.0, 0.0, 0.40, 1.0])
B = fig.add_axes([0.40, 0.0, 0.31, 1.0])
C = fig.add_axes([0.71, 0.0, 0.29, 1.0])
for a in (A, B, C):
    a.set_aspect('equal')
    a.axis('off')
    a.set_xlim(-3.55, 3.55) if a is A else a.set_xlim(-2.3, 2.3)
    a.set_ylim(-3.45, 1.45) if a is A else a.set_ylim(-1.45, 2.45)
TAG = dict(boxstyle='round,pad=0.2', edgecolor=DARK, linewidth=0.9)


def head(a, num, title, sub, y=2.65):
    a.text(0, y, f'{num}  {title}', ha='center', va='center', fontsize=13, fontweight='bold', color=DARK)
    a.text(0, y - 0.4, sub, ha='center', va='center', fontsize=9.5, color=GREY)


# ===== panel 1: top view of the roof and three tree rings =====
CY = -1.0                                    # circle centre (kept low so the heading stays clear)
for r, col in ((2.0, '#cfe8d6'), (1.35, '#a9d5b6'), (0.7, '#7fbe93')):
    A.add_patch(Circle((0, CY), r, facecolor=col, edgecolor=DARK, linewidth=1.3))
for _ in range(40):
    ang, rad = rng.uniform(0, 2 * np.pi), np.sqrt(rng.uniform(0.07, 1)) * 1.85
    x, y = rad * np.cos(ang), CY + rad * np.sin(ang)
    if np.hypot(x, y - CY) < 0.82:
        continue
    A.add_patch(Circle((x, y), rng.uniform(0.09, 0.18), facecolor=GREEN, edgecolor=DGREEN, linewidth=0.8, zorder=3))
A.add_patch(Polygon([[-0.5, CY - 0.3], [0.5, CY - 0.3], [0.5, CY + 0.1], [0.2, CY + 0.1], [0.2, CY + 0.32], [-0.5, CY + 0.32]],
                    closed=True, facecolor=AMB, edgecolor=DARK, linewidth=2.3, zorder=6))
for r, lab in ((0.7, '28 m'), (1.35, '140 m'), (2.0, '300 m')):                    # ring tags on the bottom edge
    A.text(0, CY - r, lab, ha='center', va='center', fontsize=8.5, fontweight='bold', color=DARK, zorder=9, bbox=dict(**TAG, facecolor='white'))
A.annotate('', xy=(0.5, CY + 0.55), xytext=(-0.5, CY + 0.55), arrowprops=dict(arrowstyle='<->', color=DARK, lw=1.4), zorder=8)
A.text(0, CY + 0.85, 'SIZE', ha='center', va='center', fontsize=9.5, fontweight='bold', color=DARK, zorder=9, bbox=dict(**TAG, facecolor='#fff3d6'))
A.text(1.55, CY + 0.0, 'SHAPE', ha='left', va='center', fontsize=9.5, fontweight='bold', color=DARK, zorder=9, bbox=dict(**TAG, facecolor='#fff3d6'))
A.annotate('', xy=(0.52, CY - 0.05), xytext=(1.5, CY), arrowprops=dict(arrowstyle='-|>', color=DARK, lw=1.2), zorder=8)

# ===== panel 2: side view =====
B.add_patch(Rectangle((-2.3, -0.55), 4.6, 0.55, facecolor='#d9d6cf', edgecolor='none'))
B.add_patch(Rectangle((-0.6, 0), 1.2, 0.8, facecolor=AMB, edgecolor=DARK, linewidth=2))
B.add_patch(Polygon([[-0.7, 0.8], [0.7, 0.8], [0, 1.15]], closed=True, facecolor='#e08a1e', edgecolor=DARK, linewidth=1.4))
for x, h in ((-1.7, 2.0), (-1.15, 1.1), (1.45, 1.75), (1.95, 0.9)):
    B.add_patch(Rectangle((x - 0.05, 0), 0.1, h * 0.6, facecolor='#6b4a2b', edgecolor='none'))
    B.add_patch(Circle((x, h * 0.6 + 0.22), 0.3 + 0.06 * h, facecolor=GREEN, edgecolor=DGREEN, linewidth=1))
B.annotate('', xy=(1.45, 0.0), xytext=(1.45, 1.6), arrowprops=dict(arrowstyle='<->', color=DARK, lw=1.6), zorder=8)
B.text(0.35, 1.75, 'tallest tree', ha='center', va='center', fontsize=9, fontweight='bold', color=DARK, zorder=9, bbox=dict(**TAG, facecolor='#dff0e3'))
B.annotate('', xy=(1.4, 1.5), xytext=(0.95, 1.7), arrowprops=dict(arrowstyle='-|>', color=DARK, lw=1.1), zorder=8)
B.text(0, -0.28, 'within 5 m and 15 m of the roof', ha='center', va='center', fontsize=8.5, color=DARK)
B.text(0, -0.95, 'also: share of ground under trees\n5 m or taller (within 15 m, 30 m)', ha='center', va='center', fontsize=8.5, color=DARK)

# ===== panel 3: hexagon =====
C.add_patch(RegularPolygon((0, 0.85), 6, radius=1.25, orientation=0, facecolor='#fde08a', edgecolor=DARK, linewidth=2.2))
for _ in range(12):
    dx, dy = rng.uniform(-0.75, 0.75, 2)
    if np.hypot(dx, dy) > 0.78:
        continue
    w = rng.uniform(0.12, 0.2)
    C.add_patch(Rectangle((dx - w / 2, 0.85 + dy - w / 2), w, w, facecolor=DARK, edgecolor='white', linewidth=0.7, zorder=3))
C.text(0, -0.65, 'count the buildings inside\neach hexagon (about 0.1 km²)', ha='center', va='center', fontsize=8.5, color=DARK)
C.text(0, -1.2, '+ area type: town / village / open', ha='center', va='center', fontsize=8.5, fontweight='bold', color=DARK, bbox=dict(**TAG, facecolor='#fff3d6'))

fig.add_artist(plt.Line2D([0.40, 0.40], [0.06, 0.94], color='#c9c8c3', lw=1))
fig.add_artist(plt.Line2D([0.71, 0.71], [0.06, 0.94], color='#c9c8c3', lw=1))
fig.savefig(F + 'features_on_roof.png', dpi=200, facecolor='white')
print('ok')
