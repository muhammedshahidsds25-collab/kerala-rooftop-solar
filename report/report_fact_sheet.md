# Fact sheet for writing the report in your own words

Write each section yourself, in your own sentences. Use these facts and numbers; don't copy wording from the old report.
Tip: write it the way you'd explain it to Sir in the viva. Short, simple sentences in your own style are fine.

Keep from the old report, unchanged: title block (page 1 table), Tables 1-5, Figures 1-4, references.

---

## 1. Introduction (about 3 paragraphs + 2 goals)
- Kerala: makes ~30% of own electricity, buys the rest
- Rooftop solar installed: 946.9 MW (~0.95 GW), 152,000 systems, Oct 2024
- PM Surya Ghar subsidy: up to ₹78,000 for 3 kW
- Little free land for solar farms; roofs already exist
- Problem: homestead houses, coconut/jack/mango trees, shade; map area ≠ usable roof
- Why big data: ~13 M buildings (polygons); tree-height map ~82 billion pixels; too large for a desktop workflow → Google Colab, Spark, Sedona
- Goal 1: how many roofs suitable, free area, GW, TWh, CO₂, savings, by district and area type
- Goal 2: use course tools (Sedona/Spark, PostGIS, MapReduce, K-means, FP-Growth, Random Forest) and see what each adds

## 2. Methodology
**2.1 Data** (Table 1 stays)
- Overture Maps buildings, release 2026-10-21.0: 19.4 M polygons, 1.7 GB; 84% Google, 15% OSM, 2% Microsoft
- Overture divisions: 14 districts
- Global Solar Atlas PVOUT (~1 km)
- ESA WorldCover 2021 (10 m)
- Meta/WRI canopy height (~1 m), 19 tiles
- Areas/distances in UTM 43N (EPSG:32643)

**2.2 District join + cleaning**
- Download box included TN + Karnataka parts
- Sedona `ST_Contains` on building centre, broadcast join; districts cut with `ST_SubDivideExplode` (up to 4,000 vertices)
- Invalid shapes: 0 · exact duplicates (geometry hash): 0 · removed < 10 m²: 15,538 · low-confidence flagged: 2,213,255
- Inside Kerala 13,004,903 → kept 12,989,365 roofs · ~1,175 km² roof · median 69 m²
- Saved as GeoParquet split by district

**2.3 Roof features** (Figure 1 = hexagon + tree-ring diagram)
- Area, compactness (4πA/P²)
- Yield 1,460-1,578 kWh/kW/year
- Tree share within ~28, 140, 300 m (WorldCover)
- Tree height: tallest within ~5 and 15 m; share under trees ≥ 5 m within 15 and 30 m
- Crowding: buildings per H3 hexagon (res 9, ~0.1 km²)
- Outline confidence
- Sedona raster join 385.7 min → NumPy 42 s; canopy map 19.9 min

**2.4 Labels**
- 300 random roofs (21/district + 6); your QGIS tool; good / bad / not a building
- You labelled 294; Gemini labelled the same roofs separately
- Agreed 218 of 293 (74%), kappa 0.50
- 75 disagreements re-checked blind → 72 decided
- Gold labels 290: 156 good, 134 not good

**2.5 Random Forest**
- Spark MLlib, 200 trees, depth 6, balanced class weights, 15 features
- Solar yield left out (acts like location)
- Leave-one-district-out test (train 13, test 1, ×14)
- All 12,989,365 roofs judged in 11 min

**2.6 Free area + scenarios**
- Outline → metres, `ST_Buffer` −0.6 m, minus 8 m² stair room/tank
- Area check ratio 0.9997
- 10 m² = 1 kW
- Maximum = all free area; realistic = max 3 kW per roof
- CO₂ factor 0.727 t/MWh (CEA v20)
- Sensitivity: edge 0.3-1.0 m, stair room 0-12 m²

**2.7 Processing + analysis**
- Plain Spark (Shapely, no index) vs Sedona: 10k / 100k / 1 M / full
- MapReduce (RDD) vs Spark SQL
- PostgreSQL 16 / PostGIS 3.4, 13 M roofs, 3.3 GB; GiST index; LIST partitions by district
- K-means on 260,447 hexagons, k chosen by silhouette
- FP-Growth support 0.05, confidence 0.6
- Dashboard: 3D map, district compare, savings calculator

## 3. Results (Tables 2-5, Figures 2-4 stay)
- Accuracy 0.672 (AUC 0.719) on unseen districts vs 0.538 always "suitable", 0.583 simple rule
- Without tree height 0.679 → tree height didn't help
- Most important: roof size, then nearby trees, outline confidence
- Errors balance: 43 wrongly accepted, 52 wrongly rejected → totals more reliable than single roofs
- Suitable: 6,692,930 roofs (51.5%)
- Free share: < 50 m² 40% · 50-120 65% · 120-500 78% · > 500 91% · average 74%; 6.4 min for 6.69 M roofs
- Realistic: 18.5 GW · 28.2 TWh/yr · 20.5 Mt CO₂ · = 88% of Kerala's ~32 TWh need · 20× installed
- Maximum: 64.3 GW · 98.1 TWh (range 51-78 GW)
- Districts: Ernakulam 3.68 TWh (70% suitable), Thrissur 3.00, Malappuram 2.90 (1.60 M buildings, 43% suitable), Wayanad lowest 0.67
- K-means k = 3 (silhouette 0.699): towns 3.34 M roofs, 87 m², 64% trees · villages 9.46 M, 68 m², 94% trees · open land 0.19 M
- Towns 78% suitable, villages 42%; villages still 11.3 of 18.5 GW
- FP-Growth 186 rules → 36; town + built-up → few trees (conf 0.77, lift 4.19); low-confidence outline → small roof (0.73, 2.0); village → many trees (0.62, 1.5)
- Sedona 3.5-5.9× faster; GiST 450×; partitions 10×; Spark SQL 10× MapReduce; KNN 0.4 ms
- Spark UI: 12,989,365 rows (1.1 GB) read, ~1.4 GB shuffled, 8 tasks, 1.5 GB cached
- One family: 3 kW Ernakulam, ₹65,000/kW, after subsidy ~₹1.17 lakh, ~4,580 units/yr, ~₹21,000 saved/yr, payback ~5.6 years

## 4. Discussion
- Half of roofs suitable; area isn't the limit, cost/grid/willingness are
- WRI India: 10.9 GW total solar (practical limits) vs your 18.5 GW realistic vs 64 GW maximum
- Most robust: district ranking + town vs village gap
- Tools: index matters most; right method > engine (6.4 h → 42 s); Spark SQL > MapReduce; caching; Colab needed
- Limits: 290 labels, 74% agreement, you did the blind check; flat footprint (no slope/shade/strength); different data years; one Colab machine
- Future: second labeller + more labels, 3D slope/shade, field check, cluster, grid + income data

## AI-use statement (add near the end; check the course rule first)
Say in your own words what AI tools you used: e.g. Gemini as a second roof labeller, and Claude for coding help, notebook writing and drafting.
