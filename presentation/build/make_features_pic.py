"""Four panels: size & shape, tree cover (continuous canopy + 28 m zones around 3 houses), tree height, crowding."""
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle, RegularPolygon, Polygon
from scipy.ndimage import gaussian_filter

F = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/'
AMB, DARK, GREEN, DGREEN, GREY = '#f6b73c', '#1a1a19', '#2f8f4e', '#14532d', '#6b6a66'
CANOPY, CANOPY_IN = '#5aa86d', '#1f6b35'
TAG = dict(boxstyle='round,pad=0.22', edgecolor=DARK, linewidth=0.9)
rng = np.random.default_rng(7)

fig = plt.figure(figsize=(12.5, 4.4))
cuts = [0.0, 0.16, 0.55, 0.78, 1.0]
S, T, H, C = [fig.add_axes([cuts[i], 0.0, cuts[i + 1] - cuts[i], 1.0]) for i in range(4)]
for a in (S, T, H, C):
    a.set_aspect('equal')
    a.axis('off')

# ===== panel S: size and shape (same area, different shape) =====
S.set_xlim(-1.6, 1.6); S.set_ylim(-2.75, 2.45)
S.add_patch(Rectangle((-0.7, 0.55), 1.4, 1.4, facecolor=AMB, edgecolor=DARK, linewidth=2))
S.annotate('', xy=(0.7, 2.12), xytext=(-0.7, 2.12), arrowprops=dict(arrowstyle='<->', color=DARK, lw=1.3))
S.text(0, 2.32, '10 m', ha='center', fontsize=8.5, color=DARK)
S.text(0, 1.25, '100 m²', ha='center', va='center', fontsize=9.5, fontweight='bold', color=DARK)
S.text(0, 0.22, 'compact: 0.79\neasy to fit panels', ha='center', va='center', fontsize=8.5, color=DARK)
S.add_patch(Rectangle((-1.4, -1.25), 2.8, 0.45, facecolor=AMB, edgecolor=DARK, linewidth=2))
S.text(0, -1.03, '100 m²', ha='center', va='center', fontsize=9, fontweight='bold', color=DARK)
S.text(0, -1.55, '4 m × 25 m', ha='center', va='center', fontsize=8.5, color=DARK)
S.text(0, -2.2, 'thin: 0.37\nharder to use', ha='center', va='center', fontsize=8.5, color=DARK)

# ===== panel T: tree cover on a realistic canopy map =====
W, Hh, step = 340.0, 230.0, 1.0                        # metres, schematic village
xs = np.arange(-W / 2, W / 2, step); ys = np.arange(-Hh / 2, Hh / 2, step)
X, Y = np.meshgrid(xs, ys)
noise = gaussian_filter(rng.normal(size=X.shape), 11)
noise = (noise - noise.mean()) / noise.std()
field = noise + 1.6 * (-X / (W / 2))                   # dense canopy on the left, open on the right
canopy = field > 0.25
from scipy.signal import fftconvolve
R = 28.0
k = np.arange(-R, R + step, step); KX, KY = np.meshgrid(k, k); disk = (KX ** 2 + KY ** 2 <= R ** 2).astype(float)
share = fftconvolve(canopy.astype(float), disk, mode='same') / disk.sum()     # tree share in a 28 m zone, every point
def pick(xmin, xmax, target):
    ok = (X > xmin) & (X < xmax) & (np.abs(Y) < Hh / 2 - 60) & ~canopy
    d = np.where(ok, np.abs(share - target), np.inf)
    i, j = np.unravel_index(np.argmin(d), d.shape)
    return float(X[i, j]), float(Y[i, j])
houses = {'A': pick(-W / 2 + 45, -55, 0.72), 'B': pick(-35, 45, 0.35), 'C': pick(70, W / 2 - 45, 0.0)}
for hx, hy in houses.values():                         # clear only the house footprint itself
    canopy[(np.abs(X - hx) <= 8) & (np.abs(Y - hy) <= 7)] = False
T.set_xlim(-W / 2, W / 2); T.set_ylim(-Hh / 2 - 42, Hh / 2)
T.add_patch(Rectangle((-W / 2, -Hh / 2), W, Hh, facecolor='#ece6d6', edgecolor='none'))   # bare ground / fields
T.plot([-W / 2, -40, 40, W / 2], [-75, -60, -70, -52], color='#cfc8b5', lw=7, solid_capstyle='butt', zorder=1)   # road
T.contourf(X, Y, canopy.astype(float), levels=[0.5, 1.5], colors=[CANOPY], zorder=2)
for _ in range(16):                                    # other houses in open spots
    px, py = rng.uniform(-W / 2 + 15, W / 2 - 15), rng.uniform(-Hh / 2 + 15, Hh / 2 - 15)
    j, i = int((px + W / 2) / step), int((py + Hh / 2) / step)
    if canopy[i, j] or min(np.hypot(px - hx, py - hy) for hx, hy in houses.values()) < 40:
        continue
    T.add_patch(Rectangle((px - 5, py - 4), 10, 8, facecolor='#b9b4a8', edgecolor='#6b6a66', linewidth=0.6, zorder=3))
for name, (hx, hy) in houses.items():
    inside = (X - hx) ** 2 + (Y - hy) ** 2 <= R ** 2
    pct = round(100 * canopy[inside].mean())
    ring = Circle((hx, hy), R, facecolor='none', edgecolor=DARK, linewidth=1.6, linestyle='--', zorder=6)
    T.add_patch(ring)
    clip = Circle((hx, hy), R, transform=T.transData)
    cs = T.contourf(X, Y, (canopy & inside).astype(float), levels=[0.5, 1.5], colors=[CANOPY_IN], zorder=5)
    for coll in cs.collections if hasattr(cs, 'collections') else [cs]:
        coll.set_clip_path(clip)
    T.add_patch(Rectangle((hx - 6, hy - 5), 12, 10, facecolor=AMB, edgecolor=DARK, linewidth=1.8, zorder=7))
    houses[name] = (hx, hy, pct)
labels = {'A': ('house A\nclose to trees', -20), 'B': ('house B\nat the edge', 1), 'C': ('house C\nin the open', 1)}
for name, (hx, hy, pct) in houses.items():
    txt, _ = labels[name]
    T.text(hx, hy + R + 22, txt, ha='center', va='center', fontsize=8.5, fontweight='bold', color=DARK, zorder=9,
           bbox=dict(**TAG, facecolor='white'))
    T.text(hx, hy - R - 15, f'{pct}% trees', ha='center', va='center', fontsize=10, fontweight='bold', color=DARK, zorder=9,
           bbox=dict(**TAG, facecolor='#dff0e3' if pct >= 50 else ('#fff3d6' if pct >= 15 else '#ffffff')))
# legend strip under the map
ly = -Hh / 2 - 24
T.add_patch(Rectangle((-W / 2 + 4, ly - 6), 16, 12, facecolor=CANOPY, edgecolor='none'))
T.text(-W / 2 + 26, ly, 'tree canopy', va='center', fontsize=8.5, color=DARK)
T.add_patch(Circle((-W / 2 + 112, ly), 7, facecolor='none', edgecolor=DARK, linestyle='--', linewidth=1.2))
T.text(-W / 2 + 124, ly, '28 m zone around a roof (also 140 m, 300 m)', va='center', fontsize=8.5, color=DARK)

# ===== panel H: side view (tree height) =====
H.set_xlim(-2.3, 2.3); H.set_ylim(-1.45, 2.45)
H.add_patch(Rectangle((-2.3, -0.55), 4.6, 0.55, facecolor='#d9d6cf', edgecolor='none'))
H.add_patch(Rectangle((-0.6, 0), 1.2, 0.8, facecolor=AMB, edgecolor=DARK, linewidth=2))
H.add_patch(Polygon([[-0.7, 0.8], [0.7, 0.8], [0, 1.15]], closed=True, facecolor='#e08a1e', edgecolor=DARK, linewidth=1.4))
for x, h in ((-1.7, 2.0), (-1.15, 1.1), (1.45, 1.75), (1.95, 0.9)):
    H.add_patch(Rectangle((x - 0.05, 0), 0.1, h * 0.6, facecolor='#6b4a2b', edgecolor='none'))
    H.add_patch(Circle((x, h * 0.6 + 0.22), 0.3 + 0.06 * h, facecolor=GREEN, edgecolor=DGREEN, linewidth=1))
H.annotate('', xy=(1.45, 0.0), xytext=(1.45, 1.6), arrowprops=dict(arrowstyle='<->', color=DARK, lw=1.6), zorder=8)
H.text(0.35, 1.75, 'tallest tree', ha='center', va='center', fontsize=9, fontweight='bold', color=DARK, zorder=9, bbox=dict(**TAG, facecolor='#dff0e3'))
H.annotate('', xy=(1.4, 1.5), xytext=(0.95, 1.7), arrowprops=dict(arrowstyle='-|>', color=DARK, lw=1.1), zorder=8)
H.text(0, -0.28, 'within 5 m and 15 m of the roof', ha='center', va='center', fontsize=8.5, color=DARK)
H.text(0, -0.95, 'also: share of ground under trees\n5 m or taller (within 15 m, 30 m)', ha='center', va='center', fontsize=8.5, color=DARK)

# ===== panel C: hexagon (crowding) =====
C.set_xlim(-2.0, 2.0); C.set_ylim(-1.45, 2.45)
C.add_patch(RegularPolygon((0, 0.85), 6, radius=1.25, orientation=0, facecolor='#fde08a', edgecolor=DARK, linewidth=2.2))
for _ in range(12):
    dx, dy = rng.uniform(-0.75, 0.75, 2)
    if np.hypot(dx, dy) > 0.78:
        continue
    w = rng.uniform(0.12, 0.2)
    C.add_patch(Rectangle((dx - w / 2, 0.85 + dy - w / 2), w, w, facecolor=DARK, edgecolor='white', linewidth=0.7, zorder=3))
C.text(0, -0.65, 'count the buildings inside\neach hexagon (about 0.1 km²)', ha='center', va='center', fontsize=8.5, color=DARK)
C.text(0, -1.2, '+ area type: town / village / open', ha='center', va='center', fontsize=8.5, fontweight='bold', color=DARK, bbox=dict(**TAG, facecolor='#fff3d6'))

for x in cuts[1:-1]:
    fig.add_artist(plt.Line2D([x, x], [0.06, 0.94], color='#c9c8c3', lw=1))
fig.savefig(F + 'features_on_roof.png', dpi=200, facecolor='white')
print({k: v[2] for k, v in houses.items()})
