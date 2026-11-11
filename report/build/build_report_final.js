const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
  AlignmentType, LevelFormat, Footer, Header, PageNumber, BorderStyle, TabStopType, ExternalHyperlink,
} = require('docx');

const FIG = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/';
const OUT = process.argv[2];
const FONT = 'Times New Roman';
const ACC = '000000';                 // all headings black
const W = 9638;                       // text width, A4 with 2 cm margins (DXA)
const SZ = 22;                        // 11 pt body

// ---------- helpers ----------
const runs = (text, base = {}) => {   // **bold**, *italic*, `code`
  const out = []; const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g; let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), ...base, font: 'Consolas', size: (base.size || SZ) - 2 }));
    else if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
};
const P = (text, o = {}) => new Paragraph({ children: runs(text, o.run || {}), alignment: o.align || AlignmentType.JUSTIFIED,
  spacing: { after: 110, line: 264, ...(o.spacing || {}) }, keepNext: o.keepNext });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const list = (items, ref) => items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t),
  spacing: { after: 70, line: 264 }, alignment: AlignmentType.JUSTIFIED }));
const png = (f) => { const b = fs.readFileSync(FIG + f); return { data: b, w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const figure = (file, widthPx, cap) => {
  const { data, w, h } = png(file);
  return [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 100, after: 40 },
    children: [new ImageRun({ type: 'png', data, transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
      altText: { title: cap, description: cap, name: file } })] }),
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 240 }, children: runs(cap, { size: 18, italics: true, color: '000000' }) })];
};
const thin = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const rule = { style: BorderStyle.SINGLE, size: 8, color: '000000' };
const cell = (text, width, o = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders: { top: o.top || none, bottom: o.bottom || thin, left: none, right: none },
  margins: { top: 40, bottom: 40, left: 80, right: 80 },
  children: [new Paragraph({ alignment: o.right ? AlignmentType.RIGHT : AlignmentType.LEFT, keepNext: !o.last,
    children: runs(String(text), { size: 18, bold: !!o.head }) })],
});
const table = (cap, headers, rows, widths, o = {}) => {
  const right = o.right || [];
  return [
    new Paragraph({ keepNext: true, spacing: { before: 120, after: 50 }, children: runs(cap, { size: 19, bold: true }) }),
    new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, widths[i], { head: true, top: rule, right: right.includes(i) })) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i],
        { right: right.includes(i), last: ri === rows.length - 1, bottom: ri === rows.length - 1 ? rule : thin })) })),
    ] }),
    ...(o.note ? [new Paragraph({ spacing: { before: 40, after: 140 }, children: runs(o.note, { size: 17, italics: true, color: '000000' }) })]
      : [new Paragraph({ spacing: { after: 100 }, children: [] })]),
  ];
};
const link = (text, url) => new ExternalHyperlink({ link: url, children: [new TextRun({ text, color: '000000', size: 18 })] });

// ---------- page 1 ----------
const info = (a, b, c, d, first, last) => new TableRow({ children: [[a, 1500, true], [b, 3319, false], [c, 1500, true], [d, 3319, false]].map(([t, w, bold]) =>
  new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: first ? rule : none, bottom: last ? rule : none, left: none, right: none },
    margins: { top: 30, bottom: 30, left: 60, right: 60 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold, size: 21, color: '000000' })] })] })) });
const page1 = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'Rooftop Solar Potential of Kerala from 13 Million Building Footprints', bold: true, size: 32, color: '000000' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
    children: [new TextRun({ text: 'Course Project Report, Spatial Bigdata Analytics (M5221357)', italics: true, size: 24, color: '000000' })] }),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [1500, 3319, 1500, 3319], rows: [
    info('Submitted by', 'Muhammed Shahid S', 'Submitted to', 'Manoj Kumar T K', true, false),
    info('Roll No.', '253308', 'Date', 'November 2026', false, false),
    info('Programme', 'M.Sc. Data Science and Geoinformatics', 'Institution', 'Digital University Kerala', false, true),
  ] }),
  new Paragraph({ spacing: { before: 260, after: 80 }, children: [new TextRun({ text: 'Abstract', bold: true, size: 24, color: '000000' })] }),
  P('This project estimates how much electricity could be produced from the rooftops of Kerala and where this potential is located. I used 19.4 million building footprints from Overture Maps, assigned them to the 14 districts and cleaned them in Apache Sedona, which gave 12,989,365 roofs. Each roof was described by its size, shape, solar yield, tree cover and tree height. To train a classifier, I labelled a random sample of 300 roofs on satellite images (294 could be judged) and checked them against a second labeller. A Random Forest in Spark MLlib was trained on the resulting 290 labels and applied to all roofs. It classified 6.69 million roofs (51.5%) as suitable, and I then used Sedona to calculate the free area of each of them. If every suitable roof installs a system of up to 3 kW, Kerala\'s rooftops could provide 18.5 GW and 28.2 TWh per year, which is about 88% of the state\'s annual electricity requirement. Suitable roofs are much more common in towns (78%) than in tree-covered villages (42%), and Ernakulam, Thrissur and Malappuram have the highest potential.'),
];

// ---------- body ----------
const body = [];
const add = (...x) => x.flat().forEach((e) => body.push(e));

add(H1('1. Introduction'),
  P('Kerala produces only about 30% of the electricity it uses, and the rest is bought from outside the state. Under the PM Surya Ghar scheme, a household can get up to ₹78,000 for a 3 kW rooftop system, but in October 2024 the installed rooftop capacity in Kerala was only about 0.95 GW (152,000 systems). Since there is very little free land for large solar plants, rooftops are an important option for increasing solar generation.'),
  P('However, most houses in Kerala are homesteads surrounded by coconut, jackfruit and mango trees, and many roofs are partly or fully shaded. A roof that looks large on a map may therefore be of little use for solar panels. A single figure for the whole state is not enough for planning: it is also necessary to know how many roofs are actually suitable and in which districts they are.'),
  P('This is also a big data problem. Kerala has about 13 million buildings, each stored as a polygon, and the canopy-height map I used has about 82 billion pixels over the state. Data of this size is too large for a single desktop workflow, so I ran all the heavy processing in Google Colab with Apache Spark and Apache Sedona. The project had two objectives:'),
  ...list(['To estimate how many roofs in Kerala are suitable for solar panels, how much free area each suitable roof has, and what this gives in capacity, electricity generation, CO₂ savings and household savings, for each district and area type.',
    'To carry out the spatial processing with the tools covered in the course (Apache Sedona on Spark, PostGIS, MapReduce, K-means, FP-Growth and Random Forest in Spark MLlib), and to compare what each tool contributes.'], 'goals'));

add(H1('2. Methodology'),
  H2('2.1 Data'),
  P('All the datasets I used are openly available. For area and distance calculations, I projected the data to UTM zone 43N (EPSG:32643).'),
  P('The study area is the state of Kerala (about 38,900 km²), which is divided into 14 districts. Buildings are dense on the coastal plain, while the eastern hill districts (Idukki, Wayanad and parts of Pathanamthitta) have fewer and more scattered buildings. Figure 1 shows the workflow. I wrote each step as a separate Colab notebook, 12 in total. Each notebook saved its output to Google Drive as GeoParquet or CSV files, and the next notebook read these files as its input.'),
  ...figure('fig_pipeline.png', 470, 'Figure 1. Workflow of the project, from building footprints to the potential per roof, hexagon and district. Blue boxes are Spark, Sedona and MLlib steps; orange boxes are PostGIS, clustering and labelling steps.'),
  ...table('Table 1. Data used in the project.', ['Data', 'What it gives', 'Size'], [
    ['Overture Maps buildings (release 2026-10-21.0)', 'Building outlines; 84% from Google Open Buildings, 15% OSM, 2% Microsoft', '19.4 M polygons, 1.7 GB'],
    ['Overture Maps divisions', 'The 14 district boundaries of Kerala', '14 polygons'],
    ['Global Solar Atlas PVOUT', 'Electricity from 1 kW of panels per year, ~1 km pixels', '345 MB'],
    ['ESA WorldCover 2021', 'Land cover at 10 m (tree share around roofs)', '5 tiles, ~220 MB'],
    ['Meta and WRI canopy height', 'Tree height at ~1 m (Tolan et al., 2024)', '19 tiles, ~82 billion pixels'],
    ['My labels', '300 random roofs judged on Esri satellite imagery', '290 usable'],
  ], [3100, 4338, 2200]),
  H2('2.2 District join and cleaning'),
  P('I downloaded the buildings for a rectangular area around Kerala, which also covers parts of Tamil Nadu and Karnataka. Using Apache Sedona, I assigned each building to a district by checking whether its centre point lies inside a district polygon (`ST_Contains` with a broadcast join). The district boundaries have up to 4,000 vertices, so I first split them into smaller parts with `ST_SubDivideExplode`; this keeps the spatial index efficient. During cleaning, I checked the geometries for validity and searched for exact duplicates using a hash of each geometry; neither problem was found. I removed 15,538 buildings smaller than 10 m² and flagged 2,213,255 outlines with low source confidence (below 0.70) without removing them. Of the 13,004,903 buildings inside Kerala, 12,989,365 were kept as roofs, with a total roof area of about 1,175 km² and a median roof size of 69 m². The result was saved as GeoParquet, partitioned by district (Table 2).'),
  ...table('Table 2. Effect of the district join and cleaning steps.', ['Step', 'Buildings'], [
    ['Downloaded for the box around Kerala', '19,355,143'],
    ['Outside Kerala (Tamil Nadu, Karnataka, sea)', '6,350,240'],
    ['Inside Kerala', '13,004,903'],
    ['Invalid geometries / exact duplicates', '0 / 0'],
    ['Removed: smaller than 10 m²', '15,538'],
    ['Kept as roofs', '12,989,365'],
    ['Kept, but flagged as low source confidence (< 0.70)', '2,213,255'],
  ], [6638, 3000], { right: [1], note: 'The join, cleaning and writing of the partitioned GeoParquet took 9.8 minutes in Colab.' }),
  H2('2.3 Describing each roof'),
  P('The following features were calculated for every roof: area and compactness (4πA/P²); annual solar yield at the roof location (1,460-1,578 kWh per kW); share of tree cover within about 28, 140 and 300 m (from WorldCover); four tree-height measures from the Meta 1 m map (the tallest tree within about 5 m and 15 m, and the share of area covered by trees of 5 m or more within 15 m and 30 m); the number of buildings in the same H3 hexagon (resolution 9, about 0.1 km²) as a measure of crowding; and the confidence of the building outline.'),
  P('In the first version, raster values were extracted with Sedona\'s raster join, which took 385.7 minutes. When the same step was rewritten using NumPy array indexing on the full raster, it took only 42 seconds. The canopy height map (about 82 billion pixels) was processed tile by tile using 3 × 3 pixel blocks and took 19.9 minutes.'),
  H2('2.4 Training labels'),
  P('To train the model, labelled examples were needed, and preparing them was the most difficult part of the project. I selected 300 roofs at random (21 per district plus 6) and used a QGIS script that zooms to each roof, so that it could be marked as good (large enough and mostly sunny), bad (shaded, very small or damaged) or not a building. I labelled 294 of these roofs. To check my labels, the same roofs were also judged separately by a Gemini vision model. We agreed on 218 of 293 roofs (74%, kappa 0.50), and I looked again at the 75 roofs where we disagreed, without seeing either answer, and decided 72 of them. The final gold labels contain 290 roofs: 156 good and 134 not good.'),
  H2('2.5 Random Forest classification'),
  P('A Random Forest classifier in Spark MLlib (200 trees, maximum depth 6, balanced class weights) was trained to predict roof suitability from 15 features: the features in Section 2.3 and the area type from K-means (Section 2.7). Solar yield was not used as a feature because it varies only slowly across the state and mainly reflects location. The model was evaluated using leave-one-district-out validation, where it is trained on 13 districts and tested on the remaining one, repeated for all 14 districts. This is stricter than a random split, where test roofs can be very close to training roofs. The final model, trained on all 290 labels, classified all 12,989,365 roofs in 11 minutes.'),
  H2('2.6 Free roof area and scenarios'),
  P('Only part of a roof can be used for panels, because some space is needed along the edges and for the stair room and water tank. Instead of using one fixed percentage for all roofs, the free area was calculated for each roof in Sedona. Each suitable roof outline was converted to metres, reduced inward by 0.6 m using `ST_Buffer` with a negative distance, and a further 8 m² was subtracted for the stair room and tank. The areas in metres matched the original areas (median ratio 0.9997). A value of 10 m² per kW was used to convert free area to capacity. Two scenarios were calculated: a technical maximum, where all free area is used, and a realistic case, where each roof is limited to 3 kW, which is the system size supported by the subsidy. CO₂ savings were calculated using 0.727 t per MWh (CEA CO₂ Baseline Database v20). The edge distance (0.3-1.0 m) and stair room area (0-12 m²) were also varied to test the sensitivity of the results.'),
  H2('2.7 Big data processing and analysis'),
  P('To compare performance, the district join was run with plain Spark (a Python function using Shapely, without a spatial index) and with Sedona\'s spatial join, using samples of 10 thousand, 100 thousand and 1 million buildings as well as the full dataset. District totals were also calculated as a MapReduce job on RDDs and as a single Spark SQL `GROUP BY`. In addition, all 13 million roofs (3.3 GB) were loaded into PostgreSQL 16 with PostGIS 3.4, and a radius query, a district query and a nearest-neighbour query were timed with and without a GiST index and with LIST partitioning by district.'),
  P('For the unsupervised analysis, I applied K-means clustering to 260,447 H3 hexagons, using roof count, roof size, built-up share and tree cover, and chose the number of clusters with the silhouette score. For association rule mining, I represented each roof as a set of simple properties (size class, tree-cover class, crowding class, shape and outline confidence) and ran FP-Growth in Spark MLlib with a minimum support of 0.05 and a minimum confidence of 0.6. Finally, I summarised the results by district and by H3 hexagon and used these summaries in a web dashboard with a 3D map, a district comparison and a household savings calculator.'));

add(H1('3. Results'),
  H2('3.1 Classification accuracy'),
  ...table('Table 3. Accuracy of the Random Forest classifier and simple baselines (290 gold labels).', ['Check', 'Accuracy', 'ROC AUC'], [
    ['Random Forest, leave one district out (final model)', '0.672', '0.719'],
    ['Same, without the tree-height features', '0.679', '0.712'],
    ['Random Forest, random 5-fold split', '0.703', '0.729'],
    ['Simple rule: roof ≥ 40 m² and seen as built-up', '0.583', '0.611'],
    ['Always answer "suitable"', '0.538', '0.500'],
  ], [6038, 1800, 1800], { right: [1, 2], note: 'The labels come from satellite images, judged by me and an AI; there was no field survey.' }),
  P('On districts not used for training, the model classified 67% of roofs correctly, compared with 54% when all roofs are labelled as suitable. Roof size was the most important feature, followed by tree cover near the roof and outline confidence. Adding the Meta tree-height features did not improve the accuracy, probably because they contain much of the same information as the WorldCover tree share. Although 67% accuracy is limited for individual roofs, the errors are almost balanced (43 roofs wrongly classified as suitable and 52 wrongly classified as not suitable), so the totals at district and state level are more reliable than the result for a single roof.'),
  ...figure('fig_model.png', 520, 'Figure 2. Left: accuracy of the Random Forest compared with simple alternatives. Right: the eight features the model relied on most, as a share of its decisions.'),
  H2('3.2 Rooftop solar potential of Kerala'),
  P('In total, 6,692,930 roofs (51.5%) were classified as suitable. The share of free roof area increases with roof size: 40% for roofs below 50 m², 65% for 50-120 m², 78% for 120-500 m² and 91% for roofs above 500 m², with an average of 74%. The free area calculation for all 6.69 million roofs took 6.4 minutes in Sedona.'),
  ...figure('fig_freeshare.png', 360, 'Figure 3. Share of each suitable roof that is free for panels, by roof size (after a 0.6 m edge and 8 m² for the stair room and tank).'),
  ...table('Table 4. Rooftop solar potential of Kerala.', ['Scenario', 'Capacity', 'Electricity / year', 'CO₂ avoided / year'], [
    ['**Realistic: each suitable roof installs up to 3 kW**', '**18.5 GW**', '**28.2 TWh**', '**20.5 Mt**'],
    ['Technical maximum: all free area covered', '64.3 GW', '98.1 TWh', '71 Mt'],
    ['Range of the maximum (edge 0.3-1.0 m, stair room 0-12 m²)', '51-78 GW', '79-119 TWh', '-'],
    ['Installed today (October 2024)', '0.95 GW', '-', '-'],
  ], [4438, 1500, 1800, 1900], { right: [1, 2, 3], note: 'Kerala needs about 32 TWh of electricity a year (CEA projection for 2024-25).' }),
  P('The realistic scenario corresponds to about 88% of Kerala\'s annual electricity requirement and is roughly twenty times the rooftop capacity installed today. The technical maximum is about three times the annual demand. Roof area is therefore not the main limit on rooftop solar in Kerala.'),
  P('The technical maximum depends on the edge strip and stair room area that are assumed. With a 0.3 m edge and no stair room it reaches 77.9 GW; with a 1.0 m edge and a 12 m² stair room it falls to 51.5 GW (Figure 4). My earlier simple assumption of 60% of every roof gave 52.0 GW, which is close to the most cautious setting. The difference is that the free share now depends on the size and shape of each roof.'),
  ...figure('fig_sensitivity.png', 400, 'Figure 4. Technical maximum capacity under different edge-strip and stair-room assumptions. The grey bar is the earlier fixed assumption (60% of every roof); the dark bar is the setting used in this report (0.6 m edge, 8 m² stair room).'),
  H2('3.3 Results by district and area type'),
  P('Ernakulam has the highest potential: 3.68 TWh per year in the realistic scenario, with 70% of its roofs suitable. Thrissur (3.00 TWh) and Malappuram (2.90 TWh) follow, and Wayanad has the lowest value (0.67 TWh). Malappuram has the largest number of buildings (1.60 million), but only 43% of them are suitable, because many lie in villages with dense tree cover. K-means identified three area types (silhouette score 0.699 for k = 3): towns (3.34 million roofs, median roof size 87 m², 64% tree cover within 300 m), homestead villages (9.46 million roofs, 68 m², 94% tree cover) and sparse open land (0.19 million roofs) (Table 5). In towns, 78% of roofs are suitable, compared with 42% in villages. Villages still contribute 11.3 of the 18.5 GW, because most of Kerala\'s roofs are located there (Table 6).'),
  ...table('Table 5. Area types found by K-means on H3 hexagons (k = 3).', ['Area type', 'Hexagons', 'Roofs', 'Roofs per hexagon', 'Median roof', 'Trees within 300 m', 'Roofs suitable'], [
    ['Towns', '28,688', '3.34 M', '116', '87 m²', '64%', '78%'],
    ['Homestead villages', '216,229', '9.46 M', '44', '68 m²', '94%', '42%'],
    ['Sparse open land', '15,530', '0.19 M', '12', '55 m²', '41%', '69%'],
  ], [2100, 1150, 1050, 1350, 1200, 1400, 1388], { right: [1, 2, 3, 4, 5, 6] }),
  ...table('Table 6. Results by district, sorted by realistic electricity potential.', ['District', 'Roofs', 'Suitable', 'Realistic GW', 'Realistic TWh/yr', 'Maximum GW'], [
    ['Ernakulam', '1,284,867', '69.9%', '2.41', '3.68', '8.60'],
    ['Thrissur', '1,240,185', '56.5%', '1.96', '3.00', '7.13'],
    ['Malappuram', '1,596,528', '42.5%', '1.91', '2.90', '6.53'],
    ['Palakkad', '1,105,066', '57.4%', '1.71', '2.60', '5.00'],
    ['Thiruvananthapuram', '1,215,221', '50.8%', '1.67', '2.60', '5.32'],
    ['Kannur', '986,446', '50.8%', '1.45', '2.22', '5.38'],
    ['Kollam', '1,048,413', '48.6%', '1.40', '2.15', '4.59'],
    ['Alappuzha', '861,713', '51.3%', '1.22', '1.89', '4.32'],
    ['Kottayam', '795,538', '53.6%', '1.18', '1.78', '4.56'],
    ['Kozhikode', '1,031,097', '36.9%', '1.08', '1.64', '3.89'],
    ['Kasaragod', '494,465', '55.3%', '0.76', '1.18', '2.57'],
    ['Pathanamthitta', '584,627', '47.9%', '0.78', '1.17', '2.89'],
    ['Idukki', '402,320', '47.5%', '0.52', '0.76', '1.91'],
    ['Wayanad', '342,879', '46.6%', '0.45', '0.67', '1.60'],
    ['Kerala', '12,989,365', '51.5%', '18.50', '28.24', '64.29'],
  ], [2438, 1500, 1200, 1500, 1500, 1500], { right: [1, 2, 3, 4, 5] }),
  ...figure('fig_districts.png', 400, 'Figure 5. Yearly electricity potential by district, realistic (blue) and technical maximum (grey).'),
  ...figure('fig_map.png', 175, 'Figure 6. Realistic solar capacity per H3 hexagon (resolution 7, about 5 km²). The darkest areas are Kochi, Thiruvananthapuram, Thrissur, Kozhikode and Kannur.'),
  P('FP-Growth produced 186 rules, which were reduced to 36 after removing longer versions of shorter rules. The strongest rule shows that roofs in towns that appear built-up usually have low tree cover around them (confidence 0.77, lift 4.19). Roofs with low-confidence outlines are mostly small (0.73, lift 2.0), and roofs in villages usually have high tree cover (0.62, lift 1.5). These patterns are consistent with the K-means clusters and with the features that the Random Forest found most important.'),
  H2('3.4 Big data processing performance'),
  ...table('Table 7. District join of building centres, run time in seconds.', ['Buildings', 'Plain Spark (Shapely, no index)', 'Apache Sedona', 'Sedona faster by'], [
    ['10 thousand', '3.2', '0.7', '4.6×'],
    ['100 thousand', '4.4', '1.3', '3.5×'],
    ['1 million', '41.6', '9.2', '4.5×'],
    ['19.4 million', '805.2 (estimated)', '136.7', '5.9×'],
  ], [2000, 3038, 2300, 2300], { right: [1, 2, 3], note: 'Both methods matched exactly the same buildings. The full-size time for plain Spark is extrapolated from the 1-million run.' }),
  ...table('Table 8. PostGIS queries on 13 million roofs.', ['Query', 'Without', 'With', 'Speed-up'], [
    ['Roofs within 1 km of Kochi: no index / GiST index', '20,462 ms', '45.4 ms', '450×'],
    ['Count Wayanad roofs: normal table / partitioned by district', '1,238 ms', '117 ms', '10×'],
    ['District totals: MapReduce on RDDs / Spark SQL', '97.6 s', '9.6 s', '10×'],
    ['5 nearest roofs to a point (KNN, with index)', '-', '0.4 ms', '-'],
  ], [5038, 1500, 1500, 1600], { right: [1, 2, 3] }),
  P('The Spark UI for the dashboard job shows the scale of the processing. One query read 12,989,365 roof predictions (1.1 GB) and 6.69 million free-area records, shuffled about 1.4 GB of data across 8 parallel tasks and cached 1.5 GB in memory. Because of this caching, the later summary steps took seconds instead of minutes.'),
  ...figure('fig_spark_timeline_crop.png', 360, 'Figure 7. Spark UI event timeline of the dashboard job. The long bar is the main join of the 13 million roof records; the short jobs after it reused the cached data.'),
  H2('3.5 Household savings example'),
  P('I used the savings calculator in the dashboard to estimate the effect for one household. For a 3 kW system in Ernakulam, I assumed an installation cost of ₹65,000 per kW (₹1.95 lakh in total), less the PM Surya Ghar subsidy of ₹78,000, which gives a net cost of about ₹1.17 lakh. At the Ernakulam yield of about 1,527 kWh per kW, the system generates about 4,580 units per year. Assuming the household uses 200 units a month (2,400 units a year) at ₹6 per unit and exports the remaining units at ₹3 per unit, the annual saving is about ₹21,000, and the payback period is about 5.6 years. These prices are assumptions and can be changed in the calculator.'),
  ...figure('dashboard_main.png', 390, 'Figure 8. The web dashboard: 3D hexagon map, headline numbers and district ranking (muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web).'));

add(H1('4. Discussion'),
  H2('4.1 What the results mean'),
  P('The results show that about half of Kerala\'s roofs are suitable for solar. If each suitable roof installed a typical household system, a large part of the state\'s electricity demand could be met from rooftops. The technical maximum is much higher than the demand, so the main limits are likely to be cost, grid capacity and the willingness of households to install systems, rather than roof area. Other estimates for Kerala are lower; WRI India, for example, reports 10.9 GW of total solar potential, because it includes these practical limits. The realistic value of 18.5 GW in this study lies between such estimates and the technical maximum of 64.3 GW. I consider the district ranking and the difference between towns and villages to be the most reliable results, because they depend mainly on roof size and tree cover, which the data capture well. On this basis, solar programmes could start in town areas, where roofs are larger and less shaded. Village areas would need a separate approach, because a smaller share of their roofs is suitable.'),
  H2('4.2 Observations on the big data tools'),
  P('A spatial index had the largest effect on performance. Sedona, which uses a spatial index, was 3.5 to 5.9 times faster than plain Spark, and a GiST index made the PostGIS radius query about 450 times faster (20,462 ms against 45.4 ms). The choice of method also mattered: the same raster lookup took 385.7 minutes (about 6.4 hours) with Sedona\'s raster join, but only 42 seconds with NumPy array indexing. Spark SQL was about ten times faster than my MapReduce version on RDDs (9.6 s against 97.6 s), mainly because of its query optimiser and column-based processing. Caching the joined data in memory reduced the later summary steps from minutes to seconds. Running the work in Google Colab with Spark kept the data processing in the cloud, and the same code can run on a Spark cluster without major changes.'),
  H2('4.3 Challenges during the project'),
  P('Several practical problems came up while building the pipeline. Spark 4.1 and the Sedona package included two different copies of the same geometry library (JTS), which stopped Sedona from starting in Colab; this was solved by downloading the Sedona jar files and adding them to the Spark driver class path. The first raster join was far too slow (6.4 hours), and it had to be replaced by NumPy lookups. The ESA WorldCover tree layer turned out to be saturated in Kerala: the tree share within 28 m was 100% for 69% of roofs, because small houses under homestead trees are classed as tree cover. This is why the 1 m canopy-height map was added. Finally, the free tier of Colab has only 2 CPU cores and about 13 GB of memory, so the notebooks were written to save their output after each step, which allowed a run to continue after a disconnection.'),
  H2('4.4 Limitations'),
  ...list(['The model is based on only 290 labelled roofs (about 20 per district), and the two labellers agreed on only 74% of them, which limits the accuracy to around 67-68%. The disagreements were resolved by me, so the final labels may be biased towards my own judgement.',
    'Free area is calculated from the flat footprint; roof slope, orientation, partial shading, roof strength and other obstacles are not considered, so the technical maximum is likely to be overestimated.',
    'The building footprints, tree heights (about 2018-20) and labelling images (about 2025) are from different years.',
    'Spark was run in local mode on a single Colab machine, and a multi-node cluster was not tested.'], 'lims'),
  H2('4.5 Conclusion and future work'),
  P('This study estimates that Kerala\'s rooftops could realistically support about 18.5 GW of solar capacity and generate 28 TWh per year, which is about 88% of the state\'s annual electricity requirement and would avoid about 20 million tonnes of CO₂ annually. The largest share of this potential is in towns and in the districts of Ernakulam, Thrissur and Malappuram. The project also applied the main tools of the course, including Sedona, Spark, PostGIS, MapReduce, K-means, FP-Growth and Random Forest, to 13 million roofs. Future work could include an independent second labeller and a larger set of labels, roof slope and shading from 3D data, field validation of the free-area method, running the workflow on a cluster, and combining the results with grid and income data to estimate actual adoption.'),
  P('**Use of AI tools.** Google Gemini was used as a second labeller for the 300 sample roofs. Claude (Anthropic) was used for help with code, notebooks and the drafting and editing of this report. The labelling, analysis choices and interpretation of the results are my own.'),
  H1('References'),
  ...[
    'Breiman, L. (2001). Random forests. *Machine Learning*, 45, 5-32.',
    'Central Electricity Authority (2024). CO₂ Baseline Database for the Indian Power Sector, version 20.',
    'Gagnon, P. et al. (2016). *Rooftop Solar Photovoltaic Technical Potential in the United States.* NREL/TP-6A20-65298.',
    'Han, J., Pei, J., Yin, Y. (2000). Mining frequent patterns without candidate generation. *Proc. ACM SIGMOD*, 1-12.',
    'Overture Maps Foundation (2026). Buildings and Divisions themes, release 2026-10-21.0.',
    'Solargis, World Bank (2024). Global Solar Atlas 2.0.',
    'Tolan, J. et al. (2024). Very high resolution canopy height maps from RGB imagery. *Remote Sensing of Environment*, 300, 113888.',
    'Uber Technologies. H3: a hexagonal hierarchical geospatial indexing system.',
    'Yu, J., Zhang, Z., Sarwat, M. (2019). Spatial data management in Apache Spark: the GeoSpark perspective and beyond. *GeoInformatica*, 23, 37-78.',
    'Zanaga, D. et al. (2022). ESA WorldCover 10 m 2021 v200. Zenodo.',
  ].map((t, i) => new Paragraph({ children: runs(`${i + 1}. ${t}`, { size: 19 }), spacing: { after: 30, line: 240 },
    alignment: AlignmentType.LEFT, indent: { left: 340, hanging: 340 } })),
  new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: 'Code, notebooks and dashboard: ', size: 18 }),
    link('github.com/muhammedshahidsds25-collab/kerala-rooftop-solar', 'https://github.com/muhammedshahidsds25-collab/kerala-rooftop-solar')] }));

// ---------- document ----------
const header = new Header({ children: [new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: W }],
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 4 } },
  children: [new TextRun({ text: 'Rooftop Solar Potential of Kerala', size: 17, color: '000000' }),
    new TextRun({ text: '\tSpatial Big Data Project Report', size: 17, color: '000000' })] })] });
const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'Page ', size: 17, color: '000000' }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: '000000' })] })] });
const numCfg = (ref, fmt, text) => ({ reference: ref, levels: [{ level: 0, format: fmt, text, alignment: AlignmentType.LEFT,
  style: { paragraph: { indent: { left: 460, hanging: 300 } } } }] });
const doc = new Document({
  creator: 'Muhammed Shahid S', title: 'Rooftop Solar Potential of Kerala',
  styles: {
    default: { document: { run: { font: FONT, size: SZ } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: ACC },
        paragraph: { spacing: { before: 260, after: 110 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 23, bold: true, color: '000000' },
        paragraph: { spacing: { before: 170, after: 70 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [numCfg('goals', LevelFormat.DECIMAL, '%1.'), numCfg('lims', LevelFormat.BULLET, '•')] },
  sections: [{
    properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 560, footer: 560 } } },
    headers: { default: header, first: new Header({ children: [new Paragraph({ children: [] })] }) },
    footers: { default: footer, first: footer },
    children: [...page1, ...body],
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('wrote', OUT); });
