# Method notes and limitations (ready to paste into the report)

## 1. Training labels

The Random Forest is a supervised model, so it needs roofs with a known answer. A random sample of 300 roofs
(21 per district + 6 extra, picked by a fixed hash of the roof id) was labelled on satellite imagery as
1 = good, 0 = bad (shaded, too small, broken) or 2 = not a building.

Each roof was labelled twice, independently:
- by the author (294 roofs labelled) in QGIS on Esri World Imagery;
- by an AI vision model (Google Gemini Flash Lite, 296 roofs) shown the same Esri image of each roof.

The two agreed on good vs not good for 218 of 293 roofs (74%, Cohen's kappa 0.50). For the 75 roofs where
they disagreed, the author judged each roof again **blind** (without seeing either earlier label, in random
order); 72 were decided and 3 were too unclear and left out.

**Final ("gold") labels = 218 agreed roofs + 72 blind-checked roofs = 290 roofs (156 good, 134 not good).**
Gold labels were chosen because two independent judgements that agree are more reliable than one, and a
blind second look resolves the rest. (They were not chosen for giving a higher model accuracy: each label set
is tested against itself, so accuracies of different label sets cannot show which set is more correct.)

Use of the labels: (a) to train the model, (b) to test it with leave-one-district-out cross-validation.

## 2. Result robustness

The model was trained three times, on the author's labels, on the AI labels and on the gold labels.
The Kerala total stayed in a narrow range: **52–57 GW, 79–87 TWh per year**. The gold-label model gives
52.0 GW and 79.4 TWh per year (6.69 million suitable roofs, 51.5%).

Sanity check: 53.8% of the labelled roofs are good and the model calls 51.5% of all roofs suitable. Its
errors on the test districts nearly cancel (43 roofs wrongly called good, 52 wrongly called not good), so
district and state totals are more reliable than the answer for any single roof.

**Sensitivity and comparison.** The potential scales directly with the usable share of each roof. At 60%
(used here) it is 52.0 GW / 79.4 TWh; at a more cautious 30% it is 26.0 GW / 39.7 TWh. Published estimates
for Kerala that include practical limits are much lower: WRI India puts Kerala's total solar potential at
10.9 GW, and CSTEP's district assessment finds about 14 GW of usable solar and wind combined. Those figures
include practical, economic and grid limits, while this study gives the physical upper bound from every
suitable roof. Kerala's yearly electricity need is about 32 TWh (CEA projection for 2024-25).

**Realistic scenario.** A fully used suitable roof (7.8 kW on average) would make about 11,900 kWh per year,
around four times what a Kerala household uses (about 2,400–3,000 kWh). Households size systems to their own
use, and PM Surya Ghar subsidises up to 3 kW. If every suitable roof installed 3 kW, the total would be
6.69 million × 3 kW ≈ 20 GW and about 31 TWh per year, close to Kerala's yearly need. Real Kerala systems
also often yield 1,300–1,450 kWh per kW per year (monsoon cloud, heat, dust), 5–10% below the Global Solar
Atlas value used here.

**Free area from each roof's own shape (notebook 11, replaces the 60% guess).** For the 6.69 million
suitable roofs, Apache Sedona transformed each outline to metres (UTM 43N; area check ratio 0.9997), shrank it
by a 0.6 m edge strip (`ST_Buffer` with a negative distance) and subtracted 8 m² for the stair room and water
tank (6.4 min, about 17,500 roofs per second). The free share is 74% of roof area on average: 40% for small roofs
(< 50 m²), 65% for medium, 78% for large and 91% for very large roofs. A sensitivity check with edge strips of
0.3–1.0 m and stair rooms of 0–12 m² gives 51–78 GW.

| Level | GW | TWh per year |
|---|---|---|
| Technical maximum (free area from roof shape, main setting) | 64.3 (51–78) | 98.1 (79–119) |
| Old single guess (60% of each suitable roof) | 52.0 | 79.4 |
| Realistic (each suitable roof installs its free area, at most 3 kW) | 18.5 | 28.2 |

The realistic level, 28.2 TWh per year, is about 88% of Kerala's yearly need (about 32 TWh) and about
20 times the installed rooftop capacity (946.9 MW in 152,000 systems, October 2024).

## 3. Accuracy and what limits it

Leave-one-district-out accuracy is 0.68 (ROC AUC 0.71–0.72), against 0.54 for always answering "good"
and 0.58 for a simple rule (≥ 40 m² and seen as built-up).

Adding real tree height from the Meta/WRI 1 m canopy height map (Tolan et al. 2024) did **not** raise
accuracy (0.679 without, 0.672 with). Tree height alone separates good from bad roofs about as well as the
ESA WorldCover tree share around the roof, so it carries mostly the same information. The accuracy ceiling
comes mainly from (1) uncertain labels: two careful labellers agreed on only 74% of roofs, and (2) roof
properties that these datasets cannot see, such as roof material, slope, condition and exact shade.

## 4. Limitations

- **Blind check bias:** the disagreements were re-judged by the author, who was also one of the two
  labellers, so the tie-break may lean towards the author's own view. A third, independent judge would remove this.
- **Different dates:** building outlines are from imagery of about 2022–23, tree heights from about
  2018–20, and labelling imagery from about 2025 (Esri, with Google imagery for part of the blind check).
  Some roofs or trees changed in between.
- **Upper bound:** a suitable roof counts with its free area (0.6 m edge strip and 8 m² stair room removed)
  at 10 m² per kWp; other obstacles (extra tanks, AC units, clothes lines), partial shading and grid,
  structural or ownership limits are not modelled, and sloped roofs use their flat footprint. Kerala uses about 30 TWh per
  year, so the 79 TWh figure is a technical potential, not a forecast.
- **Per-district accuracy** rests on about 20 labelled roofs per district (0.57–0.81), so it is uncertain.
- **No untouched test set:** some choices (removing the PVOUT feature, the label set) were made after
  seeing results on the same 290 roofs, so the reported accuracy may be slightly optimistic.
- **FP-Growth on predictions** (notebooks 08/10) describes what the model's suitable roofs have in
  common; it explains the model and is not independent evidence. The FP-Growth rules on raw features
  (notebook 07) are independent of the model.
- **Imagery terms:** Esri World Imagery was used for labelling and sent to the AI labeller; Google imagery
  was only viewed in QGIS during the blind check. Screenshots in this report use Esri imagery with credit.

## Data volume

| Dataset | Rows / pixels | Stored size |
|---|---|---|
| Overture buildings, Kerala box (raw GeoParquet) | 19,355,143 polygons | 1.7 GB |
| Clean buildings inside Kerala (Sedona, partitioned) | 12,989,365 polygons | 1.9 GB |
| Roof features (area, shape, sun, trees, crowding) | 12,989,365 rows | 2.5 GB (+ 2.2 GB v2) |
| Roof predictions (Random Forest, one run) | 12,989,365 rows | 1.2 GB per run (3 label sets) |
| Usable roof area (Sedona buffers) | 6,692,930 rows | 0.27 GB |
| Meta canopy height (processed in Colab, not stored) | 19 tiles, ~82 billion pixels | ~11 GB download |
| Canopy features per roof | 12,989,365 rows | 0.28 GB |
| ESA WorldCover (5 tiles) / tree % raster | 10 m pixels | ~220 MB / 14 MB |
| Global Solar Atlas PVOUT | ~1 km pixels | 345 MB download |
| PostGIS roofs table (notebook 06) | 13 M rows | 3.3 GB |
| H3 hexagon clusters | 260,447 hexagons | 15 MB |

Total stored on Google Drive: about 13.8 GB; total processed including temporary downloads: about 25 GB.

**Spark UI evidence (notebook 12, figures in `report/figures/`).** The main query (2.6 min) scanned 112
Parquet files (1,137.7 MiB, 12,989,365 roof predictions) and 56 files (262.2 MiB, 6,692,930 free-area rows),
shuffled 1,098 MiB + 297 MiB into 8 partitions, joined them with a SortMergeJoin (12,989,365 rows), computed
each roof's H3 cell with Sedona `ST_H3CellIDs`, and cached the result in memory (1,549 MiB, 8 partitions,
100% cached). Later summaries reused this cache (the "skipped" stages), so they took seconds instead of
minutes. Execution: Spark 4.1.3 in local mode on Google Colab (one driver, 2 cores, 8 GB); the same code
runs unchanged on a cluster.

## Data credits

Overture Maps Foundation (buildings, divisions) · Global Solar Atlas (PVOUT, © World Bank / Solargis) ·
ESA WorldCover 2021 (CC BY 4.0) · Meta & WRI global canopy height map (Tolan et al. 2024, CC BY 4.0) ·
Esri World Imagery (labelling).
