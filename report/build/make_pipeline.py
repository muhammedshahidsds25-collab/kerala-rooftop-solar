"""Method flow diagram for the report."""
import pathlib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUT = pathlib.Path(r'D:\claude_anti\Rooftop solar potential(b_spatial)\report\figures')
BLUE, ORANGE, DARK = '#2a78d6', '#eb6834', '#1a1a19'
B, O = '#cde2fb', '#fde0d3'
fig, ax = plt.subplots(figsize=(9.5, 6.6))
ax.set_xlim(0, 10)
ax.set_ylim(0, 7.2)
ax.axis('off')
boxes = {
    'ov': (0.2, 5.8, 'Overture Maps buildings\n19.4 M polygons (GeoParquet)', B),
    'se': (3.7, 5.8, 'Sedona: district join\n+ cleaning -> 13.0 M roofs', B),
    'fe': (7.2, 5.8, 'Roof features: size, shape,\nsun, trees, crowding', B),
    'pg': (3.7, 3.9, 'PostGIS\nGiST index, partitions', O),
    'km': (7.2, 3.9, 'K-means (H3 hexagons)\n+ FP-Growth rules', O),
    'lb': (0.2, 2.0, 'Labels: 290 roofs\n(human + AI, blind check)', O),
    'rf': (3.7, 2.0, 'Random Forest\n(Spark MLlib)', B),
    'fa': (7.2, 2.0, 'Sedona ST_Buffer\nfree roof area', B),
    're': (3.7, 0.1, 'Potential per roof, hexagon,\ndistrict -> dashboard', B),
}
for x, y, t, c in boxes.values():
    ax.add_patch(FancyBboxPatch((x, y), 2.6, 1.0, boxstyle='round,pad=0.03,rounding_size=0.12', fc=c,
                                ec=BLUE if c == B else ORANGE, lw=1.4))
    ax.text(x + 1.3, y + 0.5, t, ha='center', va='center', fontsize=9.5, color=DARK)


def arrow(p, q):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle='-|>', mutation_scale=14, color=DARK, lw=1.2, shrinkA=0, shrinkB=0))


arrow((2.85, 6.3), (3.65, 6.3))
arrow((6.35, 6.3), (7.15, 6.3))
arrow((5.0, 5.75), (5.0, 4.95))
arrow((8.5, 5.75), (8.5, 4.95))
arrow((7.4, 3.85), (6.3, 3.05))
arrow((2.85, 2.5), (3.65, 2.5))
arrow((6.35, 2.5), (7.15, 2.5))
arrow((5.0, 1.95), (5.0, 1.15))
arrow((7.4, 1.95), (6.3, 0.95))
ax.text(0.2, 0.75, 'Blue: Spark / Sedona / MLlib steps', fontsize=8.5, color=BLUE, va='center')
ax.text(0.2, 0.35, 'Orange: PostGIS, clustering, labelling', fontsize=8.5, color=ORANGE, va='center')
fig.savefig(OUT / 'fig_pipeline.png', dpi=200, bbox_inches='tight', facecolor='white')
print('saved fig_pipeline.png')
