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
    children: runs('**Abstract.** In this project I estimated how much electricity the rooftops of Kerala could produce, and where. I took 19.4 million building footprints from Overture Maps, joined them to the 14 districts and cleaned them with Apache Sedona, which left 12,989,365 roofs. For every roof I calculated its size, shape, sunshine, tree cover and tree height. I labelled 300 random roofs on satellite images, had an AI model label the same roofs, and re-checked the disagreements blind; the resulting 290 labels trained a Spark MLlib Random Forest that judged all 13 million roofs. 6.69 million roofs (51.5%) came out suitable. For each of them Sedona measured the free area from its own outline. If every suitable roof installs up to a typical 3 kW system, Kerala could host **18.5 GW** and generate **28.2 TWh a year**, about **88% of the state\'s electricity need** and twenty times what is installed today. Towns have far more suitable roofs than tree-shaded villages (78% against 42%), and Ernakulam, Thrissur and Malappuram lead.', { size: 21 }) }),
];

// ---------- body ----------
const body = [];
const add = (...x) => x.flat().forEach((e) => body.push(e));

add(H1('1. Introduction'),
  P('Kerala generates only about 30% of the electricity it uses and buys the rest from outside the state. At the same time, almost every house has a roof that gets strong sun all year. The central PM Surya Ghar scheme pays up to ₹78,000 towards a 3 kW home system, yet in October 2024 Kerala had only about 0.95 GW of rooftop solar in 152,000 systems. Land for large solar farms is scarce in such a crowded state, so rooftops are the obvious place to grow solar.'),
  P('The difficulty is that Kerala\'s houses are not like the flat-roofed blocks of a typical city. Most are homesteads surrounded by coconut, jackfruit and mango trees, and many roofs are partly or fully in shade. A roof that looks large on a map may be useless for panels. So a single number for the whole state does not help much: planners need to know how many roofs are really suitable and where they are.'),
  P('This is also a big data problem, which is why it suits this course. There are about 13 million buildings in Kerala, each a polygon, and the tree-height map I used has about 82 billion pixels. My laptop (8 GB RAM) cannot even open this data, so all heavy work ran in Google Colab with Spark and Sedona. The project had two goals:'),
  ...list(['Find out how many of Kerala\'s roofs are suitable for solar, how much free area each one has, and what that means in capacity, electricity, CO₂ and household savings, by district and by area type.',
    'Do the heavy spatial work with the tools from the course (Apache Sedona on Spark, PostGIS, MapReduce, K-means, FP-Growth and a Random Forest in Spark MLlib) and check what each tool actually adds.'], 'goals'));

add(H1('2. Methodology'),
  H2('2.1 Data'),
  P('All data are free and open. I projected geometry to UTM zone 43N (EPSG:32643) wherever I needed areas or distances in metres.'),
  ...table('Table 1. Data used in the project.', ['Data', 'What it gives', 'Size'], [
    ['Overture Maps buildings (release 2026-10-21.0)', 'Building outlines; 84% from Google Open Buildings, 15% OSM, 2% Microsoft', '19.4 M polygons, 1.7 GB'],
    ['Overture Maps divisions', 'The 14 district boundaries of Kerala', '14 polygons'],
    ['Global Solar Atlas PVOUT', 'Electricity from 1 kW of panels per year, ~1 km pixels', '345 MB'],
    ['ESA WorldCover 2021', 'Land cover at 10 m (tree share around roofs)', '5 tiles, ~220 MB'],
    ['Meta and WRI canopy height', 'Tree height at ~1 m (Tolan et al., 2024)', '19 tiles, ~82 billion pixels'],
    ['My labels', '300 random roofs judged on Esri satellite imagery', '290 usable'],
  ], [3100, 4338, 2200]),
  H2('2.2 District join and cleaning'),
  P('I downloaded the buildings for a box around Kerala, which also takes in parts of Tamil Nadu and Karnataka. Apache Sedona then put each building into a district by testing whether its centre lies inside a district polygon (`ST_Contains`, broadcast join). District outlines have up to 4,000 vertices, so I cut them into small pieces with `ST_SubDivideExplode` first, which keeps the spatial index effective. Cleaning repaired invalid shapes (none were found), looked for exact duplicates by a hash of the geometry (none), removed buildings under 10 m² (15,538) and flagged 2,213,255 outlines with low source confidence. 13,004,903 buildings fell inside Kerala and 12,989,365 roofs were kept, about 1,175 km² of roof with a median of 69 m². I saved them as GeoParquet split by district.'),
  H2('2.3 Describing each roof'),
  P('For every roof I calculated: its area and compactness (4πA/P²); the yearly solar yield at its location (1,460 to 1,578 kWh per kW); the share of trees within about 28, 140 and 300 m (WorldCover); four tree-height measures from the Meta 1 m map (the tallest tree within about 5 and 15 m, and the share of ground under trees of 5 m or more within 15 and 30 m); the number of buildings in its H3 hexagon (resolution 9, about 0.1 km²), as a measure of crowding; and the confidence of its outline. Figure 1 shows the idea behind the crowding and shade features.'),
  ...figure('hex_tree_diagram.png', 520, 'Figure 1. Two of the roof features, as an illustration. Left: buildings are counted in each H3 hexagon (many buildings = town). Right: the share of trees is measured in three rings around each roof; more trees close to the roof means more shade.'),
  P('My first version looked up the raster values with Sedona\'s raster join, which took 385.7 minutes. Rewritten as NumPy array indexing on the whole raster, the same lookups took 42 seconds. The 82-billion-pixel canopy map was read tile by tile in 3 × 3 pixel blocks and finished in 19.9 minutes.'),
  H2('2.4 Training labels'),
  P('A computer cannot learn what a good roof looks like without examples, and getting good labels was the hardest part of the project. I drew 300 roofs at random (21 per district plus 6) and built a small QGIS tool that zooms to each roof so I could mark it good (large enough and mostly sunny), bad (shaded, very small or broken) or not a building. I labelled 294 of them. Because I was not sure about my own judgement, I also had an AI vision model (Google Gemini) label the same roofs from the same image, without seeing my answer. We agreed on good against not good for 218 of 293 roofs (74%, Cohen\'s kappa 0.50). For the 75 roofs where we disagreed, I looked again **blind**, in random order and without either earlier label, and decided 72. These **gold labels** cover 290 roofs: 156 good and 134 not good.'),
  H2('2.5 Random Forest classification'),
  P('A Random Forest in Spark MLlib (200 trees, depth 6, balanced class weights) learned to predict suitability from 15 features: those in Section 2.3 plus the area type from K-means (Section 2.7). I left out the solar yield as a feature, because it changes only slowly across the state and acted as a stand-in for location. To test the model honestly I used **leave-one-district-out** validation: train on 13 districts, test on the 14th, and repeat for every district. A random split would be easier, because test roofs would sit next to training roofs. The final model, trained on all 290 labels, judged all 12,989,365 roofs in 11 minutes.'),
  H2('2.6 Free roof area and scenarios'),
  P('Not all of a roof can hold panels: an edge strip is kept free, and a stair room and water tank take space. Instead of one assumed percentage for every roof, I let Sedona measure it. Each suitable outline was transformed to metres, shrunk inwards by 0.6 m (`ST_Buffer` with a negative distance), and 8 m² was subtracted for the stair room and tank. I checked that the area in metres matched the earlier area (median ratio 0.9997). I used 10 m² of free roof per kW of panels. The **technical maximum** covers all free area; the **realistic** case caps each roof at 3 kW, the size the subsidy supports. CO₂ avoided uses 0.727 t per MWh (CEA CO₂ Baseline Database v20). I also varied the edge strip (0.3 to 1.0 m) and stair room (0 to 12 m²).'),
  H2('2.7 Big data processing and analysis'),
  P('I compared plain Spark (a Python function using Shapely, with no spatial index) with Sedona\'s spatial join on samples of 10 thousand, 100 thousand and 1 million buildings and on the full data. I also wrote the district totals once as a MapReduce job on RDDs and once as a single Spark SQL `GROUP BY`. In PostgreSQL 16 with PostGIS 3.4 I loaded all 13 million roofs (3.3 GB) and timed a radius query, a district query and a nearest-neighbour query with and without a GiST index and with LIST partitioning by district.'),
  P('For unsupervised analysis I grouped the 260,447 H3 hexagons with **K-means** on roof count, roof size, built-up share and tree cover, choosing k by the silhouette score. I turned every roof into a basket of simple properties (size band, tree band, crowding band, shape, outline confidence) and ran **FP-Growth** in Spark MLlib (support 0.05, confidence 0.6). Finally, a small Spark job summarised the results by district and by H3 hexagon for a web dashboard with a 3D map, a district comparison and a household savings calculator.'));

add(H1('3. Results'),
  H2('3.1 How well the model judges roofs'),
  ...table('Table 2. Random Forest accuracy on the 290 gold labels.', ['Check', 'Accuracy', 'ROC AUC'], [
    ['Random Forest, leave one district out (final model)', '0.672', '0.719'],
    ['Same, without the tree-height features', '0.679', '0.712'],
    ['Random Forest, random 5-fold split', '0.703', '0.729'],
    ['Simple rule: roof ≥ 40 m² and seen as built-up', '0.583', '0.611'],
    ['Always answer "suitable"', '0.538', '0.500'],
  ], [6038, 1800, 1800], { right: [1, 2], note: 'The labels come from satellite images, judged by me and an AI; there was no field survey.' }),
  P('In districts it had never seen, the model judged 67% of roofs correctly, against 54% for always answering "suitable". Roof size was the most important feature, followed by trees near the roof and outline confidence. Adding the Meta tree-height map did not raise accuracy, because it mostly repeats what the WorldCover tree share already says. The 67% is modest for single roofs, but the errors nearly cancel (43 roofs wrongly accepted, 52 wrongly rejected), so district and state totals are more reliable than single-roof answers.'),
  H2('3.2 Rooftop solar potential of Kerala'),
  P('The model classified **6,692,930 roofs (51.5%)** as suitable. Their free share rises with size: 40% for roofs under 50 m², 65% for 50 to 120 m², 78% for 120 to 500 m² and 91% above 500 m² (74% on average). Sedona processed all 6.69 million roofs in 6.4 minutes.'),
  ...table('Table 3. Rooftop solar potential of Kerala.', ['Scenario', 'Capacity', 'Electricity / year', 'CO₂ avoided / year'], [
    ['**Realistic: each suitable roof installs up to 3 kW**', '**18.5 GW**', '**28.2 TWh**', '**20.5 Mt**'],
    ['Technical maximum: all free area covered', '64.3 GW', '98.1 TWh', '71 Mt'],
    ['Range of the maximum (edge 0.3-1.0 m, stair room 0-12 m²)', '51-78 GW', '79-119 TWh', '-'],
    ['Installed today (October 2024)', '0.95 GW', '-', '-'],
  ], [4438, 1500, 1800, 1900], { right: [1, 2, 3], note: 'Kerala needs about 32 TWh of electricity a year (CEA projection for 2024-25).' }),
  P('The realistic case equals about **88% of Kerala\'s yearly electricity need** and twenty times today\'s installed rooftop capacity. The technical maximum is three times the state\'s demand, so rooftop area is not what limits solar in Kerala.'),
  H2('3.3 Where the potential is'),
  P('Ernakulam leads with 3.68 TWh a year in the realistic case (70% of its roofs suitable), followed by Thrissur (3.00 TWh) and Malappuram (2.90 TWh); Wayanad is lowest (0.67 TWh). Malappuram has the most buildings (1.60 million) but only 43% of them are suitable, because most sit in tree-covered villages. K-means found three area types (silhouette 0.699 at k = 3): **towns** (3.34 M roofs, median 87 m², 64% trees within 300 m), **homestead villages** (9.46 M roofs, 68 m², 94% trees) and **sparse open land** (0.19 M roofs). In towns 78% of roofs are suitable against 42% in villages, but villages still give 11.3 of the 18.5 GW because they hold most roofs.'),
  ...figure('fig_districts.png', 430, 'Figure 2. Yearly electricity potential by district, realistic (blue) and technical maximum (grey).'),
  ...figure('fig_map.png', 250, 'Figure 3. Realistic solar capacity per H3 hexagon (resolution 7, about 5 km²). The darkest areas are Kochi, Thiruvananthapuram, Thrissur, Kozhikode and Kannur.'),
  P('FP-Growth found 186 rules (36 after removing longer copies of shorter ones). The strongest says that roofs seen as built-up in a town have low tree cover around them (confidence 0.77, lift 4.19). Low-confidence outlines are usually small roofs (0.73, lift 2.0), and village roofs usually have high tree cover (0.62, lift 1.5). These rules agree with the clusters and with what the Random Forest relies on.'),
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
  P('The Spark UI of the dashboard job showed the work at scale: one query read 12,989,365 roof predictions (1.1 GB) and 6.69 million free-area rows, shuffled about 1.4 GB between 8 parallel tasks, and kept 1.5 GB in memory, so the later summaries took seconds instead of minutes.'),
  H2('3.5 What it means for one family'),
  P('The dashboard calculator shows the effect on one house. A 3 kW system in Ernakulam, at ₹65,000 per kW before the ₹78,000 subsidy, costs about ₹1.17 lakh. It produces about 4,580 units a year and saves about ₹21,000 on the electricity bill, so it pays back in about 5.6 years and then gives roughly 20 more years of nearly free power.'),
  ...figure('dashboard_main.png', 470, 'Figure 4. The web dashboard: 3D hexagon map, headline numbers and district ranking (muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web).'));

add(H1('4. Discussion'),
  H2('4.1 What the results mean'),
  P('About half of Kerala\'s roofs are suitable for solar, and if each of them installs a normal home system the state could cover most of its electricity need from its own roofs. The technical maximum is far larger than the demand, so the real limits are cost, the grid and people\'s willingness to install, not roof area. Published estimates for Kerala are lower (WRI India gives 10.9 GW of total solar potential) because they include those practical limits; my 18.5 GW sits between them and the physical maximum. The ranking of districts and the gap between towns and villages are the most robust findings, because they come from simple, visible facts: roof size and tree shade. Programmes could start with the town hotspots, where roofs are large and open, and treat village roofs separately.'),
  H2('4.2 What I learned about the tools'),
  P('A spatial index made the biggest difference everywhere: Sedona was 3.5 to 5.9 times faster than plain Spark, and a GiST index made a PostGIS search 450 times faster. Choosing the right method also mattered more than the engine: the same raster lookups took 6.4 hours in Sedona\'s raster join and 42 seconds as NumPy array indexing. Spark SQL beat hand-written MapReduce by ten times because its optimiser works on columns. Keeping data in memory (caching) turned minutes into seconds for repeated summaries. Running everything in Colab was necessary, because my laptop could not hold the data, and the same code would run on a cluster without changes.'),
  H2('4.3 Limitations'),
  ...list(['Only 290 labelled roofs (about 20 per district), and two careful labellers agreed on just 74%, which caps accuracy near 67-68%. I did the blind tie-break myself, so it may lean towards my own view.',
    'Free area uses the flat footprint; roof slope, direction, partial shade, roof strength and extra obstacles are not modelled, so the maximum leans high.',
    'Footprints, tree heights (about 2018-20) and labelling imagery (about 2025) come from different years.',
    'Spark ran in local mode on one Colab machine; I did not test a real multi-node cluster.'], 'lims'),
  H2('4.4 Conclusion and future work'),
  P('Kerala\'s rooftops could realistically host about 18.5 GW and produce 28 TWh a year, close to 90% of the state\'s need, while avoiding about 20 million tonnes of CO₂. The towns and the districts of Ernakulam, Thrissur and Malappuram hold the largest share. Along the way the project used every main tool of the course, Sedona, Spark, PostGIS, MapReduce, K-means, FP-Growth and a Random Forest, on 13 million roofs. In future I would like to get a second, independent labeller and many more labels, add roof slope and shade from 3D data, check the free-area rule on real roofs, run the pipeline on a cluster, and combine the potential with grid and income data to estimate how many households would actually install.'),
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
