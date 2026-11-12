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

const THEME = {
  name: 'Kerala Rooftop Solar', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: { dk1: '1A1A19', lt1: 'FFFFFF', dk2: '1F1F1D', lt2: 'F1F2F4',
    accent1: 'F6B73C', accent2: '2A78D6', accent3: 'EB6834', accent4: '1C7C54', accent5: '898781', accent6: '9EC5F4',
    hlink: '2A78D6', folHlink: '6250D6' },
};
const HEX = { amber: 'F6B73C', blue: '2A78D6', grey: '898781', ink: '1A1A19', light: 'F1F2F4', line: 'D9D9D9' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Rooftop Solar Potential of Kerala';
pres.author = 'Muhammed Shahid S';
pres.subject = 'Spatial Bigdata Analytics (M5221357)';
const C = pres.SchemeColor;
const FOOT = 'Rooftop Solar Potential of Kerala  |  Muhammed Shahid S';

const titlePh = (color) => ({ placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 7.4, h: 0.8, fontSize: 32, bold: true,
  color, align: 'left', valign: 'middle', margin: 0 }, text: '' } });
const foot = { text: { text: FOOT, options: { x: 0.5, y: 5.28, w: 6, h: 0.25, fontSize: 10, color: C.accent5, margin: 0, isTextBox: true } } };
const num = { x: 9.0, y: 5.28, w: 0.5, h: 0.25, fontSize: 10, color: C.accent5, align: 'right' };
pres.defineSlideMaster({ title: 'CONTENT', background: { color: C.background1 }, objects: [titlePh(C.text1), foot], slideNumber: num });
pres.defineSlideMaster({ title: 'DARK', background: { color: C.text2 }, objects: [titlePh(C.background1), foot], slideNumber: num });
pres.defineSlideMaster({ title: 'COVER', background: { color: C.text2 }, objects: [] });

// ---------- helpers ----------
const iconPng = async (Icon, hex) => {
  const svg = renderToStaticMarkup(React.createElement(Icon, { color: '#' + hex, size: '256' }));
  return 'image/png;base64,' + (await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64');
};
const size = (f) => { const b = fs.readFileSync(FIG + f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const T = (s, text, x, y, w, h, o = {}) => s.addText(text, { x, y, w, h, margin: 0, isTextBox: true, valign: 'top', ...o });
const card = (s, x, y, w, h, name, fill) => s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08,
  fill: fill || { color: C.background2 }, line: { type: 'none' }, objectName: name });
const iconCircle = async (s, Icon, x, y, d, name, o = {}) => {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: o.bg || C.accent1 }, line: { type: 'none' }, objectName: name + ' circle' });
  const p = d * 0.25;
  s.addImage({ data: await iconPng(Icon, o.fg || HEX.ink), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: name, objectName: name });
};
// a picture with a thin grey frame; fits inside (x, y, maxW, maxH), returns the box actually used
const framed = (s, file, x, y, maxW, maxH, alt, name) => {
  const { w: pw, h: ph } = size(file);
  let w = maxW, h = maxW * ph / pw;
  if (h > maxH) { h = maxH; w = maxH * pw / ph; }
  s.addShape(pres.ShapeType.rect, { x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06, fill: { color: 'D9D9D9' }, line: { type: 'none' }, objectName: name + ' frame' });
  s.addImage({ path: FIG + file, x, y, w, h, altText: alt, objectName: name });
  return { x, y, w, h };
};
const badge = (s, n) => {
  s.addShape(pres.ShapeType.roundRect, { x: 8.15, y: 0.47, w: 1.35, h: 0.46, rectRadius: 0.23, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Step badge' });
  T(s, `STEP ${n} / 6`, 8.15, 0.47, 1.35, 0.46, { fontSize: 14, bold: true, align: 'center', valign: 'middle', color: C.text1, objectName: 'Step badge text' });
};
const caption = (s, t, x, y, w) => T(s, t, x, y, w, 0.28, { fontSize: 10, italic: true, color: C.accent5, objectName: 'Screenshot caption' });
const bigNum = (s, n, label, x, y, w, o = {}) => {
  T(s, n, x, y, w, 0.75, { fontSize: o.size || 36, bold: true, fontFace: 'Cambria', color: o.color || C.text1, valign: 'middle', objectName: 'Big number' });
  T(s, label, x, y + 0.75, w, o.lh || 0.5, { fontSize: 14, color: o.lcolor || C.text1, objectName: 'Big number label' });
};
const facts = (s, items, x, y, w, h, o = {}) => T(s, items.map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })),
  x, y, w, h, { fontSize: o.size || 14, paraSpaceAfter: 6, color: o.color || C.text1, objectName: 'Key facts' });
const callout = (s, text, tx, ty, tw, th, ax, ay, name) => {   // amber label + arrow to (ax, ay)
  s.addShape(pres.ShapeType.roundRect, { x: tx, y: ty, w: tw, h: th, rectRadius: 0.06, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: name + ' label box' });
  T(s, text, tx + 0.08, ty, tw - 0.16, th, { fontSize: 12, bold: true, valign: 'middle', color: C.text1, objectName: name + ' label' });
  const sx = ax < tx ? tx : tx + tw, sy = ty + th / 2;
  s.addShape(pres.ShapeType.line, { x: Math.min(sx, ax), y: Math.min(sy, ay), w: Math.abs(ax - sx) || 0.01, h: Math.abs(ay - sy) || 0.01,
    flipH: ax < sx, flipV: ay < sy, line: { color: HEX.amber, width: 2.5, endArrowType: 'triangle' }, objectName: name + ' arrow' });
};
const chartText = { catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', legendFontFace: '+mn-lt', titleFontFace: '+mn-lt' };
const chartBase = { titleFontSize: 14, titleColor: HEX.ink, showTitle: true, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 12, dataLabelColor: HEX.ink,
  catAxisLabelFontSize: 12, catAxisLabelColor: HEX.ink, valAxisLabelFontSize: 12, valAxisLabelColor: HEX.ink, valGridLine: { color: HEX.line, size: 0.5 },
  catGridLine: { style: 'none' }, showLegend: false, ...chartText };
const th = (t) => ({ text: t, options: { bold: true, fill: { color: C.background2 }, color: C.text1, fontSize: 14 } });
const td = (t, o = {}) => ({ text: t, options: { fontSize: 14, color: C.text1, ...o } });

(async () => {
  const ic = fa;
  let s;

  // ===================== PROBLEM =====================
  pres.addSection({ title: 'Problem' });
  // 1 Cover
  s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'Problem' });
  T(s, 'Rooftop Solar Potential of Kerala', 0.5, 0.6, 5.2, 1.6, { fontSize: 40, bold: true, fontFace: 'Cambria', color: C.background1, objectName: 'Title' });
  T(s, 'Mapping 13 million roofs with spatial big data: Apache Sedona and Spark MLlib', 0.5, 2.3, 5.0, 0.8, { fontSize: 18, color: C.accent1, objectName: 'Subtitle' });
  T(s, [{ text: 'Muhammed Shahid S  |  Roll No. 253308', options: { bold: true, breakLine: true } },
    { text: 'M.Sc. Data Science and Geoinformatics, Digital University Kerala', options: { breakLine: true } },
    { text: 'Supervisor: Manoj Kumar T K', options: { breakLine: true } },
    { text: 'Spatial Bigdata Analytics (M5221357)  |  12 November 2026' }], 0.5, 3.55, 5.3, 1.4, { fontSize: 14, color: C.background1, paraSpaceAfter: 4, objectName: 'Author details' });
  const hx = size('cover_kerala_hex.png'), hh = 5.3, hw = hh * hx.w / hx.h;
  s.addImage({ path: FIG + 'cover_kerala_hex.png', x: 9.5 - hw, y: 0.16, w: hw, h: hh, altText: 'Kerala drawn from 7,070 glowing hexagons of rooftop solar capacity', objectName: 'Kerala hexagon art' });
  T(s, 'Each glowing cell = solar potential of ~5 km² of roofs', 5.9, 5.1, 1.75, 0.4, { fontSize: 10, italic: true, color: C.accent5, objectName: 'Art caption' });
  s.addNotes('TIMING GUIDE (about 12 minutes): Problem 2 min (slides 1-4), Method 6 min (slides 5-14), Results 3 min (15-18), Wrap-up 1 min (19-20). If short of time, skip slide 8 (Describe every roof), because slides 9 and 10 explain the features in more detail.\n\nGood morning. My project asks a simple question: how much electricity could Kerala make from its own rooftops? To answer it I mapped every building in Kerala, about 13 million, using spatial big data tools. The picture on the right is Kerala drawn only from my results; every glowing cell is a piece of land with solar potential.');

  // 2 Hook
  s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'Problem' });
  const nl = size('roofs_nightlights.png'), nh = 5.625, nw = nh * nl.w / nl.h;
  s.addImage({ path: FIG + 'roofs_nightlights.png', x: 10 - nw, y: 0, w: nw, h: nh, transparency: 35, altText: 'Kerala drawn from 40,000 sampled roof locations', objectName: 'Roofs map background' });
  T(s, [{ text: 'Every roof in Kerala gets strong sun.', options: { color: C.background1, breakLine: true } }, { text: 'How many could power our homes?', options: { color: C.accent1 } }],
    0.5, 0.6, 6.4, 1.8, { fontSize: 28, bold: true, fontFace: 'Cambria', valign: 'middle', paraSpaceAfter: 6, objectName: 'Hook question' });
  const hook = [['~70%', 'of Kerala\'s electricity is bought from outside'], ['0.95 GW', 'of rooftop solar installed today'], ['₹78,000', 'government subsidy per home (PM Surya Ghar)']];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 2.1;
    card(s, x, 2.75, 1.95, 1.9, 'Hook fact ' + (i + 1), { color: C.background1, transparency: 88 });
    bigNum(s, hook[i][0], hook[i][1], x + 0.15, 2.85, 1.7, { size: 28, color: C.accent1, lcolor: C.background1, lh: 0.85 });
  }
  T(s, 'Each dot is a real roof (40,000 shown of 13 million)', 0.5, 4.95, 6, 0.3, { fontSize: 10, italic: true, color: C.accent5, objectName: 'Map caption' });
  s.addNotes('Let me start with a question for you: every roof in Kerala gets strong sun, so how many of them could power our homes? Kerala buys about 70 percent of its electricity from outside. Only 0.95 gigawatt of rooftop solar is installed today, even though the government gives up to 78 thousand rupees per home. Each dot on the right is a real roof from my data.');

  // 3 What this project does
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Problem' });
  s.addText('What this project does', { placeholder: 'title' });
  const what = [[ic.FaMapMarkedAlt, 'Map every roof', 'all 13 million buildings in Kerala, from satellite-derived building outlines'],
    [ic.FaSearch, 'Find good roofs', 'machine learning decides which roofs are big and sunny enough'],
    [ic.FaBolt, 'Measure power', 'free space on each good roof → kW → electricity per year']];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 3.1;
    card(s, x, 1.3, 2.8, 2.75, 'Goal card ' + (i + 1));
    await iconCircle(s, what[i][0], x + 0.25, 1.5, 0.75, 'Goal icon ' + (i + 1));
    T(s, what[i][1], x + 0.25, 2.4, 2.35, 0.45, { fontSize: 18, bold: true, fontFace: 'Cambria', objectName: 'Goal title ' + (i + 1) });
    T(s, what[i][2], x + 0.25, 2.95, 2.35, 1.05, { fontSize: 13, objectName: 'Goal text ' + (i + 1) });
    if (i < 2) s.addShape(pres.ShapeType.rightArrow, { x: x + 2.84, y: 2.5, w: 0.22, h: 0.35, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Goal arrow ' + (i + 1) });
  }
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.3, w: 9, h: 0.75, rectRadius: 0.1, fill: { color: C.text2 }, line: { type: 'none' }, objectName: 'Scale banner' });
  T(s, [{ text: '13 million roofs', options: { color: C.accent1, bold: true } }, { text: '   ·   14 districts   ·   ', options: { color: C.background1 } },
    { text: '82 billion map pixels', options: { color: C.accent1, bold: true } }, { text: '   ·   12 notebooks in the cloud', options: { color: C.background1 } }],
    0.7, 4.3, 8.6, 0.75, { fontSize: 15, valign: 'middle', align: 'center', objectName: 'Scale text' });
  s.addNotes('In one line, my project does three things. First, it maps every roof in Kerala. Second, it uses machine learning to find the roofs that are good for solar: big enough and not shaded by trees. Third, it measures how much free space each good roof has, and turns that into electricity. The scale is large: 13 million roofs, 14 districts and 82 billion map pixels, processed in 12 cloud notebooks.');

  // 4 Challenge
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Problem' });
  s.addText('Why it needs big data tools', { placeholder: 'title' });
  const r4 = framed(s, 'roofs_nightlights.png', 0.5, 1.25, 3.0, 3.75, 'Kerala drawn from sampled roofs', 'Roofs map');
  caption(s, '40,000 of 13 million roofs, plotted', 0.5, r4.y + r4.h + 0.06, r4.w + 0.2);
  const sc = [['19.4 M', 'building outlines downloaded'], ['82 billion', 'pixels in the 1 m tree-height map'], ['14 GB', 'of project data in the cloud'], ['12', 'notebooks run in Google Colab']];
  for (let i = 0; i < 4; i++) {
    const y = 1.25 + i * 0.95;
    card(s, 3.9, y, 2.75, 0.82, 'Scale card ' + (i + 1));
    T(s, sc[i][0], 4.05, y, 1.45, 0.82, { fontSize: 19, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Scale number ' + (i + 1) });
    T(s, sc[i][1], 5.5, y, 1.1, 0.82, { fontSize: 11, valign: 'middle', objectName: 'Scale label ' + (i + 1) });
  }
  const tools = [[ic.FaCloud, 'Google Colab', 'cloud computer'], [ic.FaCogs, 'Apache Spark', 'parallel processing'], [ic.FaDrawPolygon, 'Apache Sedona', 'spatial operations'],
    [ic.FaDatabase, 'PostGIS', 'spatial database'], [ic.FaBrain, 'Spark MLlib', 'machine learning']];
  for (let i = 0; i < 5; i++) {
    const y = 1.25 + i * 0.76;
    await iconCircle(s, tools[i][0], 6.95, y, 0.55, 'Tool icon ' + (i + 1));
    T(s, [{ text: tools[i][1], options: { bold: true, breakLine: true } }, { text: tools[i][2] }], 7.6, y, 1.9, 0.55, { fontSize: 13, valign: 'middle', objectName: 'Tool ' + (i + 1) });
  }
  s.addNotes('Why big data? I downloaded 19.4 million building outlines. The tree-height map alone has 82 billion pixels. The project data is about 14 gigabytes, which is too large for a normal desktop workflow. So everything ran in the cloud on Google Colab, with Apache Spark for parallel processing, Apache Sedona for spatial operations, PostGIS as a spatial database and Spark MLlib for machine learning.');

  // ===================== METHOD =====================
  pres.addSection({ title: 'Method' });
  // 5 Pipeline
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('The method in six steps', { placeholder: 'title' });
  const pipe = [[ic.FaDownload, 'Collect', 'buildings, sun, trees'], [ic.FaBroom, 'Clean & join', 'Sedona → 13.0 M roofs'], [ic.FaTags, 'Label', '290 example roofs'],
    [ic.FaRulerCombined, 'Describe & learn', 'features + Random Forest'], [ic.FaSolarPanel, 'Measure', 'free roof area'], [ic.FaChartBar, 'Show', 'results + dashboard']];
  for (let i = 0; i < 6; i++) {
    const x = 0.5 + i * 1.53;
    card(s, x, 1.45, 1.38, 2.6, 'Pipeline step ' + (i + 1));
    T(s, String(i + 1), x, 1.55, 1.38, 0.4, { fontSize: 16, bold: true, color: C.accent5, align: 'center', objectName: 'Pipeline number ' + (i + 1) });
    await iconCircle(s, pipe[i][0], x + 0.37, 2.0, 0.64, 'Pipeline icon ' + (i + 1));
    T(s, pipe[i][1], x + 0.06, 2.8, 1.26, 0.45, { fontSize: 15, bold: true, fontFace: 'Cambria', align: 'center', objectName: 'Pipeline title ' + (i + 1) });
    T(s, pipe[i][2], x + 0.08, 3.25, 1.22, 0.7, { fontSize: 12, align: 'center', objectName: 'Pipeline text ' + (i + 1) });
    if (i < 5) s.addShape(pres.ShapeType.rightArrow, { x: x + 1.395, y: 2.2, w: 0.12, h: 0.22, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Pipeline arrow ' + (i + 1) });
  }
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.35, w: 9, h: 0.7, rectRadius: 0.1, fill: { color: C.background2 }, line: { type: 'none' }, objectName: 'Funnel banner' });
  T(s, [{ text: '19.4 M buildings', options: { bold: true } }, { text: '  →  ' }, { text: '13.0 M roofs', options: { bold: true } }, { text: '  →  ' },
    { text: '6.7 M good roofs', options: { bold: true } }, { text: '  →  ' }, { text: '18.5 GW of solar', options: { bold: true, color: C.accent2 } }],
    0.7, 4.35, 8.6, 0.7, { fontSize: 18, align: 'center', valign: 'middle', objectName: 'Funnel text' });
  s.addNotes('Here is the whole method in six steps; each next slide shows one step with the real screen. One, collect the data. Two, clean it and join every building to its district. Three, label example roofs so the computer knows what a good roof is. Four, describe every roof with numbers and train a machine learning model on the labelled roofs. Five, measure the free area on each good roof. Six, summarise and show the results. The bottom line is the funnel: from 19.4 million buildings to 13 million roofs, to 6.7 million good roofs, to 18.5 gigawatts of solar.');

  // 6 Step 1 Collect
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Collect the data', { placeholder: 'title' });
  badge(s, 1);
  const data = [[ic.FaBuilding, 'Building outlines', 'Overture Maps (Google, OSM, Microsoft)', '19.4 M polygons · 1.7 GB'],
    [ic.FaSun, 'Sunshine', 'Global Solar Atlas, World Bank', '1,460-1,578 kWh per kW per year'],
    [ic.FaTree, 'Tree cover', 'ESA WorldCover 2021, 10 m', '5 satellite tiles'],
    [ic.FaArrowsAltV, 'Tree height', 'Meta & WRI canopy map, 1 m', '82 billion pixels · ~11 GB']];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + (i % 2) * 4.6, y = 1.3 + Math.floor(i / 2) * 1.9;
    card(s, x, y, 4.4, 1.7, 'Data card ' + (i + 1));
    await iconCircle(s, data[i][0], x + 0.25, y + 0.25, 0.7, 'Data icon ' + (i + 1));
    T(s, data[i][1], x + 1.15, y + 0.2, 3.1, 0.45, { fontSize: 20, bold: true, fontFace: 'Cambria', objectName: 'Data title ' + (i + 1) });
    T(s, [{ text: data[i][2], options: { breakLine: true } }, { text: data[i][3], options: { bold: true, color: C.accent2 } }], x + 1.15, y + 0.7, 3.1, 0.85,
      { fontSize: 14, paraSpaceAfter: 4, objectName: 'Data text ' + (i + 1) });
  }
  s.addNotes('Step one: collect. Four free, open datasets. Building outlines from Overture Maps: 19.4 million polygons, mostly made by Google from satellite images. Sunshine from the World Bank\'s Global Solar Atlas. Tree cover from the European Space Agency at 10 metres. And tree height from Meta\'s 1-metre canopy map, which has 82 billion pixels over Kerala.');

  // 7 Step 2 Clean & join
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Clean and join with Sedona', { placeholder: 'title' });
  badge(s, 2);
  const r7 = framed(s, 'crop_colab.png', 0.5, 1.3, 5.6, 3.3, 'Google Colab notebook processing roofs with Spark', 'Colab screenshot');
  caption(s, 'Real screen: a Google Colab notebook writing results for 13 million roofs', 0.5, r7.y + r7.h + 0.08, 5.6);
  bigNum(s, '13.0 M', 'roofs kept inside Kerala', 6.4, 1.2, 3.1, { size: 40 });
  facts(s, ['Sedona put each of 19.4 M buildings into its district', 'Removed 6.35 M outside Kerala and 15,538 tiny ones', 'Saved as files split by district (GeoParquet)'], 6.4, 2.55, 3.1, 2.4);
  s.addNotes('Step two: clean and join. This is a real screen from one of my Google Colab notebooks. Apache Sedona checked, for each of the 19.4 million buildings, which district it lies in. That is a spatial join. I removed 6.35 million buildings outside Kerala and about 15 thousand tiny ones under 10 square metres. 13 million roofs remain, saved as files split by district.');

  // 11 Step 4 Labelling
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Teach the computer: labelling', { placeholder: 'title' });
  badge(s, 3);
  const r11 = framed(s, 'crop_qgis_label.png', 0.5, 1.3, 5.6, 3.3, 'QGIS labelling tool with a roof outlined in cyan and Good, Bad and Not a building buttons', 'QGIS labelling screenshot');
  caption(s, 'Real screen: my QGIS labelling tool (Python script)', 0.5, r11.y + r11.h + 0.08, 5.6);
  callout(s, 'click: Good / Bad', r11.x + 0.6, r11.y + 0.5, 1.75, 0.4, r11.x + r11.w * 0.71, r11.y + 0.06, 'Buttons callout');
  callout(s, 'roof to judge', r11.x + 0.45, r11.y + r11.h - 0.65, 1.5, 0.4, r11.x + r11.w * 0.49, r11.y + r11.h * 0.37, 'Roof callout');
  const lab = [['300', 'random roofs, judged by me and by an AI'], ['218', 'we agreed on (74%)'], ['72', 'disagreements re-checked blind'], ['290', 'final "gold" labels']];
  for (let i = 0; i < 4; i++) {
    const y = 1.3 + i * 0.86;
    card(s, 6.4, y, 3.1, 0.74, 'Label card ' + (i + 1), i === 3 ? { color: C.accent1 } : undefined);
    T(s, lab[i][0], 6.5, y, 0.85, 0.74, { fontSize: 24, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Label number ' + (i + 1) });
    T(s, lab[i][1], 7.35, y, 2.1, 0.74, { fontSize: 12, valign: 'middle', objectName: 'Label text ' + (i + 1) });
  }
  s.addNotes('Step three: a computer cannot learn "good roof" without examples. So I built this tool in QGIS. It zooms to a random roof, outlined in cyan, and I click Good, Bad or Not a building. I judged 300 random roofs, 21 per district. An AI vision model, Google Gemini, judged the same roofs separately. We agreed on 218. For the disagreements I looked again blind, without seeing either old answer. That gives 290 reliable gold labels. These labels are the answers; next, I describe every roof with numbers, which the model uses as clues.');

  // 9 Step 3 Describe
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Describe every roof', { placeholder: 'title' });
  badge(s, 4);
  const r9 = framed(s, 'crop_trees.png', 0.5, 1.3, 5.6, 3.3, 'Satellite view of Kerala houses among coconut and homestead trees', 'Trees screenshot');
  caption(s, 'Real view: Kerala houses among homestead trees (Esri satellite image)', 0.5, r9.y + r9.h + 0.08, 5.6);
  callout(s, 'trees shade small roofs', r9.x + 0.2, r9.y + 0.2, 2.1, 0.4, r9.x + r9.w * 0.49, r9.y + r9.h * 0.55, 'Shade callout');
  callout(s, 'big open roof = good', r9.x + r9.w - 2.1, r9.y + r9.h - 0.6, 1.95, 0.4, r9.x + r9.w * 0.72, r9.y + r9.h * 0.33, 'Open roof callout');
  T(s, '6 kinds of roof information', 6.4, 1.3, 3.1, 0.45, { fontSize: 18, bold: true, fontFace: 'Cambria', objectName: 'Features heading' });
  facts(s, ['Size and shape of the roof', 'Sunshine (kWh per kW)', 'Tree cover within 28-300 m', 'Tree height within 15 m', 'Crowding (buildings nearby)', 'Outline quality'], 6.4, 1.85, 3.1, 2.8);
  s.addNotes('Step four: now that we have the answers, I describe every roof with numbers, which are the clues. Look at this real satellite view: many Kerala houses sit under coconut and jack trees, and that shade is bad for solar. So for each of the 13 million roofs I calculated six things: its size and shape, the sunshine, tree cover around it, tree height, how crowded the area is, and how reliable the outline is. One lesson: the first raster method took 6.4 hours; rewritten with NumPy it took 42 seconds.');

  {
  // 9b How the 15 features are made and used (diagram)
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('How the 15 features are made', { placeholder: 'title' });
  badge(s, 4);
  const arrowLine = (x1, y1, x2, y2, name, color) => s.addShape(pres.ShapeType.line, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.01), h: Math.max(Math.abs(y2 - y1), 0.01),
    flipH: x2 < x1, flipV: y2 < y1, line: { color: color || HEX.grey, width: 1.5, endArrowType: 'triangle' }, objectName: name });
  const box = (x, y, w, h, fill, name) => s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06,
    fill: { color: fill }, line: { type: 'none' }, objectName: name });
  // column headings
  T(s, 'Data source', 0.5, 1.12, 2.0, 0.28, { fontSize: 12, bold: true, color: C.accent5, objectName: 'Heading sources' });
  T(s, 'Features for every roof (number of columns)', 2.85, 1.12, 3.8, 0.28, { fontSize: 12, bold: true, color: C.accent5, objectName: 'Heading features' });
  T(s, 'Model', 7.0, 1.12, 2.5, 0.28, { fontSize: 12, bold: true, color: C.accent5, objectName: 'Heading model' });
  // feature groups (y, height)
  const G = [
    ['Size and shape', 'roof area · compactness (4πA/P²)', 2],
    ['Outline quality', 'confidence · low-confidence flag · data source', 3],
    ['Tree cover', 'trees within 28, 140, 300 m · seen as built-up', 4],
    ['Tree height', 'tallest tree ≤5 m, ≤15 m · tall trees ≤15 m, ≤30 m', 4],
    ['Crowding', 'buildings per hexagon · area type (K-means)', 2],
  ];
  const gy0 = 1.45, gh = 0.6, gap = 0.08, gx = 2.85, gw = 3.8;
  const gyc = G.map((_, i) => gy0 + i * (gh + gap) + gh / 2);
  G.forEach(([t, cols, n], i) => {
    const y = gy0 + i * (gh + gap);
    box(gx, y, gw, gh, HEX.light, 'Feature group ' + (i + 1));
    T(s, [{ text: t, options: { bold: true, fontSize: 13, breakLine: true } }, { text: cols, options: { fontSize: 11 } }],
      gx + 0.12, y + 0.04, gw - 0.75, gh - 0.08, { valign: 'middle', objectName: 'Feature group text ' + (i + 1) });
    s.addShape(pres.ShapeType.ellipse, { x: gx + gw - 0.55, y: y + 0.11, w: 0.38, h: 0.38, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Feature count circle ' + (i + 1) });
    T(s, String(n), gx + gw - 0.55, y + 0.11, 0.38, 0.38, { fontSize: 13, bold: true, align: 'center', valign: 'middle', objectName: 'Feature count ' + (i + 1) });
  });
  // data sources (building outline feeds two groups)
  const S = [['Building outlines', 'Overture Maps', gy0, 2 * gh + gap], ['Tree map, 10 m', 'ESA WorldCover', gy0 + 2 * (gh + gap), gh],
    ['Tree height, 1 m', 'Meta / WRI canopy map', gy0 + 3 * (gh + gap), gh], ['H3 hexagons', 'count + K-means', gy0 + 4 * (gh + gap), gh]];
  S.forEach(([t, src, y, h], i) => {
    box(0.5, y, 2.0, h, 'D9D9D9', 'Source box ' + (i + 1));
    T(s, [{ text: t, options: { bold: true, fontSize: 12, breakLine: true } }, { text: src, options: { fontSize: 11 } }],
      0.62, y, 1.8, h, { valign: 'middle', objectName: 'Source text ' + (i + 1) });
  });
  arrowLine(2.5, gyc[0], gx, gyc[0], 'Arrow outline to size');
  arrowLine(2.5, gyc[1], gx, gyc[1], 'Arrow outline to quality');
  arrowLine(2.5, gyc[2], gx, gyc[2], 'Arrow WorldCover');
  arrowLine(2.5, gyc[3], gx, gyc[3], 'Arrow Meta');
  arrowLine(2.5, gyc[4], gx, gyc[4], 'Arrow H3');
  // model
  const mx = 7.05, mw = 1.35, my = gy0 + 0.45, mh = 2.5;
  box(mx, my, mw, mh, HEX.blue, 'Random Forest box');
  T(s, [{ text: 'Random Forest', options: { bold: true, fontSize: 15, breakLine: true } }, { text: '15 features', options: { fontSize: 13, breakLine: true } },
    { text: '200 trees', options: { fontSize: 13, breakLine: true } }, { text: 'learned from 290 labelled roofs', options: { fontSize: 11 } }],
    mx + 0.08, my, mw - 0.16, mh, { color: C.background1, align: 'center', valign: 'middle', objectName: 'Random Forest text' });
  gyc.forEach((yc, i) => arrowLine(gx + gw, yc, mx, my + 0.3 + i * (mh - 0.6) / 4, 'Arrow to model ' + (i + 1), HEX.blue));
  const ox = 8.6, ow = 0.9;
  box(ox, my + 0.55, ow, 0.6, C.accent1, 'Output good');
  T(s, 'Good', ox, my + 0.55, ow, 0.6, { fontSize: 14, bold: true, align: 'center', valign: 'middle', objectName: 'Output good text' });
  box(ox, my + mh - 1.15, ow, 0.6, 'D9D9D9', 'Output not good');
  T(s, 'Not good', ox, my + mh - 1.15, ow, 0.6, { fontSize: 14, bold: true, align: 'center', valign: 'middle', objectName: 'Output not good text' });
  arrowLine(mx + mw, my + 0.85, ox, my + 0.85, 'Arrow to good', HEX.blue);
  arrowLine(mx + mw, my + mh - 0.85, ox, my + mh - 0.85, 'Arrow to not good', HEX.blue);
  T(s, 'for all 13 M roofs', mx, my + mh + 0.08, 2.45, 0.3, { fontSize: 12, bold: true, align: 'center', objectName: 'Model note' });
  // sunshine: not a model input
  const sy = gy0 + 5 * (gh + gap) + 0.02;
  box(0.5, sy, 9.0, 0.36, 'FDF0D5', 'Sunshine note box');
  T(s, [{ text: 'Sunshine (Global Solar Atlas) is not a model input: ', options: { bold: true } },
    { text: 'it only shows location, so it is used later, free area × yield = electricity.' }], 0.62, sy, 8.8, 0.36,
    { fontSize: 12, valign: 'middle', objectName: 'Sunshine note' });
  s.addNotes('This slide shows how the features are made and used. On the left are the data sources. The building outline gives two groups: size and shape, and outline quality. The ESA WorldCover map gives tree cover in three rings and whether the roof looks built-up. The Meta map gives four tree-height numbers. The H3 hexagons give crowding and the area type from K-means. Together that is 2 + 3 + 4 + 4 + 2 = 15 numbers for every roof. The Random Forest, with 200 trees, learned from 290 labelled roofs how these numbers relate to good and not good roofs, and then judged all 13 million roofs. Sunshine is not a model input, because it changes only slowly across Kerala and mostly shows location; it is used later to turn free area into electricity.');

  }
  // 9c Pictures of the features
  {
    const s3 = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
    s3.addText('The features, as pictures', { placeholder: 'title' });
    badge(s3, 4);
    const fp = size('features_on_roof.png'), fh = 3.2, fw = fh * fp.w / fp.h, fx = (10 - fw) / 2;
    s3.addImage({ path: FIG + 'features_on_roof.png', x: fx, y: 1.55, w: fw, h: fh,
      altText: 'Three panels. Top view of one roof with size, shape and three tree rings; side view of the tree height; a hexagon counting buildings for crowding',
      objectName: 'Features picture' });
    const fy = 1.55, fhh = 3.1, fww = fhh * fp.w / fp.h, fx2 = (10 - fww) / 2;
    const px = [fx2 + fww * 0.20, fx2 + fww * 0.555, fx2 + fww * 0.855];   // centres of the three panels
    const ph = [['SIZE, SHAPE, TREE COVER', 'the roof and 3 rings of trees', 2.4], ['TREE HEIGHT', 'how tall the trees are', 2.0], ['CROWDING', 'how many buildings are nearby', 1.9]];
    ph.forEach(([t, sub, w], i) => {
      T(s3, [{ text: t, options: { bold: true, fontSize: 13, breakLine: true } }, { text: sub, options: { fontSize: 11, color: '6B6A66' } }], px[i] - w / 2 - 0.1, 1.12, w + 0.2, 0.55,
        { align: 'center', valign: 'middle', fontFace: 'Cambria', objectName: 'Panel heading ' + (i + 1) });
    });
    s3.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.78, w: 9, h: 0.46, rectRadius: 0.08, fill: { color: 'FDF0D5' }, line: { type: 'none' }, objectName: 'Features banner' });
    T(s3, [{ text: '6  Outline quality: ', options: { bold: true } }, { text: 'how reliable the building outline is (confidence, source, low-confidence flag). ' },
      { text: 'Sunshine is not an input.', options: { bold: true } }], 0.62, 4.78, 8.8, 0.46, { fontSize: 12, valign: 'middle', objectName: 'Features banner text' });
    s3.addNotes('This picture shows what the features look like. On the left, one roof seen from above. Its size is the area, and its shape is how compact the outline is. Around the roof are three rings, at 28, 140 and 300 metres, and for each ring I measure the share of trees. In the middle, the side view shows tree height: I take the tallest tree within about 5 and 15 metres, and the share of ground under trees of 5 metres or more. On the right, the map is cut into hexagons of about 0.1 square kilometres, and I count the buildings inside each hexagon; this is the crowding, and it also gives the area type from K-means: town, village or open land. The last feature, outline quality, is how reliable the building outline is. Sunshine is not an input to the model.');
  }

  // 12 Step 4b Random Forest
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Random Forest judges 13 M roofs', { placeholder: 'title' });
  badge(s, 4);
  s.addChart(pres.charts.BAR, [{ name: 'Accuracy', labels: ['Random Forest', 'Simple rule', 'Guess "suitable"'], values: [67, 58, 54] }], {
    x: 0.5, y: 1.25, w: 4.3, h: 3.4, barDir: 'col', chartColors: [HEX.blue, HEX.grey, HEX.grey], title: 'Correct on districts it never saw (%)',
    dataLabelFontSize: 14, valAxisMinVal: 0, valAxisMaxVal: 100, ...chartBase });
  const imp = [['Roof size', 23], ['Tall trees within 15 m', 9], ['Outline confidence', 9], ['Tallest tree at roof', 8], ['Roof shape', 8]].reverse();
  s.addChart(pres.charts.BAR, [{ name: 'Importance', labels: imp.map((r) => r[0]), values: imp.map((r) => r[1]) }], {
    x: 5.1, y: 1.25, w: 4.4, h: 3.4, barDir: 'bar', chartColors: [HEX.amber], title: 'What the model looks at (% of decisions)', dataLabelFontSize: 12,
    valAxisHidden: true, valGridLine: { style: 'none' }, ...{ ...chartBase, valGridLine: { style: 'none' } } });
  T(s, 'Tested fairly: trained on 13 districts, tested on the 14th, 14 times. Result: 6.7 M roofs (52%) are suitable.', 0.5, 4.75, 9, 0.35, { fontSize: 12, color: C.accent5, objectName: 'Model note' });
  s.addNotes('Now the model. With the 290 labels and the 15 features, I trained a Random Forest, which is many decision trees voting together, in Spark MLlib. To test it fairly I trained on 13 districts and tested on the 14th it had never seen, 14 times. It is correct 67 percent of the time; guessing gives 54. The most important clue is roof size, then trees near the roof. Then the model judged all 13 million roofs: 6.7 million, about half, are suitable.');

  // 13 Step 5 Free space
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('How much of each roof is free', { placeholder: 'title' });
  badge(s, 5);
  s.addShape(pres.ShapeType.rect, { x: 0.6, y: 1.35, w: 4.0, h: 2.5, fill: { color: HEX.line }, line: { type: 'none' }, objectName: 'Roof outline' });
  s.addShape(pres.ShapeType.rect, { x: 0.95, y: 1.7, w: 3.3, h: 1.8, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Free area' });
  s.addShape(pres.ShapeType.rect, { x: 2.95, y: 2.45, w: 1.1, h: 0.85, fill: { color: C.accent5 }, line: { type: 'none' }, objectName: 'Stair room' });
  T(s, 'free area for panels', 1.1, 1.8, 1.7, 0.5, { fontSize: 14, bold: true, objectName: 'Free area label' });
  T(s, 'stair room + tank', 2.95, 2.45, 1.1, 0.85, { fontSize: 12, bold: true, color: C.background1, align: 'center', valign: 'middle', objectName: 'Stair room label' });
  T(s, '0.6 m edge', 0.65, 1.38, 1.2, 0.3, { fontSize: 11, color: C.text1, objectName: 'Edge label' });
  T(s, [{ text: '1. Sedona shrinks each outline 0.6 m (ST_Buffer)', options: { breakLine: true } }, { text: '2. Subtract 8 m² for stair room and tank', options: { breakLine: true } },
    { text: '3. 10 m² free = 1 kW of panels' }], 0.6, 4.0, 4.0, 1.05, { fontSize: 14, paraSpaceAfter: 3, objectName: 'Free area steps' });
  s.addChart(pres.charts.BAR, [{ name: 'Free share', labels: ['under 50 m²', '50-120 m²', '120-500 m²', 'over 500 m²'], values: [40, 65, 78, 91] }], {
    x: 5.0, y: 1.25, w: 4.5, h: 3.35, barDir: 'col', chartColors: [HEX.blue], title: 'Share of roof free for panels (%)', dataLabelFontSize: 14,
    valAxisMinVal: 0, valAxisMaxVal: 100, ...chartBase });
  T(s, '6.69 M roofs measured in 6.4 minutes', 5.0, 4.7, 4.5, 0.35, { fontSize: 14, bold: true, objectName: 'Free share note' });
  s.addNotes('Step five: not all of a roof can hold panels. You leave an edge for safety, and the stair room and water tank take space. So for each good roof, Sedona shrank the outline by 0.6 metres from every side, and I subtracted 8 square metres. Small roofs keep only 40 percent, big roofs about 90. Sedona did this for 6.7 million roofs in 6.4 minutes. Then 10 square metres of free roof equals 1 kilowatt of panels.');

  // 14 Step 6 Spark at work
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Method' });
  s.addText('Spark at work: the proof', { placeholder: 'title' });
  badge(s, 6);
  const r14 = framed(s, 'crop_sql_plan.png', 0.5, 1.3, 4.2, 3.4, 'Spark UI query plan reading 12,989,365 roof records', 'Spark SQL plan');
  caption(s, 'Real screen: Spark UI query plan', 0.5, r14.y + r14.h + 0.08, 3.7);
  callout(s, '12,989,365 roofs read', r14.x + r14.w + 0.2, 4.35, 1.95, 0.4, r14.x + r14.w * 0.32, r14.y + r14.h * 0.88, 'Rows callout');
  bigNum(s, '1.5 GB', 'of roof data kept in memory', 6.6, 1.2, 2.9, { size: 32 });
  facts(s, ['22 Spark jobs, 8 parallel tasks', '1.4 GB moved between tasks', 'Later summaries reused memory: seconds, not minutes'], 6.6, 2.55, 2.9, 2.4, { size: 13 });
  s.addNotes('Step six: summarise and show. This is the proof of big data processing, from the Spark monitor. This query read all 12,989,365 roof records, about 1.1 gigabytes, joined them with the free-area table, and kept 1.5 gigabytes in memory. Because the data stayed in memory, the later summaries for districts and hexagons took seconds instead of minutes.');

  // ===================== RESULT =====================
  pres.addSection({ title: 'Result' });
  // 15 Kerala answer
  s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Result' });
  s.addText('Result: 88% of Kerala\'s need', { placeholder: 'title' });
  const big4 = [['6.7 M', 'good roofs (52%)'], ['18.5 GW', 'solar capacity'], ['28.2 TWh', 'electricity a year'], ['20.5 Mt', 'CO₂ avoided a year']];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * 2.28;
    card(s, x, 1.3, 2.1, 1.6, 'Result card ' + (i + 1), i === 2 ? { color: C.accent1 } : { color: C.background1, transparency: 88 });
    bigNum(s, big4[i][0], big4[i][1], x + 0.15, 1.42, 1.85, { size: 30, color: i === 2 ? C.text1 : C.accent1, lcolor: i === 2 ? C.text1 : C.background1, lh: 0.45 });
  }
  const tw = (t, o = {}) => ({ text: t, options: { fontSize: 14, color: C.background1, ...o } });
  s.addTable([[tw('Scenario', { bold: true }), tw('Capacity', { bold: true }), tw('Electricity / year', { bold: true })],
    [tw('Realistic: every good roof installs up to 3 kW', { bold: true, color: C.accent1 }), tw('18.5 GW', { bold: true, color: C.accent1 }), tw('28.2 TWh = 88% of need', { bold: true, color: C.accent1 })],
    [tw('Maximum: every good roof fully covered'), tw('64 GW'), tw('98 TWh')],
    [tw('Installed today (Oct 2024)'), tw('0.95 GW'), tw('20× less than realistic')]],
  { x: 0.5, y: 3.15, w: 9, colW: [4.3, 1.7, 3.0], rowH: 0.43, border: { type: 'solid', color: '4A4A47', pt: 0.75 }, valign: 'middle', margin: [0, 0.1, 0, 0.1], objectName: 'Scenario table' });
  s.addNotes('Here is the answer. 6.7 million roofs, about half, are good for solar. If each of them installs a normal 3 kilowatt home system, Kerala gets 18.5 gigawatts and 28 terawatt hours a year. That is 88 percent of all the electricity Kerala needs, and it avoids 20 million tonnes of CO2 every year. Today only 0.95 gigawatt is installed, so the realistic potential is 20 times more.');

  // 16 Where
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Result' });
  s.addText('Result: where the potential is', { placeholder: 'title' });
  const dist = D.district.slice().sort((a, b) => a.twh_real - b.twh_real);
  s.addChart(pres.charts.BAR, [{ name: 'TWh', labels: dist.map((d) => d.district), values: dist.map((d) => d.twh_real) }], {
    x: 0.5, y: 1.2, w: 5.6, h: 3.5, barDir: 'bar', chartColors: [HEX.blue], ...chartBase, title: 'Electricity per year, TWh (realistic)',
    dataLabelFontSize: 10, dataLabelFormatCode: '0.0', catAxisLabelFontSize: 10, valAxisHidden: true, valGridLine: { style: 'none' } });
  const mp = size('fig_map.png'), mh = 3.5, mw = mh * mp.w / mp.h;
  s.addImage({ path: FIG + 'fig_map.png', x: 6.35, y: 1.2, w: mw, h: mh, altText: 'Map of realistic rooftop solar capacity over Kerala', objectName: 'Capacity map' });
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.75, w: 9, h: 0.45, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Where banner' });
  T(s, 'Top: Ernakulam, Thrissur, Malappuram   |   Towns 78% of roofs good, villages 42%', 0.7, 4.75, 8.6, 0.45, { fontSize: 14, bold: true, valign: 'middle', objectName: 'Where text' });
  s.addNotes('Where is the potential? Ernakulam leads with 3.7 terawatt hours a year, then Thrissur and Malappuram; Wayanad is lowest. On the map, the dark spots are the cities: Kochi, Thiruvananthapuram, Thrissur, Kozhikode and Kannur. In towns 78 percent of roofs are good, but in villages only 42 percent, because of tree shade and small roofs.');

  // 17 One family
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Result' });
  s.addText('Result: what it means for one family', { placeholder: 'title' });
  const r17 = framed(s, 'dashboard_calculator.png', 0.5, 1.25, 3.0, 3.9, 'Dashboard savings calculator for a 3 kW system in Ernakulam', 'Calculator screenshot');
  const fam = [['3 kW', 'home system in Ernakulam'], ['₹1.17 lakh', 'cost after the ₹78,000 subsidy'], ['₹21,000', 'saved on bills every year'], ['5.6 years', 'to pay back, then 20 years of profit']];
  for (let i = 0; i < 4; i++) {
    const x = r17.x + r17.w + 0.4 + (i % 2) * 2.75, y = 1.3 + Math.floor(i / 2) * 1.85;
    card(s, x, y, 2.55, 1.65, 'Family card ' + (i + 1), i === 3 ? { color: C.accent1 } : undefined);
    bigNum(s, fam[i][0], fam[i][1], x + 0.2, y + 0.1, 2.2, { size: 28, lh: 0.7 });
  }
  caption(s, 'From my dashboard\'s savings calculator (prices adjustable)', r17.x + r17.w + 0.4, 5.0, 5.3);
  s.addNotes('What does this mean for one family? I built a savings calculator into my dashboard. A 3 kilowatt system in Ernakulam costs about 1.17 lakh rupees after the government subsidy. It saves about 21 thousand rupees a year on electricity bills, so it pays for itself in about 5.6 years, and then gives free power for 20 more years.');

  // 18 Live demo
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Result' });
  s.addText('Live demo: the dashboard', { placeholder: 'title' });
  const r18 = framed(s, 'dashboard_ernakulam.png', 0.5, 1.25, 5.6, 3.35, 'Dashboard showing 3D solar towers over Ernakulam', 'Dashboard screenshot');
  const demo = ['Open the link (anyone can)', 'Press Story mode: 6-step tour', 'Click Ernakulam: 3D towers', 'Compare two districts', 'Savings calculator'];
  for (let i = 0; i < demo.length; i++) {
    const y = 1.3 + i * 0.66;
    s.addShape(pres.ShapeType.ellipse, { x: 6.45, y, w: 0.45, h: 0.45, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Demo circle ' + (i + 1) });
    T(s, String(i + 1), 6.45, y, 0.45, 0.45, { fontSize: 14, bold: true, align: 'center', valign: 'middle', objectName: 'Demo number ' + (i + 1) });
    T(s, demo[i], 7.05, y - 0.05, 2.45, 0.55, { fontSize: 14, valign: 'middle', objectName: 'Demo step ' + (i + 1) });
  }
  T(s, [{ text: 'muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/', options: { hyperlink: { url: 'https://muhammedshahidsds25-collab.github.io/kerala-rooftop-solar/dashboard/web/', tooltip: 'Open the dashboard' }, color: HEX.blue } }],
    0.5, 4.75, 9, 0.35, { fontSize: 14, objectName: 'Dashboard link' });
  s.addNotes('Now the live demo: the dashboard is public, anyone can open this link. Story mode gives a 6-step guided tour. Clicking Ernakulam shows 3D towers; the height is solar capacity. You can compare any two districts and try the savings calculator. If the internet fails, this screenshot shows the dashboard.');

  // ===================== WRAP-UP =====================
  pres.addSection({ title: 'Wrap-up' });
  // 19 Limits
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Wrap-up' });
  s.addText('Honest limits and next steps', { placeholder: 'title' });
  const colsL = [[ic.FaExclamationTriangle, 'Limits', ['Only 290 labels; accuracy 67%', 'The blind re-check was done by me', 'Roof slope, partial shade and strength not modelled', 'Photos and data are from different years', 'Spark ran on one cloud machine']],
    [ic.FaForward, 'Next steps', ['An independent labeller and more labels', 'Roof slope and shade from 3D data', 'Check free area on real roofs', 'Run the pipeline on a cluster', 'Add grid and income data for adoption']]];
  for (let i = 0; i < 2; i++) {
    const x = 0.5 + i * 4.6;
    card(s, x, 1.25, 4.4, 3.75, 'Column card ' + (i + 1));
    await iconCircle(s, colsL[i][0], x + 0.25, 1.45, 0.55, 'Column icon ' + (i + 1));
    T(s, colsL[i][1], x + 0.95, 1.45, 3.2, 0.55, { fontSize: 20, bold: true, fontFace: 'Cambria', valign: 'middle', objectName: 'Column heading ' + (i + 1) });
    facts(s, colsL[i][2], x + 0.3, 2.2, 3.85, 2.65);
  }
  s.addNotes('To be honest about the limits: I had only 290 labelled roofs, and the model is right 67 percent of the time, which is good for district totals but not for single roofs. The blind check was done by me. Roof slope, partial shade and roof strength are not modelled. Next steps: an independent labeller and more labels, 3D data for slope and shade, field checks, a cluster run, and grid and income data.');

  // 20 Conclusion
  s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Wrap-up' });
  s.addText('Conclusion', { placeholder: 'title' });
  const glass = { color: C.background1, transparency: 90 };
  card(s, 0.5, 1.25, 4.3, 2.6, 'Conclusion card', glass);
  facts(s, ['Half of Kerala\'s 13 M roofs suit solar', 'Realistic 18.5 GW = 88% of Kerala\'s need', 'Saves about 20 Mt of CO₂ a year', 'Towns and Ernakulam, Thrissur, Malappuram lead'], 0.7, 1.4, 3.9, 2.35, { color: C.background1 });
  const co = [['CO1', 'Spark vs Sedona, MapReduce'], ['CO2', 'Cleaning, partitioning, PostGIS'], ['CO3', 'K-means, FP-Growth, Random Forest'], ['CO4', 'CO₂, subsidy, payback']];
  for (let i = 0; i < 4; i++) {
    const y = 1.25 + i * 0.67;
    card(s, 5.1, y, 4.4, 0.57, 'Outcome card ' + (i + 1), glass);
    T(s, co[i][0], 5.25, y, 0.7, 0.57, { fontSize: 16, bold: true, color: C.accent1, valign: 'middle', objectName: 'Outcome code ' + (i + 1) });
    T(s, co[i][1], 5.95, y, 3.45, 0.57, { fontSize: 14, color: C.background1, valign: 'middle', objectName: 'Outcome text ' + (i + 1) });
  }
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.1, w: 9, h: 0.95, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Thanks banner' });
  T(s, [{ text: 'Thank you. Questions?', options: { bold: true, fontSize: 22, breakLine: true } },
    { text: 'github.com/muhammedshahidsds25-collab/kerala-rooftop-solar', options: { fontSize: 14, hyperlink: { url: 'https://github.com/muhammedshahidsds25-collab/kerala-rooftop-solar', tooltip: 'Open the code' }, color: C.text1 } }],
    0.8, 4.1, 8.4, 0.95, { color: C.text1, valign: 'middle', objectName: 'Thanks text' });
  s.addNotes('To conclude: half of Kerala\'s 13 million roofs suit solar. Realistically they could give 18.5 gigawatts, 88 percent of the state\'s electricity need, saving about 20 million tonnes of CO2 a year. Towns and the districts of Ernakulam, Thrissur and Malappuram lead. The project covers all four course outcomes. All code is public on GitHub. Thank you, I am happy to take questions.');

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
