"""Crop the screenshots to the part that matters for each slide."""
from PIL import Image

F = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/'
crops = {
    'shot_qgis_label': ('crop_qgis_label', (190, 175, 1920, 985)),   # labelling buttons + map with cyan roof
    'shot_esri': ('crop_trees', (560, 420, 1420, 905)),               # houses under coconut / homestead trees
    'shot_colab09': ('crop_colab', (80, 330, 1880, 860)),             # notebook cells + output
}
for src, (dst, box) in crops.items():
    im = Image.open(F + src + '.png').crop(box)
    im.save(F + dst + '.png')
    print(dst, im.size)
im = Image.open(F + 'spark_sql_plan.png')
print('sql plan', im.size)
im.crop((0, 0, im.width, min(im.height, 1300))).save(F + 'crop_sql_plan.png')
