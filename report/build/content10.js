// ---------- content (10-page version: Introduction, Methodology, Result, Discussion) ----------
const center = (t, size, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 60 },
  children: [new TextRun({ text: t, size, bold: !!o.bold, color: o.color })] });
const title = [
  new Paragraph({ spacing: { before: 1400 }, children: [] }),
  center('Spatial Big Data Analytics for Rooftop Solar Potential in Kerala', 44, { bold: true, color: BLUE, after: 200 }),
  center('using Apache Sedona and Spark MLlib', 30, { color: '444444', after: 700 }),
  center('Project Report', 26, { bold: true }),
  center('Spatial Bigdata Analytics (M5221357)', 24, { after: 800 }),
  center('Submitted by', 22, { color: '555555' }),
  center('Muhammed Shahid S', 28, { bold: true }),
  center('Roll No. 253308', 24),
  center('M.Sc. Data Science and Geoinformatics', 24, { after: 600 }),
  center('Supervisor', 22, { color: '555555' }),
  center('Manoj Kumar Sir', 26, { bold: true, after: 800 }),
  center('Digital University Kerala', 26, { bold: true }),
  center('November 2026', 22, { after: 500 }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Code: ', size: 18 }),
    link('github.com/muhammedshahidsds25-collab/kerala-rooftop-solar', 'https://github.com/muhammedshahidsds25-collab/kerala-rooftop-solar')] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dashboard: ', size: 18 }),
    link('muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/', 'https://muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/')] }),
];

const body = [];
const add = (...x) => x.flat().forEach((e) => body.push(e));

// 1 Introduction
add(H1('1. Introduction'),
  P('Kerala generates only about 30% of the electricity it uses and buys the rest, while land for large solar farms is scarce. Rooftop solar avoids the land problem, and the PM Surya Ghar scheme subsidises up to ₹78,000 for a 3 kW home system. Kerala had about 0.95 GW of rooftop solar in 152,000 systems in October 2024. Planners need to know where the remaining suitable roofs are and how much they could produce.'),
  P('Answering this for the whole state needs every building, not a sample: more than 13 million polygons combined with several raster layers (sunshine, tree cover, tree height). This is too large for a laptop and needs spatial big-data tools. The project therefore builds a cloud spatial data lake: GeoParquet files on Google Drive, processed with Apache Sedona and Spark in Google Colab, stored in PostGIS for indexed queries, modelled with Spark MLlib and presented in an interactive dashboard.'),
  P('**Objectives:** (1) assign every building in Kerala to a district and clean the data at scale; (2) describe each roof by size, shape, sunshine, tree cover, tree height and crowding; (3) classify every roof as suitable or not with a Spark MLlib model tested on unseen districts; (4) measure each suitable roof\'s free area with spatial operations; (5) estimate capacity, electricity, CO₂ avoided and household payback; and (6) compare Spark with Sedona, MapReduce with Spark SQL, and unindexed with indexed PostGIS queries. The study reports **technical potential**; grid limits, structure, ownership and adoption are not modelled.'));

// 2 Methodology
add(H1('2. Methodology'),
  H2('2.1 Data and architecture'),
  P('Figure 1 shows the pipeline; twelve Colab notebooks implement it (Python, Java 17, PySpark 4.1.3, Apache Sedona 1.9.1, Spark local mode on 2 cores and about 13 GB RAM). Table 1 lists the data and its volume.'),
  ...figure('fig_pipeline.png', 430, 'Figure 1. Method flow from building footprints to potential per roof, hexagon and district.', 'Pipeline diagram'),
  tcap('Table 1. Data used'),
  table(['Data', 'Content', 'Volume'], [
    ['Overture Maps buildings (release 2026-10-21.0)', 'Building polygons; 84% Google Open Buildings, 15% OSM, 2% Microsoft', '19.4 M polygons, 1.7 GB'],
    ['Overture Maps divisions', '14 district polygons', '-'],
    ['Global Solar Atlas PVOUT', 'Yearly yield, ~1 km pixels', '345 MB'],
    ['ESA WorldCover 2021', 'Land cover at 10 m (tree share)', '5 tiles, ~220 MB'],
    ['Meta / WRI canopy height', 'Tree height at ~1 m (Tolan et al., 2024)', '19 tiles, ~82 billion pixels, ~11 GB'],
    ['Roof labels', '300 random roofs judged on Esri World Imagery', '290 usable'],
  ], [2900, 3700, 2426]),
  gap(),
  H2('2.2 District join, cleaning and benchmarks (Modules 1-2)'),
  P('Each building was assigned to a district with Sedona\'s spatial join (`ST_Contains` on the building centre, district polygons cut into small pieces with `ST_SubDivideExplode`). Cleaning repaired invalid geometries (0 found), searched for exact duplicates by geometry hash (0), removed 15,538 buildings under 10 m² and flagged 2,213,255 low-confidence outlines. Of 19,355,143 buildings in the download box, 13,004,903 lie in Kerala and **12,989,365 roofs** were kept (about 1,175 km² of roof, median 69 m²), written as GeoParquet partitioned by district in 9.8 minutes.'),
  P('The same join was run with plain Spark (a Python function using Shapely, testing each building against the 14 districts, no spatial index) and with Sedona. Both matched the same buildings; Sedona was 3.5 to 5.9 times faster (Figure 2). District totals computed as a MapReduce job on RDDs took 97.6 s, against 9.6 s for one Spark SQL `GROUP BY`.'),
  ...figure('fig_spark_sedona.png', 380, 'Figure 2. Plain Spark (Python and Shapely, no index) against Apache Sedona for the same join (log scale).'),
  H2('2.3 Roof features'),
  P('Each roof received: footprint area and compactness (4πA/P²); yearly yield from the Global Solar Atlas (1,460 to 1,578 kWh per kWp); the WorldCover tree share within about 28, 140 and 300 m; four tree-height measures from the Meta 1 m canopy map (tallest tree within ~5 and ~15 m, share of ground under trees ≥ 5 m within 15 and 30 m); building crowding in its H3 hexagon (resolution 9); and outline confidence. The per-roof Sedona raster join took 385.7 minutes; the same lookups written as NumPy array indexing took 42 seconds, and the 82-billion-pixel canopy map was processed tile by tile in 19.9 minutes.'),
  H2('2.4 PostGIS storage, indexing and partitioning (Module 2)'),
  P('The 13 million roofs were loaded into PostgreSQL 16 / PostGIS 3.4 (3.3 GB). A GiST index cut a 1 km radius query around Kochi from 20,462 ms to 45.4 ms (about 450 times), and LIST partitioning by district cut a Wayanad query from 1,238 ms to 117 ms (about 10 times). A nearest-neighbour query took 0.4 ms, fast enough for interactive use.'),
  H2('2.5 Clustering and association rules (Module 3)'),
  P('**K-means** grouped the 260,447 H3 hexagons by roof count, roof size, built-up share and tree cover. The silhouette score was best for k = 3 (0.699): **towns** (3.34 M roofs, median 87 m², 64% trees within 300 m), **homestead villages** (9.46 M roofs, 68 m², 94% trees) and **sparse open land** (0.19 M roofs). **FP-Growth** (support 0.05, confidence 0.6) found 186 rules, 36 after pruning; for example, built-up town roofs have low surrounding tree cover (confidence 0.77, lift 4.19), and low-confidence outlines are usually small roofs (0.73, lift 2.0).'),
  H2('2.6 Labels and Random Forest classification (Module 3)'),
  P('300 roofs were drawn at random (21 per district plus 6, fixed hash) and judged as good (large enough, mostly sunny), bad or not a building, independently by the author in QGIS and by an AI vision model (Google Gemini). They agreed on good against not good for 218 of 293 roofs (74%, Cohen\'s kappa 0.50). The 75 disagreements were re-judged blind by the author (72 decided). The resulting **gold labels** have 290 roofs: 156 good and 134 not good. Because the author did the tie-break, it may lean towards the author\'s view.'),
  P('A Spark MLlib Random Forest (200 trees, depth 6, balanced class weights) uses 15 features (Section 2.3 plus the K-means area type). Accuracy was measured by **leave-one-district-out** validation: train on 13 districts, test on the 14th, 14 times. The final model, trained on all 290 labels, classified all 12,989,365 roofs in 11 minutes.'),
  H2('2.7 Free roof area and scenarios (Modules 1 and 4)'),
  P('For each suitable roof, Sedona transformed the outline to UTM zone 43N, shrank it inwards by a 0.6 m edge strip (`ST_Buffer` with a negative distance) and subtracted 8 m² for a stair room and water tank; 6,692,930 roofs were processed in 6.4 minutes. Capacity uses 10 m² per kWp and yield from the Global Solar Atlas. The **technical maximum** uses all free area; the **realistic** case caps each roof at 3 kW (the PM Surya Ghar size). CO₂ avoided uses 0.727 t CO₂ per MWh (CEA CO₂ Baseline Database v20). The edge strip (0.3 to 1.0 m) and stair room (0 to 12 m²) were varied as a sensitivity test.'));

// 3 Result
add(H1('3. Result'),
  H2('3.1 Kerala'),
  P('The model classified **6,692,930 roofs (51.5%)** as suitable. Table 2 gives the potential.'),
  tcap('Table 2. Rooftop solar potential of Kerala'),
  table(['Level', 'Capacity', 'Electricity / year', 'CO₂ avoided / year'], [
    ['Technical maximum (all free area)', '64.3 GW (51-78)', '98.1 TWh', '71 Mt'],
    ['**Realistic (≤ 3 kW per suitable roof)**', '**18.5 GW**', '**28.2 TWh**', '**20.5 Mt**'],
    ['Installed rooftop solar, Oct 2024', '0.95 GW', '-', '-'],
    ['Kerala\'s yearly requirement (CEA, 2024-25)', '-', '~32 TWh', '-'],
  ], [3900, 1700, 1700, 1726], { right: [1, 2, 3] }),
  gap(),
  P('The realistic case equals about **88% of Kerala\'s yearly electricity need** and about twenty times today\'s installed capacity. The free share of suitable roofs, calculated from their outlines, rises with size: 40% under 50 m², 65% for 50-120 m², 78% for 120-500 m² and 91% above 500 m² (average 74%).'),
  H2('3.2 Districts, towns and villages'),
  P('Ernakulam leads (3.68 TWh realistic; 70% of roofs suitable), followed by Thrissur (3.00 TWh) and Malappuram (2.90 TWh); Wayanad is lowest (0.67 TWh) (Figure 3). Malappuram has the most buildings (1.60 million) but only 43% are suitable, because most are in tree-covered villages. In towns 78% of roofs are suitable, against 42% in homestead villages, yet villages still hold 11.3 GW of the 18.5 GW because they contain most roofs. Figure 4 shows the hotspots around Kochi, Thiruvananthapuram, Thrissur, Kozhikode and Kannur.'),
  ...figure('fig_districts.png', 400, 'Figure 3. Yearly electricity potential by district.'),
  ...figure('fig_map.png', 250, 'Figure 4. Realistic capacity per H3 hexagon (~5 km²).'),
  H2('3.3 Model accuracy'),
  P('On unseen districts the Random Forest classified **67% of roofs correctly** (ROC AUC 0.72), against 54% for always answering "suitable" and 58% for a simple rule (≥ 40 m² and built-up). The most important feature is roof size, followed by tree measures and outline confidence (Figure 5). Adding Meta tree height did **not** improve accuracy (0.679 without, 0.672 with), because it repeats the information in the WorldCover tree share. Training on the author\'s labels, the AI labels or the gold labels changed the state total by under 10%, and the model\'s errors nearly cancel (43 roofs wrongly accepted, 52 wrongly rejected), so district and state totals are more reliable than single-roof answers.'),
  ...figure('fig_model.png', 470, 'Figure 5. Accuracy against simple alternatives (left) and the features the model relies on (right).'),
  H2('3.4 Dashboard and Spark evidence'),
  P('An interactive web dashboard (Figure 6) shows a 3D hexagon map, headline numbers, district ranking and comparison, a household savings calculator and a story mode. A 3 kW system in Ernakulam (₹65,000 per kW, full subsidy, 200 units a month at home) saves about ₹21,000 a year and pays back in about 5.6 years. In the Spark UI of the dashboard-data job, the main query scanned 1,138 MiB of predictions (12.99 M rows) and 262 MiB of free areas, shuffled about 1.4 GB, joined them and cached 1,549 MiB in memory; later queries reused the cache and finished in seconds.'),
  ...figure('dashboard_main.png', 470, 'Figure 6. The dashboard: 3D map, headline numbers and district ranking.'));

// 4 Discussion
add(H1('4. Discussion'),
  P('**Comparison.** Published Kerala estimates are lower because they include practical limits: WRI India gives 10.9 GW of total solar potential and CSTEP about 14 GW of usable solar and wind. CEEW\'s national study of homes found 637 GW of technical rooftop potential falling to 118 GW when matched to household use. This project\'s 64 GW is a physical maximum; its 18.5 GW realistic case lies between that and the practical estimates. The clearest message is that roof **area** is not Kerala\'s constraint: suitable roofs could host twenty times today\'s capacity.'),
  P('**Course objectives.** The project covers the syllabus: spatial big data and MapReduce with Spark against Sedona (CO1); cleaning, partitioning and storage in GeoParquet and PostGIS (CO2); clustering, association rules and classification at scale (CO3); and an environment-and-economics case study with CO₂, subsidy and payback (CO4).'),
  P('**Challenges met.** Spark 4.1 and the Sedona package shipped clashing copies of the JTS geometry library (fixed by putting Sedona\'s jars on the driver class path); the per-roof raster join took 6.4 hours until replaced by NumPy lookups (42 s); WorldCover tree cover was saturated (100% for 69% of roofs) under Kerala\'s homestead canopy; and the author\'s 8 GB laptop could not hold the data, so all heavy steps ran in Colab.'),
  P('**Limitations.** Only 290 labelled roofs (about 20 per district) were available, and two careful labellers agreed on just 74%, which caps accuracy near 67-68%. The blind tie-break by the author may lean towards the author\'s view, and no untouched test set was kept. Imagery dates differ between footprints, canopy (~2018-20) and labelling imagery (~2025). Free area uses the flat footprint without slope, orientation, partial shade or structural limits, and Global Solar Atlas yields may be 5-10% above real Kerala output. Spark ran in local mode, so scaling to a cluster is untested. The PostGIS layer is an interactive query store, not a streaming real-time engine.'),
  P('**Conclusion and future work.** About half of Kerala\'s 13 million roofs are suitable for solar; they could realistically host about 18.5 GW and produce 28 TWh a year, avoiding about 20 Mt of CO₂, with Ernakulam, Thrissur, Malappuram and the towns as the hotspots. Future work: an independent third labeller and thousands more labels, roof slope and shade from 3D data, field validation of free area, a multi-node cluster run, and grid and income data to estimate adoption.'),
  H2('References'),
  ...[
    'Breiman, L. (2001). Random forests. *Machine Learning*, 45(1), 5-32.',
    'Central Electricity Authority (2024). CO₂ Baseline Database for the Indian Power Sector, version 20.',
    'CEEW (2023). *Mapping India\'s Residential Rooftop Solar Potential.* New Delhi.',
    'Gagnon, P., et al. (2016). *Rooftop Solar Photovoltaic Technical Potential in the United States.* NREL/TP-6A20-65298.',
    'Han, J., Pei, J., & Yin, Y. (2000). Mining frequent patterns without candidate generation. *ACM SIGMOD*.',
    'Overture Maps Foundation. Buildings and Divisions, release 2026-10-21.0; Global Solar Atlas 2.0 (World Bank, Solargis); ESA WorldCover 2021.',
    'Tolan, J., et al. (2024). Very high resolution canopy height maps from RGB imagery. *Remote Sensing of Environment*, 300, 113888.',
    'Yu, J., Zhang, Z., & Sarwat, M. (2019). Spatial data management in Apache Spark: the GeoSpark perspective and beyond. *GeoInformatica*, 23, 37-78.',
  ].map((t) => new Paragraph({ children: runs(t, { size: 18 }), spacing: { after: 20, line: 240 }, alignment: AlignmentType.LEFT,
    indent: { left: 300, hanging: 300 } })));

