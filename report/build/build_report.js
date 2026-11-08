const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
  AlignmentType, LevelFormat, Footer, PageNumber, BorderStyle, PageBreak, TabStopType, ExternalHyperlink,
} = require('docx');

const FIG = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/';
const OUT = process.argv[2];
const FONT = 'Arial';
const W = 9026; // text width in DXA (A4, 2.54 cm margins)
const BLUE = '1F4E8C';

// ---------- helpers ----------
const png = (file) => {
  const b = fs.readFileSync(FIG + file);
  return { data: b, w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};
const runs = (text, base = {}) => {
  // **bold** and *italic* inline
  const out = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), ...base, font: 'Consolas' }));
    else if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
};
const P = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run || {}), alignment: opts.align || AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: 276, ...(opts.spacing || {}) }, keepNext: opts.keepNext, indent: opts.indent });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const bullets = (items) => items.map((t) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, children: runs(t),
  spacing: { after: 60, line: 264 }, alignment: AlignmentType.LEFT }));
const numbered = (items, ref = 'num') => items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t),
  spacing: { after: 60, line: 264 }, alignment: AlignmentType.LEFT }));
const caption = (t) => new Paragraph({ children: [new TextRun({ text: t, italics: true, size: 18, color: '555555' })],
  alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 } });
const figure = (file, widthPx, cap, alt) => {
  const { data, w, h } = png(file);
  return [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 40 },
    children: [new ImageRun({ type: 'png', data, transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
      altText: { title: cap, description: alt || cap, name: file } })] }), caption(cap)];
};
const border = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, width, o = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA }, borders,
  shading: o.head ? { fill: 'DCE8F7', type: ShadingType.CLEAR, color: 'auto' } : o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
  margins: { top: 50, bottom: 50, left: 90, right: 90 },
  children: [new Paragraph({ alignment: o.right ? AlignmentType.RIGHT : AlignmentType.LEFT, keepNext: !o.last,
    children: runs(String(text), { size: 18, bold: !!o.head }) })],
});
const table = (headers, rows, widths, o = {}) => {
  const total = widths.reduce((a, b) => a + b, 0);
  const right = o.right || [];
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, widths[i], { head: true, right: right.includes(i) })) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i],
        { right: right.includes(i), last: ri === rows.length - 1, fill: o.boldLast && ri === rows.length - 1 ? 'F2F2F2' : undefined })) })),
    ],
  });
};
const tcap = (t) => new Paragraph({ keepNext: true, spacing: { before: 160, after: 60 },
  children: [new TextRun({ text: t, bold: true, size: 19, color: BLUE })] });
const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });
const link = (text, url) => new ExternalHyperlink({ link: url, children: [new TextRun({ text, style: 'Hyperlink', color: '0563C1', underline: {} })] });

// ---------- content ----------
const title = [
  new Paragraph({ spacing: { before: 1800 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: 'Spatial Big Data Analytics for Rooftop Solar Potential in Kerala', bold: true, size: 44, color: BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: 'using Apache Sedona and Spark MLlib', size: 32, color: '444444' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Project report', size: 26, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 }, children: [new TextRun({ text: 'Spatial Bigdata Analytics (M5221357)', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Muhammed Shahid S', bold: true, size: 28 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Roll No. 253308', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'M.Sc. Data Science and Geoinformatics', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Digital University Kerala', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Course faculty: Sarath Sir', size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'November 2026', size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Code and notebooks: ', size: 20 }),
    link('github.com/muhammedshahidsds25-collab/kerala-rooftop-solar', 'https://github.com/muhammedshahidsds25-collab/kerala-rooftop-solar')] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Interactive dashboard: ', size: 20 }),
    link('muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/', 'https://muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/')] }),
];

const body = [];
const add = (...x) => x.flat().forEach((e) => body.push(e));

// Abstract
add(H1('Abstract'),
  P('Kerala imports most of its electricity, and its roofs receive strong sunshine all year. This project estimates how much of that sunshine the state\'s rooftops could turn into electricity, using spatial big-data tools throughout. 19.4 million building footprints from Overture Maps were joined to the 14 districts and cleaned with Apache Sedona, leaving 12,989,365 roofs. Each roof was given its size, shape, annual solar yield, tree cover and tree height from raster maps. A Spark MLlib Random Forest, trained on 290 roofs judged by the author and by an AI vision model and then re-checked blind where the two disagreed, classified every roof as suitable or not suitable for solar. It is right for about 67% of roofs in districts it has not seen, against 54% for always answering "suitable". For the 6.69 million suitable roofs, Sedona then calculated each roof\'s free area from its own outline.'),
  P('If every suitable roof installs its free area up to a typical 3 kW system, Kerala\'s rooftops could host about **18.5 GW** and generate about **28 TWh per year**, close to 88% of the state\'s yearly electricity need and about twenty times today\'s installed rooftop capacity. The technical maximum is 64 GW (51 to 78 GW across assumptions). Towns have far more suitable roofs than tree-shaded homestead villages (78% against 42%), and Ernakulam, Thrissur and Malappuram have the largest potential. PostGIS indexing and partitioning, K-means clustering of H3 hexagons and FP-Growth association rules complete the pipeline, and an interactive web dashboard presents the results. The figures are technical potentials from roof geometry, not forecasts.'),
  P('**Keywords:** rooftop solar, Apache Sedona, Spark MLlib, Random Forest, PostGIS, H3, Kerala, spatial big data', { align: AlignmentType.LEFT }));

// 1 Introduction
add(H1('1. Introduction'),
  H2('1.1 Motivation'),
  P('Kerala generates only about 30% of the electricity it uses and buys the rest. Demand keeps setting new peaks, and land for large solar farms is scarce in a densely populated state. Rooftop solar avoids the land problem, and the central PM Surya Ghar scheme subsidises up to ₹78,000 for a 3 kW home system. Kerala already has about 0.95 GW of rooftop solar in 152,000 systems (October 2024). Planners therefore need to know where the remaining roofs are, how many are suitable and how much they could produce.'),
  P('Answering this for a whole state needs every building, not a sample. Kerala has more than 13 million buildings, and the questions involve polygon geometry (areas, overlaps, distances) and several raster layers (sunshine, tree cover, tree height). A laptop cannot hold or join this data in reasonable time, which is why this is a spatial big-data problem and why the project uses Apache Sedona, Spark, PostGIS and cloud notebooks.'),
  H2('1.2 Objectives'),
  ...numbered([
    'Build a scalable pipeline that assigns every building in Kerala to a district and removes bad records.',
    'Describe each roof with size, shape, sunshine, tree cover, tree height and neighbourhood density.',
    'Classify roofs as suitable or not suitable for solar with a Spark MLlib model that is tested honestly on districts it has not seen.',
    'Measure the free area of each suitable roof with spatial operations instead of a single assumed percentage.',
    'Estimate capacity, yearly electricity, CO₂ avoided and household payback by roof, hexagon and district, and present them in an interactive dashboard.',
    'Compare Spark with Apache Sedona, MapReduce with Spark SQL, and unindexed with indexed PostGIS queries, as the course requires.',
  ]),
  H2('1.3 Scope'),
  P('The study covers the 14 districts of Kerala. It reports **technical potential**: what the roofs could host and generate given their geometry, sunshine and shading. It does not model grid limits, structural strength, ownership, finance or adoption behaviour, and it does not forecast how much will actually be installed.'));

// 2 Data
add(H1('2. Study area and data'),
  P('The study area is Kerala (about 38,900 km²). Buildings were first downloaded for the box 74.85°E to 77.45°E and 8.15°N to 12.80°N, which also contains parts of Tamil Nadu and Karnataka, and were then restricted to Kerala by the district join. Table 1 lists the data used.'),
  tcap('Table 1. Data sources'),
  table(['Data', 'Content and resolution', 'Used for'], [
    ['Overture Maps buildings (release 2026-10-21.0)', '19,355,143 polygons in the box; 84% from Google Open Buildings, 15% OpenStreetMap, 2% Microsoft', 'Roof outlines and areas'],
    ['Overture Maps divisions', '14 Kerala district polygons and the state boundary', 'District assignment'],
    ['Global Solar Atlas (PVOUT)', 'Long-term yield, about 1 km pixels; 1,108 to 1,643 kWh per kWp per year in the box', 'Electricity per kW installed'],
    ['ESA WorldCover 2021', 'Land cover at 10 m; tree share per 3 × 3 block (~28 m)', 'Neighbourhood tree cover'],
    ['Meta and WRI canopy height map', 'Tree height at about 1 m (Tolan et al., 2024); 19 tiles over Kerala', 'Tree height around each roof'],
    ['Roof labels', '300 sampled roofs, labelled on Esri World Imagery', 'Training and testing the model'],
  ], [2700, 4300, 2026]),
  gap(),
  P('Overture building footprints carry almost no height, floor, class or roof-shape information (height for 0.02% of buildings, class for 1.6%), so none of these attributes could be used as features. Footprint area and shape, sunshine, tree cover and tree height were used instead.'),
  H2('2.1 Data volume'),
  P('The pipeline processes about 19.4 million polygons and, for the canopy height map alone, about 82 billion pixels (about 11 GB of compressed downloads). Table 2 gives the stored sizes. The heavy steps run on Google Colab, because the author\'s laptop (Intel i3, 8 GB RAM) cannot hold the data.'),
  tcap('Table 2. Data volume'),
  table(['Dataset', 'Rows / pixels', 'Stored size'], [
    ['Overture buildings, Kerala box (raw GeoParquet)', '19,355,143 polygons', '1.7 GB'],
    ['Clean buildings inside Kerala (partitioned GeoParquet)', '12,989,365 polygons', '1.9 GB'],
    ['Roof features (area, shape, sun, trees, crowding)', '12,989,365 rows', '2.5 GB (+ 2.2 GB v2)'],
    ['Roof predictions (one run)', '12,989,365 rows', '1.2 GB'],
    ['Usable roof area (Sedona buffers)', '6,692,930 rows', '0.27 GB'],
    ['Canopy height (processed tile by tile, not stored)', '19 tiles, ~82 billion pixels', '~11 GB download'],
    ['PostGIS roofs table', '13 million rows', '3.3 GB'],
    ['H3 hexagon clusters', '260,447 hexagons', '15 MB'],
  ], [4300, 2700, 2026]),
  gap());

// 3 Methodology
add(H1('3. Methodology'),
  H2('3.1 Architecture'),
  P('The project follows the cloud spatial data-lake pattern: data are kept as partitioned GeoParquet files on Google Drive, processed by Spark and Sedona in Google Colab, loaded into PostGIS for indexed queries, modelled with Spark MLlib and summarised for the dashboard. Figure 1 shows the flow. Twelve notebooks implement it, listed in Appendix A.'),
  ...figure('fig_pipeline.png', 520, 'Figure 1. Method flow from building footprints to potential per roof, hexagon and district.',
    'Flow diagram of the pipeline'),
  H2('3.2 Compute environment'),
  P('All notebooks run in Google Colab with Python, Java 17, PySpark 4.1.3 and Apache Sedona 1.9.1, in Spark local mode on 2 CPU cores and about 13 GB of RAM. Spark 4.1 ships its own copy of the JTS geometry library, which clashed with the copy inside Sedona\'s packaged jar; the fix was to download the Sedona and GeoTools jars from Maven Central and place them on the driver class path. The code does not depend on local mode and would run on a cluster unchanged, but no cluster run was made.'),
  H2('3.3 District join and cleaning (Module 1)'),
  P('Each building was assigned to a district by testing whether its centre point lies inside a district polygon (Sedona `ST_Contains` with a broadcast join). District polygons have up to 4,000 vertices, so they were cut into small pieces with `ST_SubDivideExplode` to keep the spatial index effective. Cleaning then repaired invalid geometries, searched for exact duplicates (by a hash of the geometry), removed buildings under 10 m², and flagged, without removing, buildings whose source confidence is below 0.70. Results are in Table 3.'),
  tcap('Table 3. District join and cleaning'),
  table(['Step', 'Buildings'], [
    ['Downloaded (Kerala bounding box)', '19,355,143'],
    ['Outside Kerala (Tamil Nadu, Karnataka, sea)', '6,350,240'],
    ['Inside Kerala', '13,004,903'],
    ['Invalid geometries / exact duplicates', '0 / 0'],
    ['Removed: smaller than 10 m²', '15,538'],
    ['**Kept**', '**12,989,365**'],
    ['Kept but flagged: low source confidence (< 0.70)', '2,213,255'],
  ], [6500, 2526], { right: [1] }),
  gap(),
  P('Total roof area is about 1,175 km², and the median roof is 69 m². The join, cleaning and write of the partitioned GeoParquet took 9.8 minutes.'),
  H2('3.4 Spark compared with Sedona, and MapReduce with Spark SQL'),
  P('The same district join was run with plain Spark (a Python function using Shapely that tests each building against the 14 district shapes sent to every worker, with no spatial index) and with Sedona\'s spatial join on district shapes cut into pieces, on samples of 10 thousand, 100 thousand and 1 million buildings and on the full data. Both gave identical matches. Sedona was 3.5 to 5.9 times faster, as Figure 2 shows. The full-size time for plain Spark (805 s) is extrapolated from the 1-million run, whereas Sedona\'s 137 s was measured end to end including reading the file.'),
  ...figure('fig_spark_sedona.png', 440, 'Figure 2. Plain Spark (Python and Shapely, no spatial index) against Apache Sedona for the same district join (log scale).'),
  P('District totals of buildings and roof area were also computed twice for the whole of Kerala: as a MapReduce job written with Spark RDDs (map to (district, (1, area)), reduceByKey) and as one Spark SQL `GROUP BY`. The RDD version took 97.6 s and Spark SQL 9.6 s, about ten times faster, because the optimiser works on columns and avoids moving Python objects.'),
  H2('3.5 Roof features'),
  P('Each roof received the following features (notebooks 03, 05 and 09):'),
  ...bullets([
    '**Size and shape:** footprint area (square metres, calculated on the ellipsoid) and compactness, 4πA / P², where 1 is a circle.',
    '**Sunshine:** the Global Solar Atlas yield (daily PVOUT × 365.25) at the roof centre, between 1,460 and 1,578 kWh per kWp per year for Kerala roofs (state mean about 1,523).',
    '**Tree cover:** the share of tree pixels in ESA WorldCover within about 28 m, 140 m and 300 m of the roof. WorldCover turned out to be saturated: the 28 m tree share is 100% for 69% of roofs, because small houses hidden under coconut and jack trees are classed as tree.',
    '**Tree height:** from the Meta and WRI 1 m canopy height map, four numbers per roof: the tallest tree within about 5 m and 15 m, and the share of ground within 15 m and 30 m covered by trees 5 m or taller. The 19 tiles (about 82 billion pixels) were read in strips and reduced in 3 × 3 pixel blocks, which was four times faster and correlated 0.987 or higher with full resolution on a test strip. All 12,989,365 roofs received values in 19.9 minutes.',
    '**Crowding:** the number of buildings in the roof\'s H3 hexagon (resolution 9, about 0.1 km²).',
    '**Outline quality:** the source confidence and the data source.',
  ]),
  P('Looking up raster values per roof with Sedona\'s raster join took 385.7 minutes for the sunshine and tree layers. The same lookups written as NumPy array indexing on the whole raster took 42 seconds (notebook 05). The faster method was therefore used for the neighbourhood tree features. The slower Sedona join is kept in notebook 03 as the documented raster-vector example.'),
  H2('3.6 PostGIS: indexing and partitioning (Module 2)'),
  P('The 13 million roofs were loaded into PostgreSQL 16 with PostGIS 3.4 in Colab (3.3 GB, 0.9 minutes through DuckDB\'s Postgres connector). A GiST spatial index and LIST partitioning by district were then compared with the plain table (Figure 3, Table 4).'),
  ...figure('fig_postgis.png', 420, 'Figure 3. PostGIS query times without and with a spatial index, and on a normal and a partitioned table (log scale).'),
  tcap('Table 4. PostGIS test queries'),
  table(['Test', 'Time'], [
    ['Roofs within 1 km of Kochi, no index (5,250 roofs)', '20,462 ms'],
    ['The same query with a GiST index', '45.4 ms (about 450 times faster)'],
    ['Count of Wayanad roofs, normal table', '1,237.7 ms'],
    ['Count of Wayanad roofs, table partitioned by district', '117.0 ms (about 10 times faster)'],
    ['Spatial join: roofs inside the Wayanad polygon', '1,837 ms (342,879 roofs, matching the district column)'],
    ['5 nearest roofs to a point (KNN)', '0.4 ms'],
  ], [4900, 4126]),
  gap(),
  H2('3.7 Unsupervised learning and association rules (Module 3)'),
  P('**K-means.** The roofs were aggregated into 260,447 H3 hexagons (resolution 9). Each hexagon was described by the log of its roof count, the log of its median roof area, the share of roofs seen as built-up by WorldCover and the 140 m and 300 m tree shares, standardised with StandardScaler. Silhouette scores for k = 3 to 8 were highest for k = 3 (0.699, against 0.452 for k = 4), so three area types were used (Table 5).'),
  tcap('Table 5. Area types from K-means (k = 3)'),
  table(['Area type', 'Hexagons', 'Roofs', 'Roofs per hexagon', 'Median roof', 'Trees within 300 m'], [
    ['Towns and urban areas', '28,688', '3.34 M', '116', '87 m²', '64%'],
    ['Homestead villages under trees', '216,229', '9.46 M', '44', '68 m²', '94%'],
    ['Sparse open land, paddy, backwaters', '15,530', '0.19 M', '12', '55 m²', '41%'],
  ], [2700, 1100, 950, 1300, 1250, 1726], { right: [1, 2, 3, 4, 5] }),
  gap(),
  P('**FP-Growth.** Roofs were turned into baskets of banded properties (roof size band, what WorldCover sees at the roof, tree share band, crowding band, shape, outline confidence), and FP-Growth with minimum support 0.05 and minimum confidence 0.6 found 188 frequent itemsets and 186 rules, reduced to 36 after removing longer copies of shorter rules. The strongest rule says that roofs seen as built-up in a town have low tree cover within 300 m (confidence 0.77, lift 4.19). Roofs with a low-confidence outline are usually small (confidence 0.73, lift 2.0), and roofs in villages usually have high tree cover (confidence 0.62, lift 1.5). The rules agree with the cluster profiles and with the classifier below. Rules mined later on the model\'s own predictions describe the model, not new facts, and are labelled so in the notebooks.'),
  H2('3.8 Training labels'),
  P('A random sample of 300 roofs was drawn with a fixed hash of the building identifier, 21 per district plus 6 extra, with no features shown, so that labels are blind to the data used for modelling. Each roof was judged on satellite imagery as **1 good** (large enough and mostly sunny, sloped or flat), **0 bad** (shaded, very small or broken) or **2 not a building**. Two independent labellers were used:'),
  ...bullets([
    'the author labelled 294 roofs in QGIS on Esri World Imagery (6 were too unclear and skipped);',
    'an AI vision model (Google Gemini Flash Lite) labelled 296 roofs from the same Esri image and outline, without seeing the human label.',
  ]),
  P('On the 293 roofs labelled by both, the two agreed on "good against not good" for 218 roofs (74%, Cohen\'s kappa 0.50). The AI called far more roofs "not a building" (62 against 11), which is why that class was merged with "bad" for the suitability model (Table 6).'),
  tcap('Table 6. Author\'s labels against the AI\'s labels (293 roofs)'),
  table(['Author \\ AI', 'Good', 'Bad', 'Not a building', 'Total'], [
    ['Good', '110', '40', '16', '166'],
    ['Bad', '18', '60', '38', '116'],
    ['Not a building', '1', '2', '8', '11'],
    ['Total', '129', '102', '62', '293'],
  ], [2300, 1600, 1600, 1900, 1626], { right: [1, 2, 3, 4], boldLast: true }),
  gap(),
  P('The 75 roofs on which they disagreed were shown again to the author **blind**: in random order, without either earlier label. 72 were decided (3 were too unclear). Of these, the author\'s first label was right on 49 and the AI\'s on 23. This favours the author, but the author is also one of the two labellers, so the tie-break may lean towards the author\'s own view; a third independent judge would remove this bias (Section 5.2).'),
  P('The final **gold labels** combine the 218 agreed roofs and the 72 blind-checked roofs: **290 roofs, 156 good and 134 not good** (120 bad and 14 not a building). They were chosen for their reliability (two independent opinions that agree, plus a blind second look), not because they gave a higher model accuracy, which could not be compared fairly between label sets. The model was also trained on the author\'s labels alone and on the AI labels alone as a sensitivity check (Section 4.4). The use of an AI labeller is disclosed here because it is part of the method.'),
  H2('3.9 Random Forest classification (Module 3)'),
  P('A Spark MLlib Random Forest (200 trees, maximum depth 6, at least 3 roofs per leaf, square-root feature subsets, class weights to balance good and not good) predicts whether a roof is suitable from 15 features: roof size, shape, three tree-cover features, whether WorldCover sees the roof as built-up, crowding, outline confidence, a low-confidence flag, data source, the K-means area type and the four canopy-height features. The Global Solar Atlas yield was deliberately left out: it varies only slowly across the state and acted as a stand-in for location rather than for roof quality.'),
  P('Accuracy was measured by **leave-one-district-out cross-validation**: the model is trained on 13 districts and tested on the 14th, 14 times. This is stricter than a random split, where test roofs sit next to training roofs, and it answers the real question of how well the model works in a district it has not seen. A random 5-fold split, a simple rule (suitable if the roof is at least 40 m² and seen as built-up) and two constant answers were kept for comparison. The final model was then trained on all 290 labels and used to predict all 12,989,365 roofs in 11 minutes.'),
  H2('3.10 Free roof area (Module 1: Sedona geometry)'),
  P('Not all of a suitable roof can carry panels: an edge strip is left free for safety and maintenance, and a stair room and water tank occupy part of the surface. Instead of one assumed percentage for all roofs, each suitable roof\'s free area was calculated from its own outline with Sedona. The footprint is transformed to UTM zone 43N (metres), shrunk inwards with `ST_Buffer` by a negative distance of 0.6 m, and 8 m² is subtracted for the stair room and tank. A check that the area in metres matches the earlier area (median ratio 0.9997) confirmed the coordinate handling. The 6,692,930 suitable roofs were processed in 6.4 minutes, about 17,500 roofs per second.'),
  P('Capacity assumes 10 m² of free roof per kWp (a common MNRE rule of thumb that includes gaps between panel rows), and yearly electricity multiplies capacity by the Global Solar Atlas yield at the roof. Because the edge strip and stair room are assumptions, the calculation was repeated for edge strips of 0.3, 0.6 and 1.0 m and stair rooms of 0, 8 and 12 m².'),
  H2('3.11 Scenarios, carbon and household economics (Module 4)'),
  ...bullets([
    '**Technical maximum:** every suitable roof carries panels on all its free area.',
    '**Realistic:** each suitable roof installs its free area up to 3 kW, the size supported by the PM Surya Ghar subsidy; larger roofs are capped, because households size systems to their needs.',
    '**CO₂ avoided:** yearly electricity multiplied by 0.727 t CO₂ per MWh, the weighted average grid emission factor in the CEA CO₂ Baseline Database version 20 (financial year 2023-24).',
    '**Household calculator (dashboard):** payback = system cost after subsidy ÷ yearly savings, with the subsidy of ₹30,000 per kW for the first 2 kW plus ₹18,000 for the third kW (maximum ₹78,000), a default price of ₹65,000 per kW, and separate prices for units used at home and units exported.',
  ]));

// 4 Results
add(H1('4. Results'),
  H2('4.1 Kerala as a whole'),
  P('Of the 12,989,365 roofs, the model classified **6,692,930 (51.5%)** as suitable. Table 7 gives the potential under the two scenarios.'),
  tcap('Table 7. Rooftop solar potential of Kerala'),
  table(['Level', 'Capacity', 'Electricity per year', 'CO₂ avoided per year'], [
    ['Technical maximum (all free area, main setting)', '64.3 GW', '98.1 TWh', '71 Mt'],
    ['Range across edge and stair-room assumptions', '51 to 78 GW', '79 to 119 TWh', '57 to 86 Mt'],
    ['**Realistic (≤ 3 kW per suitable roof)**', '**18.5 GW**', '**28.2 TWh**', '**20.5 Mt**'],
    ['Installed rooftop solar, October 2024', '0.95 GW', 'not stated', 'not stated'],
    ['Kerala\'s yearly electricity requirement (CEA projection, 2024-25)', '-', 'about 32 TWh', '-'],
  ], [4300, 1500, 1750, 1476], { right: [1, 2, 3] }),
  gap(),
  P('The realistic case, 28.2 TWh, equals about 88% of Kerala\'s yearly electricity requirement and needs about twenty times the capacity installed today. The technical maximum is more than three times the state\'s demand, which shows that rooftop area is not the limit; cost, grid capacity, ownership and willingness to install are.'),
  H2('4.2 Districts and hexagons'),
  P('Ernakulam has the largest potential (3.68 TWh realistic; 70% of its roofs are suitable), followed by Thrissur (3.00 TWh) and Malappuram (2.90 TWh). Wayanad has the smallest (0.67 TWh). Ernakulam leads because it has large, mostly urban roofs and less tree shade (average tallest tree near roofs 7.9 m, against 12.3 m in Kozhikode). Malappuram has the most buildings (1.60 million) but only 43% of its roofs are suitable, because most of its roofs belong to tree-covered villages (12% of its roofs are in town areas, against 53% in Ernakulam).'),
  ...figure('fig_districts.png', 470, 'Figure 4. Yearly electricity potential by district, realistic and technical maximum.'),
  tcap('Table 8. Results by district (sorted by realistic electricity)'),
  table(['District', 'Roofs', 'Suitable', 'Realistic GW', 'Realistic TWh', 'Maximum GW'], [
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
  ], [2300, 1350, 1100, 1370, 1500, 1406], { right: [1, 2, 3, 4, 5], boldLast: true }),
  gap(),
  ...figure('fig_map.png', 300, 'Figure 5. Realistic solar capacity per H3 hexagon (resolution 7, about 5 km²). The darkest areas are Kochi, Thiruvananthapuram, Thrissur, Kozhikode and Kannur.'),
  H2('4.3 Towns and villages'),
  P('The K-means area types explain much of the variation. In towns, 78% of roofs are suitable, against 42% in homestead villages and 69% in sparse open land. Villages hold 9.46 million of the 12.99 million roofs, so they still contribute 11.3 GW of the 18.5 GW realistic capacity, more than the towns\' 6.9 GW. The reason is shade and size: village roofs are smaller (median 68 m², against 87 m² in towns), and 94% of the ground within 300 m of a village roof is tree-covered.'),
  H2('4.4 How well does the model classify roofs?'),
  P('In leave-one-district-out testing, the Random Forest classified **67% of roofs correctly** (ROC AUC 0.72), against 54% for always answering "suitable" and 58% for the simple size-and-built-up rule, which is precise (95% of the roofs it accepts are good) but rejects most good roofs (recall 24%). Accuracy by district ranges from 0.57 (Palakkad) to 0.81 (Idukki, Thiruvananthapuram, Thrissur), with only about 20 labelled roofs per district, so single-district figures are uncertain.'),
  ...figure('fig_model.png', 560, 'Figure 6. Left: accuracy of the Random Forest and of simple alternatives. Right: the eight features the model relies on most.'),
  tcap('Table 9. Model checks on the 290 gold labels'),
  table(['Check', 'Accuracy', 'ROC AUC'], [
    ['Random Forest without tree height, leave one district out', '0.679', '0.712'],
    ['**Random Forest with tree height, leave one district out**', '**0.672**', '**0.719**'],
    ['Random Forest with tree height, random 5-fold', '0.703', '0.729'],
    ['Random Forest, real buildings only (not-a-building roofs removed)', '0.663', '0.728'],
    ['Simple rule (≥ 40 m² and seen as built-up)', '0.583', '0.611'],
    ['Always "good" / always "not good"', '0.538 / 0.462', '0.500'],
  ], [5900, 1600, 1526], { right: [1, 2] }),
  gap(),
  P('Two findings deserve emphasis. First, **adding the Meta 1 m tree-height features did not improve accuracy** (0.679 without, 0.672 with, a difference far inside the sampling noise of about ±5 points). Tree height on its own separates good from bad roofs about as well as the WorldCover tree share (single-feature AUC 0.39 for tree height against 0.37 for the 140 m WorldCover tree share, both on the author\'s labels), so it carries mostly the same information. This is reported as a negative result. Second, the accuracy ceiling of about 67 to 68% most likely comes from the labels and the data, not from the algorithm: two careful labellers agreed on only 74% of roofs, and roof material, slope, condition and exact shade are invisible in the available data.'),
  P('As a sensitivity check, the same pipeline run with the author\'s labels alone, the AI labels alone and the gold labels gave totals of 57.0 GW, 52.6 GW and 52.0 GW for the earlier all-free-area-at-60% setting, so the state total changes by less than 10% across label sets, even though accuracy on individual roofs is modest. District and state totals are therefore more reliable than the answer for any single roof: on the test districts the model\'s errors nearly cancel (43 roofs wrongly called suitable against 52 wrongly called not suitable).'),
  H2('4.5 How much of a roof is free?'),
  P('Calculated from each roof\'s own outline, the free share of suitable roofs rises with roof size: 40% for roofs under 50 m², 65% for 50 to 120 m², 78% for 120 to 500 m² and 91% above 500 m². The average is 74% of roof area, so the earlier single guess of 60% was too high for small roofs and too low for large ones. 3.1% of the smallest roofs have no free area left at all.'),
  ...figure('fig_freeshare.png', 400, 'Figure 7. Free share of suitable roofs by roof size, after a 0.6 m edge strip and an 8 m² stair room and tank.'),
  ...figure('fig_sensitivity.png', 440, 'Figure 8. Technical maximum under different edge-strip and stair-room assumptions. The grey bar is the earlier 60% guess.'),
  P('The technical maximum ranges from 51 GW (1.0 m edge, 12 m² stair room) to 78 GW (0.3 m edge, no stair room) around the main setting of 64 GW. Other obstacles (extra tanks, air conditioners, clothes lines) are not modelled, so the maximum leans high; the realistic case is much less affected because many roofs are capped at 3 kW.'),
  H2('4.6 Dashboard'),
  P('An interactive web dashboard (Figure 9) presents the results. It has a 3D hexagon map with a dark basemap, on which towers rise with solar capacity and single roofs appear when zooming in; headline cards for buildings, suitable roofs, capacity, electricity, CO₂ and homes served; a district ranking; a side-by-side comparison of any two districts; a household savings and payback calculator; a summary of the method and the model\'s accuracy; and a six-step story mode for presentations. For a 3 kW system in Ernakulam, priced at ₹65,000 per kW with the full subsidy and a household using 200 units a month, the calculator gives yearly savings of about ₹21,000 and a payback of about 5.6 years. The dashboard is a static web page that reads a 1.6 MB data file produced by notebook 12, so it needs no server. A Streamlit version is kept as a backup.'),
  ...figure('dashboard_main.png', 560, 'Figure 9. The dashboard: 3D map, headline numbers and district ranking.'),
  H2('4.7 Evidence of distributed processing'),
  P('The Spark UI of the notebook that produced the dashboard files (Figure 10) shows 22 jobs on one driver with 2 cores and 8 GB of memory. The longest query (2.6 minutes) scanned 112 Parquet files with 12,989,365 roof predictions (1,138 MiB) and 56 files with 6,692,930 free-area rows (262 MiB), shuffled 1,098 MiB and 297 MiB into 8 partitions, joined them with a sort-merge join, computed each roof\'s H3 cell with Sedona `ST_H3CellIDs`, and cached the result in memory (1,549 MiB, 100% cached). The later summaries reused this cache, which the "skipped stages" in the job list show, and finished in seconds. Full Spark UI pages are in the project repository (`report/figures`).'),
  ...figure('fig_spark_timeline_crop.png', 540, 'Figure 10. Spark UI event timeline of the dashboard-data notebook; job 6 (1.9 minutes) is the large join.'));

// 5 Discussion
add(H1('5. Discussion'),
  H2('5.1 How the results compare with other estimates'),
  P('Published figures are lower because they measure different things. A WRI India study puts Kerala\'s total in-state solar potential at 10.9 GW, and a CSTEP roadmap finds about 14 GW of usable solar and wind combined; both include practical, economic and grid limits. The CEEW study of Indian homes found a technical rooftop potential of 637 GW for the whole country, which falls to 118 GW once matched to household consumption and to 32 GW with the central subsidy. This project\'s 64 GW is a physical maximum, and its 18.5 GW realistic case sits between the practical estimates and the maximum. NREL\'s lidar-based study of the United States found that about 26% of the roof area of small buildings is suitable after shading and orientation losses; this project keeps 52% of roofs as suitable and then 74% of their area as free. The two measures differ (a share of roof area in the United States, a share of roofs here, followed by a geometric free-area rule), and the building stocks differ, so they are only loosely comparable.'),
  H2('5.2 Limitations'),
  ...bullets([
    '**Labels.** 290 labelled roofs, about 20 per district, set the limit of the classifier. The blind re-check was done by the author, who was also one of the two labellers, so it may lean towards the author\'s view; a third independent judge would remove this. No untouched test set was kept, and some choices (dropping the sunshine feature, choosing the label set) were made after seeing results on the same roofs, so the reported accuracy may be slightly optimistic.',
    '**Imagery dates differ.** Building footprints, canopy heights (about 2018 to 2020) and labelling imagery (Esri, about 2025) come from different years, so some roofs and trees changed between them.',
    '**Geometry only.** Free area uses the flat footprint. Roof slope and orientation, partial shading, roof material and strength, extra obstacles, grid capacity and ownership are not modelled, and the 10 m² per kWp rule is a rule of thumb.',
    '**Yield.** The Global Solar Atlas value is a long-term average at about 1 km resolution; typical Kerala systems often yield 5 to 10% less because of monsoon cloud, heat and dust.',
    '**Rules on predictions.** FP-Growth rules found on the model\'s own predictions describe the model, not independent facts.',
    '**Local mode.** Spark ran on one machine; scaling to a cluster is untested.',
    '**Imagery terms.** Esri World Imagery was used for labelling and was sent to the AI labeller, and Google satellite tiles were only viewed in QGIS during the blind check. Their terms of use limit further use of the imagery, so the report uses Esri imagery with credit and does not republish tiles.',
  ]),
  H2('5.3 What the results mean'),
  P('The ranking of districts and the contrast between towns and villages are the most robust findings: they appear under every label set, and they follow from simple, visible facts (roof size and tree shade). The absolute totals depend on assumptions and are best quoted as ranges. For policy, the main message is that rooftop **area** is not the constraint in Kerala; installed capacity could grow twenty-fold before suitable roofs run out. Programmes should therefore target the town hotspots first, where roofs are large and unshaded, and look at village roofs separately, where shade and small size reduce the benefit per house.'));

// 6 Conclusion
add(H1('6. Conclusion'),
  P('The project built a complete spatial big-data pipeline for rooftop solar in Kerala and met the course objectives: Sedona against plain Spark (3.5 to 5.9 times faster), MapReduce against Spark SQL (about 10 times faster), data cleaning at scale, a 450-times speed-up from a GiST index and a 10-times speed-up from partitioning in PostGIS, K-means clustering, FP-Growth rules and a Random Forest classifier, all on 12,989,365 roofs. The case-study result is that about half of Kerala\'s roofs are suitable for solar, that rooftops could realistically host about 18.5 GW and produce about 28 TWh a year (88% of the state\'s need, and 20.5 million tonnes of CO₂ avoided), and that towns and the districts of Ernakulam, Thrissur and Malappuram hold the largest potential.'),
  P('**Future work:** (1) have an independent second person label the disputed roofs and add several thousand more labels; (2) add roof slope, orientation and partial shading from 3D data or sun-path simulation; (3) validate the free-area rule against measured roofs; (4) run the pipeline on a multi-node cluster to test scaling; (5) combine the potential with grid capacity and household income to estimate adoption.'));

// References
add(H1('References'),
  ...[
    'Agrawal, R., & Srikant, R. (1994). Fast algorithms for mining association rules. *Proceedings of VLDB*.',
    'Apache Software Foundation. Apache Sedona documentation (version 1.9.1). https://sedona.apache.org',
    'Breiman, L. (2001). Random forests. *Machine Learning*, 45(1), 5-32.',
    'Central Electricity Authority (India). CO₂ Baseline Database for the Indian Power Sector, version 20 (December 2024) and user guide version 22.',
    'Council on Energy, Environment and Water (2023). *Mapping India\'s Residential Rooftop Solar Potential: A Bottom-up Assessment Using Primary Data.* New Delhi: CEEW.',
    'CSTEP (2024). *Kerala Energy Transition Roadmap 2040.* Bengaluru.',
    'ESA (2022). WorldCover 10 m 2021 v200. Zanaga, D., et al. https://worldcover2021.esa.int',
    'Gagnon, P., Margolis, R., Melius, J., Phillips, C., & Elmore, R. (2016). *Rooftop Solar Photovoltaic Technical Potential in the United States: A Detailed Assessment.* NREL/TP-6A20-65298.',
    'Global Solar Atlas 2.0. World Bank Group, Solargis. https://globalsolaratlas.info',
    'Han, J., Pei, J., & Yin, Y. (2000). Mining frequent patterns without candidate generation. *Proceedings of ACM SIGMOD*.',
    'Meng, X., et al. (2016). MLlib: Machine learning in Apache Spark. *Journal of Machine Learning Research*, 17(34), 1-7.',
    'Overture Maps Foundation. Buildings and Divisions themes, release 2026-10-21.0. https://overturemaps.org',
    'Tolan, J., et al. (2024). Very high resolution canopy height maps from RGB imagery using self-supervised vision transformer and convolutional decoder trained on aerial lidar. *Remote Sensing of Environment*, 300, 113888.',
    'Uber Technologies. H3: a hexagonal hierarchical geospatial indexing system. https://h3geo.org',
    'WRI India. *Assessing Technologies for Expanding Renewable Energy in Kerala.*',
    'Yu, J., Zhang, Z., & Sarwat, M. (2019). Spatial data management in Apache Spark: the GeoSpark perspective and beyond. *GeoInformatica*, 23, 37-78.',
    'Zaharia, M., et al. (2016). Apache Spark: a unified engine for big data processing. *Communications of the ACM*, 59(11), 56-65.',
  ].map((t) => new Paragraph({ children: runs(t, { size: 19 }), spacing: { after: 30, line: 240 }, alignment: AlignmentType.LEFT,
    indent: { left: 360, hanging: 360 } })));

// Appendix
add(H1('Appendix A. Notebooks'),
  table(['No.', 'Notebook', 'What it does'], [
    ['01', 'download_data', 'Downloads Overture buildings and district boundaries with DuckDB'],
    ['02', 'sedona_clean_join', 'District join, cleaning, Spark against Sedona timing, MapReduce'],
    ['03', 'roof_features', 'Sunshine, tree cover, shape, H3 crowding (Sedona raster join)'],
    ['04', 'label_sample', 'Draws the random sample of 300 roofs for labelling'],
    ['05', 'tree_features', 'Neighbourhood tree features with NumPy (385.7 min to 42 s)'],
    ['06', 'postgis', 'PostGIS loading, GiST index, partitioning, query timing'],
    ['07', 'kmeans_fpgrowth', 'K-means area types on H3 hexagons, FP-Growth rules'],
    ['08', 'random_forest (three variants)', 'Random Forest on the author\'s, AI and agreed labels'],
    ['09', 'canopy_height', 'Meta 1 m canopy height around every roof (82 billion pixels)'],
    ['10', 'random_forest_final', 'Final model on the gold labels; predictions for all roofs'],
    ['11', 'usable_roof_area', 'Free roof area with Sedona ST_Buffer; sensitivity analysis'],
    ['12', 'dashboard_data', 'Summaries for the dashboard; Spark UI evidence'],
  ], [700, 2900, 5426]),
  gap(),
  P('The `tools` folder holds the QGIS scripts used for labelling (`qgis_label_helper.py`), the AI second labeller (`qgis_ai_labeller.py`) and the blind check (`qgis_adjudicate.py`). All notebooks read and write `MyDrive/rooftop_solar/` in Google Drive.'),
  H1('Appendix B. Course syllabus coverage'),
  table(['Topic required', 'Where it is done'], [
    ['Spark and Sedona for spatial big data; Spark against Sedona', 'Section 3.4 and Figure 2 (notebook 02)'],
    ['MapReduce against Spark SQL', 'Section 3.4 (notebook 02)'],
    ['GeoParquet, partitioned storage, data cleaning at scale', 'Sections 3.3 and 3.5 (notebooks 01, 02)'],
    ['Raster and vector integration', 'Section 3.5 (notebooks 03, 05, 09)'],
    ['PostGIS, spatial indexing, partitioning', 'Section 3.6 and Figure 3 (notebook 06)'],
    ['Clustering', 'Section 3.7 (K-means, notebook 07)'],
    ['Association rules', 'Section 3.7 (FP-Growth, notebooks 07, 10)'],
    ['Classification on spatial big data', 'Sections 3.9 and 4.4 (Random Forest, notebooks 08, 10)'],
    ['Case study, environment and economics', 'Sections 3.10, 3.11, 4.1 to 4.6 (notebook 11 and the dashboard)'],
  ], [4300, 4726]),
  gap(),
  H1('Appendix C. Reproducing the work'),
  ...numbered([
    'Open the notebooks in the repository in order (01 to 12) in Google Colab and choose Runtime, Run all; each notebook mounts Google Drive and writes a log to `logs/`.',
    'Download `dashboard_data.zip` from `results/` and unzip it into `dashboard/data`.',
    'Run `python dashboard/web/build_data.py` and open `dashboard/web/index.html` in a browser (internet is needed for the basemap).',
  ], 'num2'));

// ---------- document ----------
const doc = new Document({
  creator: 'Muhammed Shahid S',
  title: 'Spatial Big Data Analytics for Rooftop Solar Potential in Kerala',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 32, bold: true, color: BLUE },
        paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 25, bold: true, color: '2F2F2F' },
        paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    { reference: 'num2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
  ] },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: title },
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1300, left: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Rooftop Solar Potential of Kerala  |  Page ', size: 16, color: '777777' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '777777' })] })] }) },
      children: body },
  ],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log('wrote', OUT, (buf.length / 1e6).toFixed(2), 'MB'); });
