const fs = require('fs');
const pptxgen = require('pptxgenjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const { applyTheme } = require('C:/Users/shemi/.claude/skills/synced/c6a47773-382b-44c6-8b8e-7a61dbba6f3c_e55a666b-ec86-4f26-be7f-de55d129bd6f/pptx/scripts/apply_theme.js');

const FIG = 'D:/claude_anti/Rooftop solar potential(b_spatial)/report/figures/';
const OUT = process.argv[2];
const D = require('./deckdata.json');

// ---------- theme ----------
const THEME = {
  name: 'Kerala Rooftop Solar', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: { dk1: '1A1A19', lt1: 'FFFFFF', dk2: '1F1F1D', lt2: 'F1F2F4',
    accent1: 'F6B73C', accent2: '2A78D6', accent3: 'EB6834', accent4: '1C7C54', accent5: '898781', accent6: '9EC5F4',
    hlink: '2A78D6', folHlink: '6250D6' },
};
const HEX = { amber: 'F6B73C', blue: '2A78D6', orange: 'EB6834', green: '1C7C54', grey: '898781', ink: '1A1A19', light: 'F1F2F4', lblue: '9EC5F4' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';                       // 10 x 5.625 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Rooftop Solar Potential of Kerala';
pres.author = 'Muhammed Shahid S';
pres.subject = 'Spatial Bigdata Analytics (M5221357)';
const C = pres.SchemeColor;
const FOOT = 'Rooftop Solar Potential of Kerala  |  Muhammed Shahid S';

// ---------- layouts ----------
const titlePh = (color) => ({ placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 34, bold: true,
  color, align: 'left', valign: 'middle', margin: 0 }, text: '' } });
pres.defineSlideMaster({ title: 'CONTENT', background: { color: C.background1 },
  objects: [titlePh(C.text1),
    { text: { text: FOOT, options: { x: 0.5, y: 5.28, w: 6, h: 0.25, fontSize: 10, color: C.accent5, margin: 0, isTextBox: true } } }],
  slideNumber: { x: 9.0, y: 5.28, w: 0.5, h: 0.25, fontSize: 10, color: C.accent5, align: 'right' } });
pres.defineSlideMaster({ title: 'DARK', background: { color: C.text2 },
  objects: [titlePh(C.background1),
    { text: { text: FOOT, options: { x: 0.5, y: 5.28, w: 6, h: 0.25, fontSize: 10, color: C.accent5, margin: 0, isTextBox: true } } }],
  slideNumber: { x: 9.0, y: 5.28, w: 0.5, h: 0.25, fontSize: 10, color: C.accent5, align: 'right' } });
pres.defineSlideMaster({ title: 'COVER', background: { color: C.text2 }, objects: [] });

// ---------- helpers ----------
const iconPng = async (Icon, hex, size = 256) => {
  const svg = renderToStaticMarkup(React.createElement(Icon, { color: '#' + hex, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
};
const imgSize = (f) => { const b = fs.readFileSync(FIG + f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const ICONS = {};
const iconCircle = async (slide, Icon, x, y, d, name, o = {}) => {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: o.bg || C.accent1 }, line: { type: 'none' }, objectName: name + ' circle' });
  const pad = d * 0.25;
  slide.addImage({ data: await iconPng(Icon, o.fg || HEX.ink), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad,
    altText: name, objectName: name });
};
const T = (slide, text, x, y, w, h, o = {}) => slide.addText(text, { x, y, w, h, margin: 0, isTextBox: true, valign: 'top', ...o });
const card = (slide, x, y, w, h, name, o = {}) => slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08,
  fill: o.fill || { color: C.background2 }, line: { type: 'none' }, objectName: name });
const stat = (slide, big, label, x, y, w, name, o = {}) => {
  T(slide, big, x, y, w, 0.75, { fontSize: o.size || 40, bold: true, fontFace: 'Cambria', color: o.color || C.text1, valign: 'middle', objectName: name + ' number' });
  T(slide, label, x, y + 0.75, w, o.lh || 0.6, { fontSize: 14, color: o.lcolor || C.text1, objectName: name + ' label' });
};
const notes = (slide, t) => slide.addNotes(t);
const chartText = { catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', legendFontFace: '+mn-lt', titleFontFace: '+mn-lt' };

(async () => {
  const ic = { sun: fa.FaSun, tree: fa.FaTree, ruler: fa.FaRulerCombined, height: fa.FaArrowsAltV, poly: fa.FaDrawPolygon, ok: fa.FaCheckCircle,
    warn: fa.FaExclamationTriangle, next: fa.FaForward, db: fa.FaDatabase, bolt: fa.FaBolt, home: fa.FaHome, city: fa.FaCity,
    laptop: fa.FaLaptop, cloud: fa.FaCloud, cogs: fa.FaCogs, tag: fa.FaTags, link: fa.FaLink, mouse: fa.FaMousePointer, calc: fa.FaCalculator,
    play: fa.FaPlay, cmp: fa.FaBalanceScale, leaf: fa.FaLeaf };

  // ===== 1 Cover =====
  pres.addSection({ title: 'Opening' });
  let s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'Opening' });
  T(s, 'Rooftop Solar Potential of Kerala', 0.5, 0.55, 4.7, 1.65, { fontSize: 38, bold: true, fontFace: 'Cambria', color: C.background1, valign: 'top', objectName: 'Title' });
  T(s, 'Spatial big data analytics with Apache Sedona and Spark MLlib', 0.5, 2.3, 4.5, 0.75, { fontSize: 18, color: C.accent1, objectName: 'Subtitle' });
  T(s, [
    { text: 'Muhammed Shahid S  |  Roll No. 253308', options: { bold: true, breakLine: true } },
    { text: 'M.Sc. Data Science and Geoinformatics', options: { breakLine: true } },
    { text: 'Digital University Kerala', options: { breakLine: true } },
    { text: 'Supervisor: Manoj Kumar Sir', options: { breakLine: true } },
    { text: 'Spatial Bigdata Analytics (M5221357)  |  12 Nov 2026' },
  ], 0.5, 3.45, 4.7, 1.55, { fontSize: 14, color: C.background1, paraSpaceAfter: 4, objectName: 'Author details' });
  const dm = imgSize('dashboard_main.png');
  s.addImage({ path: FIG + 'dashboard_main.png', x: 5.45, y: 1.55, w: 4.1, h: 4.1 * dm.h / dm.w, rounding: false,
    altText: 'Screenshot of the Kerala rooftop solar dashboard with a 3D hexagon map', objectName: 'Dashboard screenshot' });
  await iconCircle(s, ic.sun, 5.45, 0.5, 0.75, 'Sun icon');
  T(s, 'Final project presentation', 6.35, 0.5, 3.2, 0.75, { fontSize: 14, color: C.background1, valign: 'middle', objectName: 'Presentation label' });
  notes(s, 'Good morning. My project is about how much electricity Kerala could make from its rooftops. I used spatial big data tools, Apache Sedona and Spark, on all 13 million buildings in Kerala. The picture on the right is the dashboard I built; I will show it live at the end.');

  // ===== 2 The question =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Opening' });
  s.addText('Kerala buys most of its power', { placeholder: 'title' });
  const cols2 = [[ic.bolt, '30%', 'of its own electricity is made inside Kerala; the rest is bought'], [ic.home, '0.95 GW', 'of rooftop solar installed today (October 2024)'],
    [ic.tag, '₹78,000', 'subsidy for a 3 kW home system under PM Surya Ghar']];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 3.1;
    card(s, x, 1.3, 2.8, 2.6, 'Fact card ' + (i + 1));
    await iconCircle(s, cols2[i][0], x + 0.25, 1.5, 0.6, 'Fact icon ' + (i + 1));
    stat(s, cols2[i][1], cols2[i][2], x + 0.25, 2.2, 2.35, 'Fact ' + (i + 1), { size: 36, lh: 0.95 });
  }
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.15, w: 9, h: 0.85, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Question banner' });
  T(s, 'Question: how much electricity could all of Kerala\'s roofs make, and where?', 0.8, 4.15, 8.4, 0.85, { fontSize: 20, bold: true, color: C.text1, valign: 'middle', objectName: 'Question text' });
  notes(s, 'Kerala makes only about 30 percent of the electricity it uses. There is little empty land for big solar farms, but roofs are already there. The government gives up to 78 thousand rupees for a 3 kilowatt home system, but only 0.95 gigawatt is installed. So the question is: how many roofs are good for solar, and how much power can they give?');

  // ===== 3 Why big data =====
  pres.addSection({ title: 'Method' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Why this is big data', { placeholder: 'title' });
  const bd = [['19.4 M', 'building polygons to process'], ['82 billion', 'map pixels of tree height'], ['8 GB', 'laptop cannot hold the data']];
  for (let i = 0; i < 3; i++) {
    const y = 1.3 + i * 1.2;
    card(s, 0.5, y, 3.9, 1.05, 'Volume card ' + (i + 1));
    T(s, bd[i][0], 0.7, y, 1.9, 1.05, { fontSize: 28, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Volume number ' + (i + 1) });
    T(s, bd[i][1], 2.6, y, 1.7, 1.05, { fontSize: 14, valign: 'middle', objectName: 'Volume label ' + (i + 1) });
  }
  const tools = [[ic.cloud, 'Google Colab', 'free cloud computer'], [ic.cogs, 'Apache Spark', 'processes data in parallel'], [ic.poly, 'Apache Sedona', 'spatial joins, areas, buffers'],
    [ic.db, 'PostGIS', 'indexed spatial database'], [ic.tag, 'Spark MLlib', 'machine learning at scale']];
  for (let i = 0; i < 5; i++) {
    const y = 1.3 + i * 0.74;
    await iconCircle(s, tools[i][0], 4.8, y, 0.55, 'Tool icon ' + (i + 1));
    T(s, [{ text: tools[i][1], options: { bold: true, breakLine: true } }, { text: tools[i][2] }], 5.55, y, 3.95, 0.55, { fontSize: 14, valign: 'middle', objectName: 'Tool ' + (i + 1) });
  }
  notes(s, 'Kerala has more than 13 million buildings. Each one is a shape on a map, and I also used raster maps for sunshine, trees and tree height; the tree height map alone has 82 billion pixels. My laptop has 8 GB of memory and cannot even open this. So I used the cloud: Google Colab, with Spark for parallel work, Sedona for map operations, PostGIS for fast map queries, and Spark MLlib for machine learning.');

  // ===== 4 Method flow =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Method in six steps', { placeholder: 'title' });
  const steps = [['Collect', 'Overture buildings, sunshine, tree cover, tree height'], ['Clean and join', 'Sedona puts 19.4 M buildings into districts: 13.0 M roofs'],
    ['Describe', 'size, shape, sun, trees and crowding for every roof'], ['Learn', 'K-means, FP-Growth and a Random Forest on 290 labels'],
    ['Measure', 'free roof area with Sedona buffers, then GW and TWh'], ['Show', 'interactive web dashboard for everyone']];
  for (let i = 0; i < 6; i++) {
    const x = 0.5 + (i % 3) * 3.075, y = 1.3 + Math.floor(i / 3) * 1.95;
    card(s, x, y, 2.85, 1.75, 'Step card ' + (i + 1));
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Step number circle ' + (i + 1) });
    T(s, String(i + 1), x + 0.2, y + 0.2, 0.5, 0.5, { fontSize: 18, bold: true, align: 'center', valign: 'middle', objectName: 'Step number ' + (i + 1) });
    T(s, steps[i][0], x + 0.85, y + 0.2, 1.85, 0.5, { fontSize: 18, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Step title ' + (i + 1) });
    T(s, steps[i][1], x + 0.2, y + 0.85, 2.45, 0.8, { fontSize: 14, objectName: 'Step text ' + (i + 1) });
  }
  notes(s, 'The whole method in six steps. One: collect the data. Two: clean it and put each building in its district using Sedona. Three: describe each roof with numbers. Four: learn from examples, using clustering, association rules and a Random Forest. Five: measure the free space on each good roof. Six: show everything in a dashboard. Each step is a Colab notebook, twelve in total, all on GitHub.');

  // ===== 5 Join, clean, speed =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Join, clean and speed tests', { placeholder: 'title' });
  s.addChart(pres.charts.BAR, [{ name: 'Sedona speed-up', labels: ['10 thousand', '100 thousand', '1 million', '19.4 million*'], values: [4.6, 3.5, 4.5, 5.9] }], {
    x: 0.5, y: 1.25, w: 5.3, h: 3.75, barDir: 'col', chartColors: [HEX.blue], showLegend: false,
    showTitle: true, title: 'How many times faster Sedona is than plain Spark', titleFontSize: 14, titleColor: HEX.ink, showValue: true, dataLabelPosition: 'outEnd',
    dataLabelFontSize: 14, dataLabelColor: HEX.ink, dataLabelFormatCode: '0.0"x"', catAxisLabelFontSize: 12, catAxisLabelColor: HEX.ink, valAxisLabelFontSize: 12,
    valAxisLabelColor: HEX.ink, valAxisMinVal: 0, valAxisMaxVal: 7, valGridLine: { color: 'D9D9D9', size: 0.5 }, catGridLine: { style: 'none' }, ...chartText });
  T(s, '*plain Spark estimated at full size (805 s against 137 s for Sedona). Same join, same matches.', 0.5, 5.0, 5.3, 0.25, { fontSize: 10, color: C.accent5, objectName: 'Chart footnote' });
  const st5 = [['13.0 M', 'roofs kept in Kerala, from 19.4 M buildings'], ['3.5-5.9×', 'Sedona faster than plain Spark'], ['10×', 'Spark SQL faster than MapReduce (10 s vs 98 s)'], ['450×', 'PostGIS GiST index (20 s down to 45 ms)']];
  for (let i = 0; i < 4; i++) {
    const y = 1.25 + i * 0.95;
    card(s, 6.1, y, 3.4, 0.82, 'Result card ' + (i + 1));
    T(s, st5[i][0], 6.25, y, 1.35, 0.82, { fontSize: 22, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Result number ' + (i + 1) });
    T(s, st5[i][1], 7.6, y, 1.8, 0.82, { fontSize: 12, valign: 'middle', objectName: 'Result label ' + (i + 1) });
  }
  notes(s, 'Step two. Sedona put every building into its district. I removed buildings outside Kerala, and tiny ones under 10 square metres, and kept 13 million roofs. I tested the same join with plain Spark and with Sedona: Sedona was 3.5 to 5.9 times faster, because it uses a spatial index, like the index of a book. A MapReduce job for district totals took 97 seconds, while Spark SQL took under 10. In PostGIS, a spatial index made a one-kilometre search around Kochi 450 times faster: 20 seconds down to 45 milliseconds.');

  // ===== 6 Roof features =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('What describes a roof', { placeholder: 'title' });
  const feats = [[ic.ruler, 'Size and shape', 'area in m² and how compact the outline is'], [ic.sun, 'Sunshine', '1,460 to 1,578 kWh per kW a year (Global Solar Atlas)'],
    [ic.tree, 'Trees nearby', 'tree share within 28, 140 and 300 m (WorldCover)'], [ic.height, 'Tree height', 'tallest tree and canopy within 15 m (Meta 1 m map)'],
    [ic.poly, 'Crowding', 'buildings per H3 hexagon of 0.1 km²'], [ic.ok, 'Outline quality', 'source and confidence of the building shape']];
  for (let i = 0; i < 6; i++) {
    const x = 0.5 + (i % 3) * 3.075, y = 1.25 + Math.floor(i / 3) * 1.6;
    card(s, x, y, 2.85, 1.45, 'Feature card ' + (i + 1));
    await iconCircle(s, feats[i][0], x + 0.2, y + 0.18, 0.5, 'Feature icon ' + (i + 1));
    T(s, feats[i][1], x + 0.85, y + 0.18, 1.9, 0.5, { fontSize: 16, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Feature title ' + (i + 1) });
    T(s, feats[i][2], x + 0.2, y + 0.78, 2.5, 0.6, { fontSize: 12, objectName: 'Feature text ' + (i + 1) });
  }
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.5, w: 9, h: 0.55, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Speed lesson banner' });
  T(s, 'Speed lesson: Sedona raster join took 6.4 hours; the same lookups in NumPy took 42 seconds', 0.75, 4.5, 8.5, 0.55, { fontSize: 14, bold: true, valign: 'middle', objectName: 'Speed lesson text' });
  notes(s, 'Step three. For every roof I calculated its size and shape, the sunshine it gets, how many trees are around it, how tall they are, and how crowded the area is. Trees matter because shade is bad for solar panels. One lesson: the raster join in Sedona took 6.4 hours, but writing the same lookups with NumPy array indexing took 42 seconds. Choosing the right tool matters.');

  // ===== 7 Area types and rules =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Area types and rules', { placeholder: 'title' });
  const th = (t) => ({ text: t, options: { bold: true, fill: { color: C.background2 }, color: C.text1, fontSize: 14 } });
  const td = (t, o = {}) => ({ text: t, options: { fontSize: 14, color: C.text1, ...o } });
  T(s, 'K-means on 260,447 hexagons: 3 area types', 0.5, 1.25, 5.3, 0.35, { fontSize: 16, bold: true, fontFace: 'Cambria', objectName: 'K-means heading' });
  s.addTable([
    [th('Area type'), th('Roofs'), th('Median roof'), th('Trees ≤300 m')],
    [td('Towns', { bold: true }), td('3.34 M'), td('87 m²'), td('64%')],
    [td('Homestead villages', { bold: true }), td('9.46 M'), td('68 m²'), td('94%')],
    [td('Sparse open land', { bold: true }), td('0.19 M'), td('55 m²'), td('41%')],
  ], { x: 0.5, y: 1.7, w: 5.3, colW: [1.9, 0.95, 1.2, 1.25], rowH: 0.5, border: { type: 'solid', color: 'D9D9D9', pt: 0.75 }, valign: 'middle', margin: [0, 0.08, 0, 0.08], objectName: 'K-means table' });
  T(s, 'Best fit at k = 3 (silhouette score 0.699)', 0.5, 3.85, 5.3, 0.3, { fontSize: 12, color: C.accent5, objectName: 'Silhouette note' });
  const rules = [['IF town and looks built-up', 'THEN few trees around it', 'confidence 77%, lift 4.2'], ['IF low-confidence outline', 'THEN it is a small roof', 'confidence 73%, lift 2.0']];
  T(s, 'FP-Growth: association rules', 6.1, 1.25, 3.4, 0.35, { fontSize: 16, bold: true, fontFace: 'Cambria', objectName: 'FP-Growth heading' });
  for (let i = 0; i < 2; i++) {
    const y = 1.7 + i * 1.65;
    card(s, 6.1, y, 3.4, 1.5, 'Rule card ' + (i + 1));
    T(s, [{ text: rules[i][0], options: { bold: true, breakLine: true } }, { text: rules[i][1], options: { breakLine: true } }, { text: rules[i][2], options: { color: C.accent5 } }],
      6.3, y + 0.15, 3.0, 1.2, { fontSize: 14, valign: 'middle', paraSpaceAfter: 4, objectName: 'Rule text ' + (i + 1) });
  }
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.35, w: 5.3, h: 0.65, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Village insight banner' });
  T(s, 'Villages hold 73% of all roofs, but trees shade them', 0.7, 4.35, 4.9, 0.65, { fontSize: 14, bold: true, valign: 'middle', objectName: 'Village insight text' });
  notes(s, 'Unsupervised learning. K-means grouped the hexagons into three area types: towns with big roofs and few trees, homestead villages with small roofs under many trees, and sparse open land like paddy fields and backwaters. FP-Growth found rules, for example: if a roof is in a town and looks built-up, then it has few trees around it, 77 percent of the time. Villages hold most of the roofs, but trees shade them. This is why villages matter later.');

  // ===== 8 Labels and Random Forest =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Labels and the Random Forest', { placeholder: 'title' });
  const lab = [['300 random roofs', 'judged on satellite images by me and by an AI'], ['218 agree (74%)', 'both said the same'], ['72 re-checked blind', 'of 75 disagreements'], ['290 gold labels', '156 good, 134 not good']];
  for (let i = 0; i < 4; i++) {
    const y = 1.25 + i * 0.95;
    card(s, 0.5, y, 4.3, 0.82, 'Label step ' + (i + 1), i === 3 ? { fill: { color: C.accent1 } } : {});
    T(s, [{ text: lab[i][0], options: { bold: true, fontSize: 16, breakLine: true } }, { text: lab[i][1], options: { fontSize: 14 } }], 0.7, y, 3.9, 0.82, { valign: 'middle', objectName: 'Label step text ' + (i + 1) });
  }
  s.addChart(pres.charts.BAR, [{ name: 'Accuracy', labels: ['Random Forest', 'Simple rule', 'Always "suitable"'], values: [67, 58, 54] }], {
    x: 5.1, y: 1.25, w: 4.4, h: 3.1, barDir: 'col', chartColors: [HEX.blue, HEX.grey, HEX.grey], invertedColors: [HEX.blue, HEX.grey, HEX.grey], showLegend: false,
    showTitle: true, title: 'Accuracy on districts it never saw (%)', titleFontSize: 14, titleColor: HEX.ink, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 14,
    dataLabelColor: HEX.ink, catAxisLabelFontSize: 12, catAxisLabelColor: HEX.ink, valAxisLabelFontSize: 12, valAxisLabelColor: HEX.ink, valAxisMinVal: 0, valAxisMaxVal: 100,
    valGridLine: { color: 'D9D9D9', size: 0.5 }, catGridLine: { style: 'none' }, ...chartText });
  T(s, 'Tested by training on 13 districts and testing on the 14th. Tree-height data did not add accuracy.', 5.1, 4.4, 4.4, 0.65, { fontSize: 12, color: C.accent5, objectName: 'Accuracy note' });
  notes(s, 'A Random Forest needs examples with the right answer. I took 300 random roofs and judged each on satellite images. An AI model, Gemini, also judged them separately. We agreed on 218 roofs. For the 75 disagreements I looked again, blind, without seeing either answer. That gives 290 gold labels. The Random Forest is correct about 67 percent of the time on districts it has never seen; always guessing suitable gives 54. An honest finding: adding the Meta tree height data did not improve accuracy.');

  // ===== 9 Free space =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Free space on each roof', { placeholder: 'title' });
  s.addShape(pres.ShapeType.rect, { x: 0.6, y: 1.35, w: 4.0, h: 2.5, fill: { color: 'D9D9D9' }, line: { type: 'none' }, objectName: 'Roof outline' });
  s.addShape(pres.ShapeType.rect, { x: 0.95, y: 1.7, w: 3.3, h: 1.8, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Free area after edge strip' });
  s.addShape(pres.ShapeType.rect, { x: 2.95, y: 2.45, w: 1.1, h: 0.85, fill: { color: C.accent5 }, line: { type: 'none' }, objectName: 'Stair room and tank' });
  T(s, 'free area for panels', 1.1, 1.8, 1.7, 0.5, { fontSize: 14, bold: true, objectName: 'Free area label' });
  T(s, 'stair room + tank', 2.95, 2.45, 1.1, 0.85, { fontSize: 12, bold: true, color: C.background1, align: 'center', valign: 'middle', objectName: 'Stair room label' });
  T(s, [{ text: '1. Shrink the outline 0.6 m from every side', options: { breakLine: true } }, { text: '2. Subtract 8 m² for stair room and tank', options: { breakLine: true } },
    { text: '3. 10 m² free = 1 kW of panels' }], 0.6, 4.0, 4.0, 1.05, { fontSize: 14, paraSpaceAfter: 3, objectName: 'Free area steps' });
  s.addChart(pres.charts.BAR, [{ name: 'Free share', labels: ['under 50 m²', '50-120 m²', '120-500 m²', 'over 500 m²'], values: [40, 65, 78, 91] }], {
    x: 5.0, y: 1.25, w: 4.5, h: 3.35, barDir: 'col', chartColors: [HEX.blue], showLegend: false, showTitle: true, title: 'Share of roof free for panels (%)',
    titleFontSize: 14, titleColor: HEX.ink, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 14, dataLabelColor: HEX.ink,
    catAxisLabelFontSize: 12, catAxisLabelColor: HEX.ink, valAxisLabelFontSize: 12, valAxisLabelColor: HEX.ink, valAxisMinVal: 0, valAxisMaxVal: 100,
    valGridLine: { color: 'D9D9D9', size: 0.5 }, catGridLine: { style: 'none' }, ...chartText });
  T(s, 'Average 74% free; small roofs lose most', 5.0, 4.7, 4.5, 0.35, { fontSize: 14, bold: true, objectName: 'Free share note' });
  notes(s, 'Not all of a roof can hold panels. You leave the edges for safety, and the stair room and water tank take space. Instead of guessing 60 percent for every roof, I calculated it for each roof from its own outline, using Sedona. I shrank the outline by 0.6 metres from every side with ST_Buffer, then subtracted 8 square metres. Small roofs keep only 40 percent, big roofs about 90. On average 74 percent of a good roof is free. Then 10 square metres of free roof equals 1 kilowatt of panels.');

  // ===== 10 The answer =====
  pres.addSection({ title: 'Results' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Results' });
  s.addText('The answer for Kerala', { placeholder: 'title' });
  const big4 = [['6.7 M', 'suitable roofs (52%)'], ['18.5 GW', 'realistic capacity'], ['28.2 TWh', 'electricity a year'], ['88%', 'of Kerala\'s yearly need']];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * 2.28;
    card(s, x, 1.25, 2.1, 1.55, 'Answer card ' + (i + 1), i === 1 ? { fill: { color: C.accent1 } } : {});
    stat(s, big4[i][0], big4[i][1], x + 0.15, 1.35, 1.85, 'Answer ' + (i + 1), { size: 28, lh: 0.5 });
  }
  s.addTable([
    [th('Level'), th('Capacity'), th('Electricity / year'), th('CO₂ avoided / year')],
    [td('Technical maximum (all free area)'), td('64.3 GW (51-78)'), td('98.1 TWh'), td('71 Mt')],
    [td('Realistic (≤ 3 kW per suitable roof)', { bold: true }), td('18.5 GW', { bold: true }), td('28.2 TWh', { bold: true }), td('20.5 Mt', { bold: true })],
    [td('Installed today, October 2024'), td('0.95 GW'), td('-'), td('-')],
  ], { x: 0.5, y: 3.05, w: 9, colW: [3.9, 1.7, 1.7, 1.7], rowH: 0.45, border: { type: 'solid', color: 'D9D9D9', pt: 0.75 }, valign: 'middle', margin: [0, 0.1, 0, 0.1], objectName: 'Potential table' });
  T(s, 'Realistic = every suitable roof installs at most 3 kW (the PM Surya Ghar size). Kerala needs about 32 TWh a year.', 0.5, 4.95, 9, 0.3, { fontSize: 12, color: C.accent5, objectName: 'Table note' });
  notes(s, 'This is the answer. Of 13 million roofs, 6.7 million, about half, are suitable. If every suitable roof installs a 3 kilowatt system, Kerala gets 18.5 gigawatts and 28 terawatt hours a year. That is 88 percent of the electricity Kerala needs, and it saves about 20 million tonnes of CO2 every year. It is also twenty times today\'s installed rooftop solar. The technical maximum, if every free area is covered, is 64 gigawatts. So roof area is not Kerala\'s limit.');

  // ===== 11 Where =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Results' });
  s.addText('Where the potential is', { placeholder: 'title' });
  const dist = D.district.slice().sort((a, b) => a.twh_real - b.twh_real);
  s.addChart(pres.charts.BAR, [{ name: 'TWh per year (realistic)', labels: dist.map((d) => d.district), values: dist.map((d) => d.twh_real) }], {
    x: 0.5, y: 1.2, w: 5.6, h: 3.5, barDir: 'bar', chartColors: [HEX.blue], showLegend: false, showTitle: true, title: 'Electricity per year, TWh (realistic)',
    titleFontSize: 14, titleColor: HEX.ink, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 10, dataLabelColor: HEX.ink, dataLabelFormatCode: '0.0',
    catAxisLabelFontSize: 10, catAxisLabelColor: HEX.ink, catAxisOrientation: 'minMax', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, ...chartText });
  const mp = imgSize('fig_map.png'), mh = 3.5, mw = mh * mp.w / mp.h;
  s.addImage({ path: FIG + 'fig_map.png', x: 6.35, y: 1.2, w: mw, h: mh, altText: 'Map of realistic rooftop solar capacity per hexagon over Kerala', objectName: 'Capacity map' });
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.75, w: 9, h: 0.45, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Town village banner' });
  T(s, 'Hotspots: Kochi, Thiruvananthapuram, Thrissur, Kozhikode   |   Towns 78% of roofs suitable, villages 42%', 0.7, 4.75, 8.6, 0.45, { fontSize: 14, bold: true, valign: 'middle', objectName: 'Town village text' });
  notes(s, 'Ernakulam leads with 3.7 terawatt hours a year, then Thrissur with 3.0 and Malappuram with 2.9. Wayanad is lowest. The map shows the hotspots around Kochi, Thiruvananthapuram, Thrissur, Kozhikode and Kannur. In towns 78 percent of roofs are suitable; in villages only 42 percent, because of tree shade and small roofs. But villages still hold most roofs, so they contribute a lot.');

  // ===== 12 Dashboard demo =====
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Results' });
  s.addText('Live demo: the dashboard', { placeholder: 'title' });
  s.addImage({ path: FIG + 'dashboard_main.png', x: 0.5, y: 1.3, w: 5.2, h: 5.2 * dm.h / dm.w, altText: 'Dashboard with 3D map, headline numbers and district ranking', objectName: 'Dashboard screenshot' });
  const demo = ['Open the web link', 'Press Story mode: 6 steps', 'Click Ernakulam: 3D towers', 'Compare two districts', 'Savings calculator: 3 kW pays back in 5.6 years'];
  for (let i = 0; i < demo.length; i++) {
    const y = 1.3 + i * 0.66;
    s.addShape(pres.ShapeType.ellipse, { x: 6.0, y, w: 0.45, h: 0.45, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Demo number circle ' + (i + 1) });
    T(s, String(i + 1), 6.0, y, 0.45, 0.45, { fontSize: 14, bold: true, align: 'center', valign: 'middle', objectName: 'Demo number ' + (i + 1) });
    T(s, demo[i], 6.6, y - 0.05, 2.9, 0.55, { fontSize: 14, valign: 'middle', objectName: 'Demo step ' + (i + 1) });
  }
  T(s, [{ text: 'muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/', options: { hyperlink: { url: 'https://muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/', tooltip: 'Open the dashboard' }, color: HEX.blue } }],
    0.5, 4.7, 9, 0.35, { fontSize: 14, objectName: 'Dashboard link' });
  notes(s, 'Now the live demo; it needs internet. Open the link. Press Story mode: it flies across Kerala in six steps. Click Ernakulam to see 3D towers; the height shows solar capacity. Use Compare to put two districts side by side. In the savings calculator, a 3 kilowatt system in Ernakulam pays back in about 5.6 years. If internet fails, this screenshot shows what the dashboard looks like.');

  // ===== 13 Limits and next =====
  pres.addSection({ title: 'Wrap-up' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Wrap-up' });
  s.addText('Limits and next steps', { placeholder: 'title' });
  const colsL = [[ic.warn, 'Limits', ['Only 290 labels; accuracy 67%', 'The blind re-check was done by me', 'Roof slope, partial shade and strength not modelled', 'Photos and data are from different years', 'Spark ran on one machine (Colab)']],
    [ic.next, 'Next steps', ['An independent second labeller and more labels', 'Roof slope and shade from 3D data', 'Check free area against real roofs', 'Run the pipeline on a cluster', 'Add grid and income data to estimate adoption']]];
  for (let i = 0; i < 2; i++) {
    const x = 0.5 + i * 4.6;
    card(s, x, 1.25, 4.4, 3.75, 'Column card ' + (i + 1));
    await iconCircle(s, colsL[i][0], x + 0.25, 1.45, 0.55, 'Column icon ' + (i + 1));
    T(s, colsL[i][1], x + 0.95, 1.45, 3.2, 0.55, { fontSize: 20, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Column heading ' + (i + 1) });
    T(s, colsL[i][2].map((t, k, a) => ({ text: t, options: { bullet: true, breakLine: k < a.length - 1 } })), x + 0.3, 2.2, 3.85, 2.65,
      { fontSize: 14, paraSpaceAfter: 6, objectName: 'Column bullets ' + (i + 1) });
  }
  notes(s, 'To be honest about the weak points: only 290 labelled roofs, and the AI and I agreed only 74 percent of the time. The blind check was done by me, so it may lean my way. Roof slope, partial shade and strength are not modelled, and the photos come from different years. Spark ran on one machine. Next steps: an independent labeller and more labels, slope and shade from 3D data, field checks, a cluster run, and adding grid and income data.');

  // ===== 14 Conclusion =====
  s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Wrap-up' });
  s.addText('Conclusion', { placeholder: 'title' });
  const glass = { color: C.background1, transparency: 90 };
  card(s, 0.5, 1.25, 4.3, 2.6, 'Conclusion card', { fill: glass });
  T(s, [{ text: 'About half of Kerala\'s 13 million roofs suit solar', options: { bullet: true, breakLine: true } },
    { text: 'Realistic: 18.5 GW, 28.2 TWh a year, 88% of the need', options: { bullet: true, breakLine: true } },
    { text: 'Saves about 20 million tonnes of CO₂ a year', options: { bullet: true, breakLine: true } },
    { text: 'Towns, Ernakulam, Thrissur and Malappuram lead', options: { bullet: true } }], 0.7, 1.4, 3.9, 2.35, { fontSize: 14, color: C.background1, paraSpaceAfter: 6, objectName: 'Conclusion bullets' });
  const co = [['CO1', 'Spark vs Sedona, MapReduce'], ['CO2', 'Cleaning, GeoParquet, PostGIS index'], ['CO3', 'K-means, FP-Growth, Random Forest'], ['CO4', 'CO₂, subsidy, payback']];
  for (let i = 0; i < 4; i++) {
    const y = 1.25 + i * 0.67;
    card(s, 5.1, y, 4.4, 0.57, 'Outcome card ' + (i + 1), { fill: glass });
    T(s, co[i][0], 5.25, y, 0.7, 0.57, { fontSize: 16, bold: true, color: C.accent1, valign: 'middle', objectName: 'Outcome code ' + (i + 1) });
    T(s, co[i][1], 5.95, y, 3.45, 0.57, { fontSize: 14, color: C.background1, valign: 'middle', objectName: 'Outcome text ' + (i + 1) });
  }
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.1, w: 9, h: 0.95, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Thanks banner' });
  T(s, [{ text: 'Thank you. Questions?', options: { bold: true, fontSize: 22, breakLine: true } },
    { text: 'github.com/muhammedshahidsds25-collab/kerala-rooftop-solar', options: { fontSize: 14, hyperlink: { url: 'https://github.com/muhammedshahidsds25-collab/kerala-rooftop-solar', tooltip: 'Open the code' }, color: C.text1 } }],
    0.8, 4.1, 8.4, 0.95, { color: C.text1, valign: 'middle', objectName: 'Thanks text' });
  notes(s, 'To conclude: about half of Kerala\'s roofs are suitable. Realistically they could host 18.5 gigawatts and make 28 terawatt hours a year, 88 percent of the state\'s need, saving about 20 million tonnes of CO2. The project covers all four course outcomes: Spark and Sedona with MapReduce, cleaning and PostGIS storage, three machine learning methods, and an environment and economics case study. Thank you. I am happy to take questions.');

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
