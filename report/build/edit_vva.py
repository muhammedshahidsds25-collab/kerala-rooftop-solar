"""Editorial pass for the viva copy: clarity, flow, paragraph breaks. No facts or numbers changed."""
import sys

P = sys.argv[1]
s = open(P, encoding='utf-8').read()
esc = lambda t: t.replace("'", "\\'")


def end_of_string(i):
    while True:
        j = s.index("'", i)
        if s[j - 1] != '\\':
            return j
        i = j + 1


def put(start, *paras):
    """Replace the string literal starting with `start`; extra items become new P() paragraphs after it."""
    global s
    assert s.count(start) == 1, (start[:60], s.count(start))
    k = s.index(start)
    joined = "'),\n  P('".join(esc(p) for p in paras)
    s = s[:k] + joined + s[end_of_string(k):]


def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:60], s.count(old))
    s = s.replace(old, new)


# 1. Introduction
put("Kerala produces only about 30% of the electricity",
    "Kerala produces only about 30% of the electricity it uses, and the rest is bought from outside the state. Under the PM Surya Ghar scheme, a household can get a subsidy of up to ₹78,000 for a 3 kW rooftop system, but in October 2024 the installed rooftop capacity in Kerala was only about 0.95 GW (152,000 systems). Since there is very little free land for large solar plants, rooftops are an important option for increasing solar generation.")
put("This is also a big data problem.",
    "This is also a big data problem. Kerala has about 13 million buildings, each stored as a polygon, and the canopy-height map I used has about 82 billion pixels over the state. Data of this size cannot be handled with ordinary desktop GIS tools, so I ran all the heavy processing in Google Colab with Apache Spark and Apache Sedona. The project had two objectives:")

# 2.1 split study area and workflow
put("The study area is the state of Kerala",
    "The study area is the state of Kerala (about 38,900 km²), which is divided into 14 districts. Buildings are dense on the coastal plain, while the eastern hill districts (Idukki, Wayanad and parts of Pathanamthitta) have fewer and more scattered buildings.",
    "Figure 1 shows the workflow of the project. I wrote each step as a separate Colab notebook, 12 in total. Each notebook saved its output to Google Drive as GeoParquet or CSV files, and the next notebook read these files as its input, so every step could be re-run on its own.")

# 2.3 shorter sentences, first person
put("The following features were calculated for every roof:",
    "For every roof I calculated six kinds of features. The first two describe the roof itself: its area and compactness (4πA/P²), and the annual solar yield at its location (1,460-1,578 kWh per kW). Two describe shade: the share of tree cover within about 28, 140 and 300 m (from WorldCover), and four tree-height measures from the Meta 1 m map (the tallest tree within about 5 m and 15 m, and the share of area covered by trees of 5 m or more within 15 m and 30 m). The last two are the number of buildings in the same H3 hexagon (resolution 9, about 0.1 km²), as a measure of crowding, and the confidence of the building outline.")
put("In the first version, raster values were extracted",
    "My first version extracted the raster values with Sedona's raster join, which took 385.7 minutes. Rewriting the same step with NumPy array indexing on the full raster brought this down to 42 seconds. I processed the canopy-height map (about 82 billion pixels) tile by tile in 3 × 3 pixel blocks, which took 19.9 minutes.")

# 2.4 explain the 6 missing roofs
rep("I labelled 294 of these roofs.", "I labelled 294 of these roofs; the other 6 were too unclear to judge.")

# 2.6 explain the area check
rep("The areas in metres matched the original areas (median ratio 0.9997).",
    "As a check, the areas in metres matched the original areas (median ratio 0.9997), which confirmed that the conversion was correct.")

# 3.1 plainer baseline wording
rep("compared with 54% when all roofs are labelled as suitable.", "compared with 54% if every roof is simply called suitable.")

# 3.2 explain where the 60% came from
rep("My earlier simple assumption of 60% of every roof gave 52.0 GW, which is close to the most cautious setting. The difference is that the free share now depends on the size and shape of each roof.",
    "In an earlier step of the project I had assumed that 60% of every suitable roof was usable, which gave 52.0 GW, close to the most cautious setting. The difference is that the free share now depends on the size and shape of each roof.")

# 3.3 split districts / area types, remove double brackets
put("Ernakulam has the highest potential:",
    "Ernakulam has the highest potential: 3.68 TWh per year in the realistic scenario, with 70% of its roofs suitable. Thrissur (3.00 TWh) and Malappuram (2.90 TWh) follow, and Wayanad has the lowest value (0.67 TWh). Malappuram has the largest number of buildings (1.60 million), but only 43% of them are suitable, because many lie in villages with dense tree cover (Table 6).",
    "K-means identified three area types, with a silhouette score of 0.699 for k = 3 (Table 5). Towns have 3.34 million roofs with a median size of 87 m² and 64% tree cover within 300 m. Homestead villages have 9.46 million roofs, a median size of 68 m² and 94% tree cover, and sparse open land has 0.19 million roofs. In towns, 78% of roofs are suitable, compared with 42% in villages. Villages still contribute 11.3 of the 18.5 GW, because most of Kerala's roofs are located there.")

# 3.4 say which job
rep("The Spark UI for the dashboard job shows the scale of the processing.",
    "The Spark UI of the last notebook, which prepared the data for the dashboard, shows the scale of the processing.")

# 4.1 split into comparison and recommendation
put("The results show that about half of Kerala",
    "The results show that about half of Kerala's roofs are suitable for solar. If each suitable roof installed a typical household system, a large part of the state's electricity demand could be met from rooftops. The technical maximum is much higher than the demand, so the main limits are likely to be cost, grid capacity and the willingness of households to install systems, rather than roof area. Other estimates for Kerala are lower; WRI India, for example, reports 10.9 GW of total solar potential, because it includes these practical limits. The realistic value of 18.5 GW in this study lies between such estimates and the technical maximum of 64.3 GW.",
    "I consider the district ranking and the difference between towns and villages to be the most reliable results, because they depend mainly on roof size and tree cover, which the data capture well. On this basis, solar programmes could start in town areas, where roofs are larger and less shaded. Village areas would need a separate approach, because a smaller share of their roofs is suitable.")

# 4.2 last sentence plainer
rep("Running the work in Google Colab with Spark kept the data processing in the cloud, and the same code can run on a Spark cluster without major changes.",
    "The same Spark code would also run on a multi-node cluster without major changes.")

# 4.4 soften causal claim
rep("which limits the accuracy to around 67-68%.", "which probably limits the accuracy to around 67-68%.")

open(P, 'w', encoding='utf-8').write(s)
print('ok')
