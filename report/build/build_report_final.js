const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
  AlignmentType, LevelFormat, Footer, Header, PageNumber, BorderStyle, TabStopType, ExternalHyperlink,
} = require('docx');

const FIG = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/';
const OUT = process.argv[2];
const FONT = 'Times New Roman';
const ACC = '1F4E8C';                 // heading colour
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
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 240 }, children: runs(cap, { size: 18, italics: true, color: '444444' }) })];
};
const thin = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const rule = { style: BorderStyle.SINGLE, size: 8, color: '404040' };
const cell = (text, width, o = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders: { top: o.top || none, bottom: o.bottom || thin, left: none, right: none },
  shading: o.head ? { fill: 'E8EEF6', type: ShadingType.CLEAR, color: 'auto' } : undefined,
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
    ...(o.note ? [new Paragraph({ spacing: { before: 40, after: 140 }, children: runs(o.note, { size: 17, italics: true, color: '555555' }) })]
      : [new Paragraph({ spacing: { after: 100 }, children: [] })]),
  ];
};
const link = (text, url) => new ExternalHyperlink({ link: url, children: [new TextRun({ text, style: 'Hyperlink', color: '0563C1', underline: {}, size: 18 })] });

// ---------- page 1 ----------
const info = (a, b, c, d, first, last) => new TableRow({ children: [[a, 1500, true], [b, 3319, false], [c, 1500, true], [d, 3319, false]].map(([t, w, bold]) =>
  new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: first ? rule : none, bottom: last ? rule : none, left: none, right: none },
    margins: { top: 30, bottom: 30, left: 60, right: 60 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold, size: 20, color: bold ? ACC : '000000' })] })] })) });
const page1 = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'Rooftop Solar Potential of Kerala from 13 Million Building Footprints', bold: true, size: 34, color: ACC })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
    children: [new TextRun({ text: 'Course Project Report, Spatial Bigdata Analytics (M5221357)', italics: true, size: 22 })] }),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [1500, 3319, 1500, 3319], rows: [
    info('Submitted by', 'Muhammed Shahid S', 'Submitted to', 'Manoj Kumar T K', true, false),
    info('Roll No.', '253308', 'Date', 'November 2026', false, false),
    info('Programme', 'M.Sc. Data Science and Geoinformatics', 'Institution', 'Digital University Kerala', false, true),
  ] }),
  new Paragraph({ spacing: { before: 240, after: 200, line: 264 }, alignment: AlignmentType.JUSTIFIED,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF3F9' },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACC, space: 8 } },
    indent: { left: 160, right: 160 },
    children: runs('**Abstract.** This project estimates how much electricity could be produced from the rooftops of Kerala and where this potential is located. I used 19.4 million building footprints from Overture Maps, assigned them to the 14 districts and cleaned them in Apache Sedona, which gave 12,989,365 roofs. Each roof was described by its size, shape, solar yield, tree cover and tree height. To train a model, I labelled 300 random roofs on satellite images; an AI model (Gemini) labelled the same roofs, and I checked the disagreements again without seeing the earlier labels. A Random Forest in Spark MLlib was trained on the resulting 290 labels and applied to all roofs. It classified 6.69 million roofs (51.5%) as suitable, and Sedona was then used to calculate the free area of each of them. If every suitable roof installs a system of up to 3 kW, Kerala\'s rooftops could provide 18.5 GW and 28.2 TWh per year, which is about 88% of the state\'s annual electricity requirement. Suitable roofs are much more common in towns (78%) than in tree-covered villages (42%), and Ernakulam, Thrissur and Malappuram have the highest potential.', { size: 21 }) }),
];

// ---------- body ----------
const body = [];
const add = (...x) => x.flat().forEach((e) => body.push(e));

add(H1('1. Introduction'),
  P('Kerala produces only about 30% of the electricity it uses, and the rest is bought from outside the state. Under the PM Surya Ghar scheme, a household can get up to ₹78,000 for a 3 kW rooftop system, but in October 2024 the installed rooftop capacity in Kerala was only about 0.95 GW (152,000 systems). Since there is very little free land for large solar plants, rooftops are an important option for increasing solar generation.'),
  P('However, most houses in Kerala are homesteads surrounded by coconut, jackfruit and mango trees, and many roofs are partly or fully shaded. A roof that appears large on a map may therefore not be useful for solar panels. For planning, one number for the whole state is not enough; it is necessary to know how many roofs are actually suitable and in which districts they are located.'),
  P('The project is also a big data problem. Kerala has about 13 million buildings, each stored as a polygon, and the tree-height map used here has about 82 billion pixels. This amount of data could not be processed on my laptop (8 GB RAM), so the heavy processing was done in Google Colab using Spark and Sedona. The two main objectives were:'),
  ...list(['To estimate the number of suitable roofs, their free area, and the resulting capacity, electricity generation, CO₂ savings and household savings for each district and area type.',
    'To carry out the spatial processing with the tools covered in the course (Apache Sedona on Spark, PostGIS, MapReduce, K-means, FP-Growth and Random Forest in Spark MLlib) and to compare what each tool contributes.'], 'goals'));

add(H1('2. Methodology'),
  H2('2.1 Data'),
  P('All datasets used are openly available. For area and distance calculations, the data were projected to UTM zone 43N (EPSG:32643).'),
  ...table('Table 1. Data used in the project.', ['Data', 'What it gives', 'Size'], [
    ['Overture Maps buildings (release 2026-10-21.0)', 'Building outlines; 84% from Google Open Buildings, 15% OSM, 2% Microsoft', '19.4 M polygons, 1.7 GB'],
    ['Overture Maps divisions', 'The 14 district boundaries of Kerala', '14 polygons'],
    ['Global Solar Atlas PVOUT', 'Electricity from 1 kW of panels per year, ~1 km pixels', '345 MB'],
    ['ESA WorldCover 2021', 'Land cover at 10 m (tree share around roofs)', '5 tiles, ~220 MB'],
    ['Meta and WRI canopy height', 'Tree height at ~1 m (Tolan et al., 2024)', '19 tiles, ~82 billion pixels'],
    ['My labels', '300 random roofs judged on Esri satellite imagery', '290 usable'],
  ], [3100, 4338, 2200]),
  H2('2.2 District join and cleaning'),
  P('The buildings were downloaded for a rectangular area around Kerala, which also included parts of Tamil Nadu and Karnataka. Using Apache Sedona, each building was assigned to a district by checking whether its centre point falls inside a district polygon (`ST_Contains` with a broadcast join). Since the district boundaries have up to 4,000 vertices, they were first divided into smaller parts using `ST_SubDivideExplode`, so that the spatial index works efficiently. During cleaning, no invalid geometries or exact duplicates (checked with a geometry hash) were found. Buildings smaller than 10 m² (15,538) were removed, and 2,213,255 outlines with low source confidence were flagged. In total, 13,004,903 buildings were inside Kerala and 12,989,365 roofs were kept, with a total roof area of about 1,175 km² and a median roof size of 69 m². The result was saved as GeoParquet, partitioned by district.'),
  H2('2.3 Describing each roof'),
  P('The following features were calculated for every roof: area and compactness (4πA/P²); annual solar yield at the roof location (1,460-1,578 kWh per kW); share of tree cover within about 28, 140 and 300 m (from WorldCover); four tree-height measures from the Meta 1 m map (the tallest tree within about 5 m and 15 m, and the share of area covered by trees of 5 m or more within 15 m and 30 m); the number of buildings in the same H3 hexagon (resolution 9, about 0.1 km²) as a measure of crowding; and the confidence of the building outline.'),
  P('In the first version, raster values were extracted with Sedona\'s raster join, which took 385.7 minutes. When the same step was rewritten using NumPy array indexing on the full raster, it took only 42 seconds. The canopy height map (about 82 billion pixels) was processed tile by tile using 3 × 3 pixel blocks and took 19.9 minutes.'),
  H2('2.4 Training labels'),
  P('To train the model, labelled examples were needed, and preparing them was the most difficult part of the project. I selected 300 roofs at random (21 per district plus 6) and used a QGIS script that zooms to each roof, so that it could be marked as good (large enough and mostly sunny), bad (shaded, very small or damaged) or not a building. I labelled 294 of these roofs. Since I was not fully confident in my own labels, the same roofs were also labelled by an AI vision model (Google Gemini) using the same images, without access to my labels. Both agreed on good versus not good for 218 of 293 roofs (74%, Cohen\'s kappa 0.50). For the 75 roofs with disagreement, I checked each roof again in random order without seeing either earlier label, and was able to decide 72 of them. The final gold labels contain 290 roofs: 156 good and 134 not good.'),
  H2('2.5 Random Forest classification'),
  P('A Random Forest classifier in Spark MLlib (200 trees, maximum depth 6, balanced class weights) was trained to predict roof suitability from 15 features: the features in Section 2.3 and the area type from K-means (Section 2.7). Solar yield was not used as a feature because it varies only slowly across the state and mainly reflects location. The model was evaluated using leave-one-district-out validation, where it is trained on 13 districts and tested on the remaining one, repeated for all 14 districts. This is stricter than a random split, where test roofs can be very close to training roofs. The final model, trained on all 290 labels, classified all 12,989,365 roofs in 11 minutes.'),
  H2('2.6 Free roof area and scenarios'),
  P('Only part of a roof can be used for panels, because some space is needed along the edges and for the stair room and water tank. Instead of using one fixed percentage for all roofs, the free area was calculated for each roof in Sedona. Each suitable roof outline was converted to metres, reduced inward by 0.6 m using `ST_Buffer` with a negative distance, and a further 8 m² was subtracted for the stair room and tank. The areas in metres matched the original areas (median ratio 0.9997). A value of 10 m² per kW was used to convert free area to capacity. Two scenarios were calculated: a technical maximum, where all free area is used, and a realistic case, where each roof is limited to 3 kW, which is the system size supported by the subsidy. CO₂ savings were calculated using 0.727 t per MWh (CEA CO₂ Baseline Database v20). The edge distance (0.3-1.0 m) and stair room area (0-12 m²) were also varied to test the sensitivity of the results.'),
  H2('2.7 Big data processing and analysis'),
  P('To compare performance, the district join was run with plain Spark (a Python function using Shapely, without a spatial index) and with Sedona\'s spatial join, using samples of 10 thousand, 100 thousand and 1 million buildings as well as the full dataset. District totals were also calculated as a MapReduce job on RDDs and as a single Spark SQL `GROUP BY`. In addition, all 13 million roofs (3.3 GB) were loaded into PostgreSQL 16 with PostGIS 3.4, and a radius query, a district query and a nearest-neighbour query were timed with and without a GiST index and with LIST partitioning by district.'),
  P('For the unsupervised analysis, K-means clustering was applied to 260,447 H3 hexagons using roof count, roof size, built-up share and tree cover, and the number of clusters was selected using the silhouette score. For association rule mining, each roof was represented as a set of simple properties (size class, tree cover class, crowding class, shape and outline confidence), and FP-Growth was run in Spark MLlib with minimum support 0.05 and minimum confidence 0.6. Finally, the results were summarised by district and by H3 hexagon for a web dashboard, which includes a 3D map, a district comparison and a household savings calculator.'));

add(H1('3. Results'),
  H2('3.1 How well the model judges roofs'),
  ...table('Table 2. Random Forest accuracy on the 290 gold labels.', ['Check', 'Accuracy', 'ROC AUC'], [
    ['Random Forest, leave one district out (final model)', '0.672', '0.719'],
    ['Same, without the tree-height features', '0.679', '0.712'],
    ['Random Forest, random 5-fold split', '0.703', '0.729'],
    ['Simple rule: roof ≥ 40 m² and seen as built-up', '0.583', '0.611'],
    ['Always answer "suitable"', '0.538', '0.500'],
  ], [6038, 1800, 1800], { right: [1, 2], note: 'The labels come from satellite images, judged by me and an AI; there was no field survey.' }),
  P('On districts not used for training, the model classified 67% of roofs correctly, compared with 54% when all roofs are labelled as suitable. Roof size was the most important feature, followed by tree cover near the roof and outline confidence. Adding the Meta tree-height features did not improve the accuracy, probably because they contain much of the same information as the WorldCover tree share. Although 67% accuracy is limited for individual roofs, the errors are almost balanced (43 roofs wrongly classified as suitable and 52 wrongly classified as not suitable), so the totals at district and state level are more reliable than the result for a single roof.'),
  H2('3.2 Rooftop solar potential of Kerala'),
  P('In total, 6,692,930 roofs (51.5%) were classified as suitable. The share of free roof area increases with roof size: 40% for roofs below 50 m², 65% for 50-120 m², 78% for 120-500 m² and 91% for roofs above 500 m², with an average of 74%. The free area calculation for all 6.69 million roofs took 6.4 minutes in Sedona.'),
  ...table('Table 3. Rooftop solar potential of Kerala.', ['Scenario', 'Capacity', 'Electricity / year', 'CO₂ avoided / year'], [
    ['**Realistic: each suitable roof installs up to 3 kW**', '**18.5 GW**', '**28.2 TWh**', '**20.5 Mt**'],
    ['Technical maximum: all free area covered', '64.3 GW', '98.1 TWh', '71 Mt'],
    ['Range of the maximum (edge 0.3-1.0 m, stair room 0-12 m²)', '51-78 GW', '79-119 TWh', '-'],
    ['Installed today (October 2024)', '0.95 GW', '-', '-'],
  ], [4438, 1500, 1800, 1900], { right: [1, 2, 3], note: 'Kerala needs about 32 TWh of electricity a year (CEA projection for 2024-25).' }),
  P('The realistic scenario corresponds to about 88% of Kerala\'s annual electricity requirement and is about twenty times the rooftop capacity installed today. The technical maximum is about three times the annual demand, which shows that available roof area is not the main limitation for rooftop solar in Kerala.'),
  H2('3.3 Where the potential is'),
  P('Ernakulam has the highest potential, with 3.68 TWh per year in the realistic scenario, and 70% of its roofs are suitable. It is followed by Thrissur (3.00 TWh) and Malappuram (2.90 TWh), while Wayanad has the lowest value (0.67 TWh). Malappuram has the largest number of buildings (1.60 million), but only 43% of them are suitable, because many are located in villages with dense tree cover. K-means identified three area types (silhouette score 0.699 for k = 3): towns (3.34 million roofs, median roof size 87 m², 64% tree cover within 300 m), homestead villages (9.46 million roofs, 68 m², 94% tree cover) and sparse open land (0.19 million roofs). In towns, 78% of roofs are suitable compared with 42% in villages. However, villages still contribute 11.3 GW of the 18.5 GW, because most roofs are located there.'),
  ...figure('fig_districts.png', 430, 'Figure 1. Yearly electricity potential by district, realistic (blue) and technical maximum (grey).'),
  ...figure('fig_map.png', 250, 'Figure 2. Realistic solar capacity per H3 hexagon (resolution 7, about 5 km²). The darkest areas are Kochi, Thiruvananthapuram, Thrissur, Kozhikode and Kannur.'),
  P('FP-Growth produced 186 rules, which were reduced to 36 after removing longer versions of shorter rules. The strongest rule shows that roofs in towns that appear built-up usually have low tree cover around them (confidence 0.77, lift 4.19). Roofs with low-confidence outlines are mostly small (0.73, lift 2.0), and roofs in villages usually have high tree cover (0.62, lift 1.5). These patterns are consistent with the K-means clusters and with the features that the Random Forest found most important.'),
  H2('3.4 Big data processing performance'),
  ...table('Table 4. District join of building centres, run time in seconds.', ['Buildings', 'Plain Spark (Shapely, no index)', 'Apache Sedona', 'Sedona faster by'], [
    ['10 thousand', '3.2', '0.7', '4.6×'],
    ['100 thousand', '4.4', '1.3', '3.5×'],
    ['1 million', '41.6', '9.2', '4.5×'],
    ['19.4 million', '805.2 (estimated)', '136.7', '5.9×'],
  ], [2000, 3038, 2300, 2300], { right: [1, 2, 3], note: 'Both methods matched exactly the same buildings. The full-size time for plain Spark is extrapolated from the 1-million run.' }),
  ...table('Table 5. PostGIS queries on 13 million roofs.', ['Query', 'Without', 'With', 'Speed-up'], [
    ['Roofs within 1 km of Kochi: no index / GiST index', '20,462 ms', '45.4 ms', '450×'],
    ['Count Wayanad roofs: normal table / partitioned by district', '1,238 ms', '117 ms', '10×'],
    ['District totals: MapReduce on RDDs / Spark SQL', '97.6 s', '9.6 s', '10×'],
    ['5 nearest roofs to a point (KNN, with index)', '-', '0.4 ms', '-'],
  ], [5038, 1500, 1500, 1600], { right: [1, 2, 3] }),
  P('The Spark UI for the dashboard job shows the scale of the processing. One query read 12,989,365 roof predictions (1.1 GB) and 6.69 million free-area records, shuffled about 1.4 GB of data across 8 parallel tasks and cached 1.5 GB in memory. Because of this caching, the later summary steps took seconds instead of minutes.'),
  H2('3.5 What it means for one family'),
  P('The savings calculator in the dashboard can be used to estimate the effect for a single household. For a 3 kW system in Ernakulam, with a cost of ₹65,000 per kW and a subsidy of ₹78,000, the net cost is about ₹1.17 lakh. The system would generate about 4,580 units per year and save about ₹21,000 on electricity bills, giving a payback period of about 5.6 years.'),
  ...figure('dashboard_main.png', 470, 'Figure 3. The web dashboard: 3D hexagon map, headline numbers and district ranking (muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web).'));

add(H1('4. Discussion'),
  H2('4.1 What the results mean'),
  P('The results show that about half of Kerala\'s roofs are suitable for solar, and if each suitable roof installs a typical household system, a large part of the state\'s electricity demand could be met from rooftops. Since the technical maximum is much higher than the demand, the main limitations are likely to be cost, grid capacity and the willingness of households to install systems, rather than roof area. Other estimates for Kerala are lower; for example, WRI India reports 10.9 GW of total solar potential, because it includes these practical limits. The value of 18.5 GW in this study lies between such estimates and the technical maximum. The district ranking and the difference between towns and villages are the most reliable results, since they mainly depend on roof size and tree cover. Based on this, solar programmes could focus first on town areas with large and unshaded roofs, while village areas may need a separate approach.'),
  H2('4.2 What I learned about the tools'),
  P('The use of a spatial index had the largest effect on performance: Sedona was 3.5 to 5.9 times faster than plain Spark, and a GiST index made the PostGIS radius query about 450 times faster. The choice of method was also important, as the same raster lookup took 6.4 hours with Sedona\'s raster join but only 42 seconds with NumPy. Spark SQL was about ten times faster than the MapReduce version, mainly because of its query optimiser and column-based processing. Caching data in memory reduced repeated summary steps from minutes to seconds. Since my laptop could not handle the data, Google Colab was necessary, and the same code can be run on a cluster without major changes.'),
  H2('4.3 Limitations'),
  ...list(['The model is based on only 290 labelled roofs (about 20 per district), and the two labellers agreed on only 74% of them, which limits the accuracy to around 67-68%. The disagreements were resolved by me, so the final labels may be biased towards my own judgement.',
    'Free area is calculated from the flat footprint; roof slope, orientation, partial shading, roof strength and other obstacles are not considered, so the technical maximum is likely to be overestimated.',
    'The building footprints, tree heights (about 2018-20) and labelling images (about 2025) are from different years.',
    'Spark was run in local mode on a single Colab machine, and a multi-node cluster was not tested.'], 'lims'),
  H2('4.4 Conclusion and future work'),
  P('This study estimates that Kerala\'s rooftops could realistically support about 18.5 GW of solar capacity and generate 28 TWh per year, which is close to 90% of the state\'s electricity requirement and would avoid about 20 million tonnes of CO₂ annually. The largest share of this potential is in towns and in the districts of Ernakulam, Thrissur and Malappuram. The project also applied the main tools of the course, including Sedona, Spark, PostGIS, MapReduce, K-means, FP-Growth and Random Forest, to 13 million roofs. Future work could include an independent second labeller and a larger set of labels, roof slope and shading from 3D data, field validation of the free-area method, running the workflow on a cluster, and combining the results with grid and income data to estimate actual adoption.'),
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
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '808080', space: 4 } },
  children: [new TextRun({ text: 'Rooftop Solar Potential of Kerala', size: 17, color: '555555' }),
    new TextRun({ text: '\tSpatial Big Data Project Report', size: 17, color: '555555' })] })] });
const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'Page ', size: 17, color: '555555' }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: '555555' })] })] });
const numCfg = (ref, fmt, text) => ({ reference: ref, levels: [{ level: 0, format: fmt, text, alignment: AlignmentType.LEFT,
  style: { paragraph: { indent: { left: 460, hanging: 300 } } } }] });
const doc = new Document({
  creator: 'Muhammed Shahid S', title: 'Rooftop Solar Potential of Kerala',
  styles: {
    default: { document: { run: { font: FONT, size: SZ } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: ACC },
        paragraph: { spacing: { before: 260, after: 110 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 23, bold: true, color: '1A1A1A' },
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
