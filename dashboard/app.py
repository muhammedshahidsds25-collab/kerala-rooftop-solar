"""
Kerala rooftop solar dashboard (Streamlit).

Run locally:   streamlit run dashboard/app.py
Data: unzip results/dashboard_data.zip (made by notebook 12) into dashboard/data/.
"""
import json
import pathlib

import altair as alt
import numpy as np
import pandas as pd
import pydeck as pdk
import streamlit as st

DATA = pathlib.Path(__file__).parent / 'data'
NEED_TWH = 32.0                      # Kerala yearly electricity requirement (CEA projection 2024-25)
INSTALLED_MW = 946.9                 # Kerala rooftop solar installed, October 2024
ACCENT = '#2a78d6'                   # blue: the one data colour
LIGHT = '#9ec5f4'                    # light blue: the not-highlighted bars
RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']   # sequential blue
SUITABLE_RGB, NOT_RGB = [235, 104, 52], [137, 135, 129]                               # orange / grey points
Y_AXIS = alt.Axis(labelLimit=360)   # keep long bar labels readable
AREA_TYPES = {0: 'Homestead villages', 1: 'Towns', 2: 'Sparse open land'}

st.set_page_config(page_title='Kerala Rooftop Solar', page_icon='☀️', layout='wide')


@st.cache_data
def load():
    need = ['hex7.csv', 'district.csv', 'roof_sample.csv', 'districts.geojson']
    missing = [n for n in need if not (DATA / n).exists()]
    if missing:
        return None, missing
    d = {n.split('.')[0]: pd.read_csv(DATA / n) for n in need if n.endswith('.csv')}
    d['geo'] = json.loads((DATA / 'districts.geojson').read_text())
    for n in ('area_type', 'usable_sensitivity', 'rf_accuracy', 'rf_feature_importance', 'fpgrowth_suitable_rules',
              'usable_share_by_size'):
        d[n] = pd.read_csv(DATA / f'{n}.csv') if (DATA / f'{n}.csv').exists() else None
    return d, []


D, missing = load()
if D is None:
    st.error(f'Data files missing in {DATA}: {", ".join(missing)}. Unzip dashboard_data.zip from notebook 12 there.')
    st.stop()
hexes, district, sample = D['hex7'], D['district'], D['roof_sample']

# ---------------- sidebar: the two filters ----------------
st.sidebar.title('☀️ Kerala Rooftop Solar')
scenario = st.sidebar.radio(
    'Scenario', ['Realistic', 'Technical maximum'],
    captions=['Each good roof installs its free area, at most 3 kW (PM Surya Ghar size)',
              'Every good roof fully covered (free area after a 0.6 m edge and 8 m² stair room)'])
REAL = scenario == 'Realistic'
GW, TWH, MW, GWH = ('gw_real', 'twh_real', 'mw_real', 'gwh_real') if REAL else ('gw_max', 'twh_max', 'mw_max', 'gwh_max')
place = st.sidebar.selectbox('District', ['All Kerala'] + sorted(district.district))
st.sidebar.caption('13 million buildings from Overture Maps, judged by a Spark MLlib Random Forest; '
                   'free roof area from Apache Sedona. M.Sc. project, Digital University Kerala.')

sel = district if place == 'All Kerala' else district[district.district == place]

# ---------------- headline numbers ----------------
st.title('Rooftop solar potential of Kerala' + ('' if place == 'All Kerala' else f' · {place}'))
c1, c2, c3, c4 = st.columns(4)
roofs, good = int(sel.roofs.sum()), int(sel.suitable_roofs.sum())
c1.metric('Buildings', f'{roofs / 1e6:.2f} M' if roofs > 1e6 else f'{roofs:,}')
c2.metric('Roofs suitable for solar', f'{100 * good / roofs:.0f}%', f'{good:,} roofs', delta_color='off')
c3.metric(f'Solar capacity ({scenario.lower()})', f'{sel[GW].sum():.1f} GW')
twh = sel[TWH].sum()
c4.metric('Electricity per year', f'{twh:.1f} TWh',
          f'{100 * twh / NEED_TWH:.0f}% of Kerala\'s yearly need' if place == 'All Kerala' else None, delta_color='off')

tab_map, tab_dist, tab_scen, tab_model, tab_method = st.tabs(['Map', 'Districts', 'Scenarios', 'Model', 'Method'])

# ---------------- map ----------------
with tab_map:
    metric = st.segmented_control(
        'Colour hexagons by', ['Solar capacity', '% roofs suitable', 'Tree height near roofs'],
        default='Solar capacity')
    col = {'Solar capacity': MW, '% roofs suitable': 'pct_suitable', 'Tree height near roofs': 'avg_tree_m'}[metric or 'Solar capacity']
    unit = {MW: 'MW', 'pct_suitable': '%', 'avg_tree_m': 'm'}[col]
    edges = np.unique(np.nanquantile(hexes[col], np.linspace(0, 1, len(RAMP) + 1)))     # bins from ALL hexes
    idx = np.clip(np.searchsorted(edges, hexes[col], side='right') - 1, 0, len(RAMP) - 1)
    rgb = [[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in RAMP]
    hx = hexes.assign(color=[rgb[i] for i in idx])
    if place != 'All Kerala':
        hx = hx[hx.district == place]
    if place == 'All Kerala':        # whole state, north (Kasaragod) to south (Thiruvananthapuram)
        view = pdk.ViewState(latitude=10.55, longitude=76.3, zoom=6.4)
    else:
        view = pdk.ViewState(latitude=float(hx.lat.mean()), longitude=float(hx.lon.mean()), zoom=8.6)
    layers = [pdk.Layer('H3HexagonLayer', hx, get_hexagon='h3', get_fill_color='color',
                        opacity=0.75 if place == 'All Kerala' else 0.35, stroked=False, extruded=False,
                        pickable=True),
              pdk.Layer('GeoJsonLayer', D['geo'], stroked=True, filled=False, get_line_color=[82, 81, 78],
                        line_width_min_pixels=1)]
    if place != 'All Kerala':
        pts = sample[sample.district == place].assign(
            color=lambda d: [SUITABLE_RGB if s else NOT_RGB for s in d.suitable])
        layers.append(pdk.Layer('ScatterplotLayer', pts, get_position=['lon', 'lat'], get_fill_color='color',
                                get_radius=40, radius_min_pixels=3, stroked=True, get_line_color=[255, 255, 255],
                                line_width_min_pixels=1, pickable=False, parameters={'depthTest': False}))
    st.pydeck_chart(pdk.Deck(layers=layers, initial_view_state=view, map_provider='carto',
                             map_style=pdk.map_styles.CARTO_LIGHT,
                             tooltip={'html': '<b>{district}</b><br/>{roofs} buildings · {pct_suitable}% suitable<br/>'
                                              f'{scenario}: {{{MW}}} MW · {{{GWH}}} GWh/yr<br/>'
                                              'Tallest tree near roofs: {avg_tree_m} m (average)'}),
                    height=640)
    swatches = ''.join(f'<span style="display:inline-block;width:28px;height:12px;background:{c};margin-right:2px"></span>'
                       for c in RAMP)
    st.markdown(f'{swatches} &nbsp; low → high {metric.lower() if metric else ""} '
                f'({edges[0]:.1f}–{edges[-1]:.1f} {unit}; each colour holds the same number of hexagons, about 5 km² each)',
                unsafe_allow_html=True)
    if place != 'All Kerala':
        st.caption('Dots: a random sample of roofs — orange = suitable, grey = not suitable.')

# ---------------- districts ----------------
with tab_dist:
    st.subheader(f'Electricity per year by district ({scenario.lower()})')
    bars = (alt.Chart(district).mark_bar(cornerRadiusEnd=4)
            .encode(x=alt.X(f'{TWH}:Q', title='TWh per year'),
                    y=alt.Y('district:N', sort='-x', title=None, axis=Y_AXIS),
                    color=alt.condition(alt.datum.district == place, alt.value(ACCENT),
                                        alt.value(ACCENT if place == 'All Kerala' else LIGHT)),
                    tooltip=[alt.Tooltip('district:N', title='District'),
                             alt.Tooltip(f'{TWH}:Q', title='TWh per year'), alt.Tooltip(f'{GW}:Q', title='GW'),
                             alt.Tooltip('pct_suitable:Q', title='% roofs suitable'),
                             alt.Tooltip('roofs:Q', title='Buildings', format=',')])
            .properties(height=alt.Step(26)))
    st.altair_chart(bars, width='stretch')
    if D['area_type'] is not None:
        st.subheader('Towns vs villages')
        at = D['area_type'].assign(area=lambda d: d.area_type.map(AREA_TYPES))
        st.altair_chart(alt.Chart(at).mark_bar(cornerRadiusEnd=4, color=ACCENT)
                        .encode(x=alt.X('pct_suitable:Q', title='% of roofs suitable', scale=alt.Scale(domain=[0, 100])),
                                y=alt.Y('area:N', sort='-x', title=None, axis=Y_AXIS),
                                tooltip=['area', 'roofs', 'pct_suitable', 'gw_real', 'gw_max'])
                        .properties(height=alt.Step(26)), width='stretch')
        st.caption('Area types come from K-means clustering of H3 hexagons (notebook 07). '
                   'Village roofs are smaller and shaded by homestead trees.')
    st.dataframe(district.rename(columns={'gw_max': 'GW max', 'twh_max': 'TWh max', 'gw_real': 'GW realistic',
                                          'twh_real': 'TWh realistic', 'pct_suitable': '% suitable',
                                          'avg_roof_m2': 'avg roof m²', 'pct_town_roofs': '% town roofs',
                                          'avg_tree_m': 'tree height m'}),
                 hide_index=True, width='stretch', height=(len(district) + 1) * 35 + 3)

# ---------------- scenarios ----------------
with tab_scen:
    st.subheader('How much the answer depends on the assumptions')
    k = district
    levels = pd.DataFrame({
        'Level': ['Technical maximum', 'Realistic (≤ 3 kW per good roof)', 'Installed today (Oct 2024)'],
        'GW': [k.gw_max.sum(), k.gw_real.sum(), INSTALLED_MW / 1000],
        'TWh per year': [f'{k.twh_max.sum():.2f}', f'{k.twh_real.sum():.2f}', '—']}).round(2)
    st.dataframe(levels, hide_index=True, width='stretch')
    st.caption(f'Kerala needs about {NEED_TWH:.0f} TWh of electricity per year.')
    sens = D['usable_sensitivity']
    if sens is not None:
        sens = sens.assign(main=sens.method.str.contains('main'), method=sens.method.str.replace('  <- main', ' (main)'))
        st.altair_chart(alt.Chart(sens).mark_bar(cornerRadiusEnd=4)
                        .encode(x=alt.X('gw:Q', title='Technical maximum, GW'),
                                y=alt.Y('method:N', sort=None, title=None, axis=Y_AXIS),
                                color=alt.condition(alt.datum.main, alt.value(ACCENT), alt.value(LIGHT)),
                                tooltip=['method', alt.Tooltip('free_share_pct:Q', title='free share of roof %'),
                                         'gw', 'twh_per_year'])
                        .properties(height=alt.Step(26)), width='stretch')
        st.caption('Free roof area = outline shrunk by an edge strip (Sedona ST_Buffer) minus a stair room and water tank. '
                   'Dark bar: main setting. The old single guess (60% of every roof) is the first bar.')

# ---------------- model ----------------
with tab_model:
    st.subheader('Is the roof good for solar? A Spark MLlib Random Forest')
    st.markdown('**Labels:** 300 random roofs were judged on satellite images by the author and by an AI model '
                '(Gemini). Where they agreed (218 roofs) that answer was kept; the 75 disagreements were judged again '
                'blind (72 decided). **Gold labels: 290 roofs (156 good, 134 not good).**')
    acc = D['rf_accuracy']
    if acc is not None:
        acc = acc[['check', 'accuracy', 'roc_auc', 'precision', 'recall']]
        st.altair_chart(alt.Chart(acc).mark_bar(cornerRadiusEnd=4)
                        .encode(x=alt.X('accuracy:Q', scale=alt.Scale(domain=[0, 1]), title='Accuracy'),
                                y=alt.Y('check:N', sort=None, title=None, axis=Y_AXIS),
                                color=alt.condition(alt.FieldOneOfPredicate('check', [
                                    'RF with tree height - leave one district out']), alt.value(ACCENT), alt.value(LIGHT)),
                                tooltip=list(acc.columns))
                        .properties(height=alt.Step(26)), width='stretch')
        st.caption('Leave one district out = trained on 13 districts, tested on the 14th it never saw (honest check).')
    imp = D['rf_feature_importance']
    if imp is not None:
        st.subheader('What the model looks at')
        st.altair_chart(alt.Chart(imp).mark_bar(cornerRadiusEnd=4, color=ACCENT)
                        .encode(x=alt.X('importance:Q', title='Share of the model\'s decisions'),
                                y=alt.Y('feature:N', sort='-x', title=None, axis=Y_AXIS), tooltip=['feature', 'importance'])
                        .properties(height=alt.Step(22)), width='stretch')
    rules = D['fpgrowth_suitable_rules']
    if rules is not None:
        st.subheader('What the model\'s suitable roofs have in common (FP-Growth)')
        st.dataframe(rules, hide_index=True, width='stretch')
        st.caption('These rules describe the model\'s choices, not independent facts.')

# ---------------- method ----------------
with tab_method:
    st.subheader('How it was made')
    st.graphviz_chart('''
digraph {
  rankdir=TB; node [shape=box, style="rounded,filled", fillcolor="#cde2fb", color="#2a78d6", fontname="Segoe UI"];
  a [label="Overture buildings\\n19.4 M polygons"]; b [label="Sedona: district join\\n+ cleaning → 13.0 M roofs"];
  c [label="Roof features\\nsize, shape, sun (GSA),\\ntrees (WorldCover, Meta 1 m)"];
  d [label="PostGIS\\nGiST index, partitions"]; e [label="K-means (H3) +\\nFP-Growth"];
  f [label="Labels: 290 roofs\\n(human + AI, blind check)"]; g [label="Random Forest\\n(Spark MLlib)"];
  h [label="Sedona ST_Buffer:\\nfree roof area"]; i [label="Potential per roof,\\ndistrict, hexagon"];
  a -> b -> c -> g -> i; b -> d; c -> e; f -> g; g -> h -> i; e -> g;
}''')
    st.markdown('''
| Data | Size |
|---|---|
| Overture buildings, Kerala box | 19.4 M polygons, 1.7 GB |
| Roofs inside Kerala after cleaning | 13.0 M polygons |
| Meta / WRI canopy height (1 m) | ~82 billion pixels, ~11 GB |
| ESA WorldCover 10 m, Global Solar Atlas | ~0.6 GB |
| Stored on Google Drive | ~13.8 GB |

**Credits:** Overture Maps Foundation · Global Solar Atlas (World Bank, Solargis) · ESA WorldCover 2021 ·
Meta & WRI global canopy height (Tolan et al. 2024) · Esri World Imagery (labelling).
**Limits:** technical potential from roof geometry; no grid, structure, ownership or partial-shade limits;
labels from satellite images; about 68% of roofs classified correctly in unseen districts.
''')
