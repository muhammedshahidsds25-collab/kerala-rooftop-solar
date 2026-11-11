"""Targeted passage revision + plain black university formatting for build_report_final.js."""
import sys

P = sys.argv[1]
s = open(P, encoding='utf-8').read()


def end_of_string(i):
    while True:
        j = s.index("'", i)
        if s[j - 1] != '\\':
            return j
        i = j + 1


def put(start, new):
    global s
    assert s.count(start) == 1, ('put', start[:60], s.count(start))
    k = s.index(start)
    s = s[:k] + new.replace("'", "\\'") + s[end_of_string(k):]


def rep(old, new):
    global s
    assert s.count(old) == 1, ('rep', old[:60], s.count(old))
    s = s.replace(old, new)


# ---------------- formatting: everything black, no decoration ----------------
rep("const ACC = '1F4E8C';                 // heading colour", "const ACC = '000000';                 // all headings black")
rep("runs(cap, { size: 18, italics: true, color: '444444' })", "runs(cap, { size: 18, italics: true, color: '000000' })")
rep("const rule = { style: BorderStyle.SINGLE, size: 8, color: '404040' };", "const rule = { style: BorderStyle.SINGLE, size: 8, color: '000000' };")
rep("  shading: o.head ? { fill: 'E8EEF6', type: ShadingType.CLEAR, color: 'auto' } : undefined,\n", "")
rep("runs(o.note, { size: 17, italics: true, color: '555555' })", "runs(o.note, { size: 17, italics: true, color: '000000' })")
rep("children: [new TextRun({ text, style: 'Hyperlink', color: '0563C1', underline: {}, size: 18 })]", "children: [new TextRun({ text, color: '000000', size: 18 })]")
rep("text: 'Rooftop Solar Potential of Kerala from 13 Million Building Footprints', bold: true, size: 34, color: ACC",
    "text: 'Rooftop Solar Potential of Kerala from 13 Million Building Footprints', bold: true, size: 32, color: '000000'")
rep("italics: true, size: 22 })] }),", "italics: true, size: 24, color: '000000' })] }),")
rep("size: 20, color: bold ? ACC : '000000'", "size: 21, color: '000000'")
rep("border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '808080', space: 4 } },", "border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 4 } },")
s = s.replace("size: 17, color: '555555'", "size: 17, color: '000000'")
rep("run: { font: FONT, size: 23, bold: true, color: '1A1A1A' }", "run: { font: FONT, size: 23, bold: true, color: '000000' }")

# abstract: plain bold heading + normal paragraph (no shading, no border)
a = s.index("  new Paragraph({ spacing: { before: 240, after: 200, line: 264 }, alignment: AlignmentType.JUSTIFIED,\n    shading:")
b = s.index("{ size: 21 }) }),", a) + len("{ size: 21 }) }),")
abstract = ("This project estimates how much electricity could be produced from the rooftops of Kerala and where this potential is located. "
            "I used 19.4 million building footprints from Overture Maps, assigned them to the 14 districts and cleaned them in Apache Sedona, which gave 12,989,365 roofs. "
            "Each roof was described by its size, shape, solar yield, tree cover and tree height. To train a classifier, I labelled a random sample of 300 roofs on satellite images "
            "(294 could be judged); an AI model (Gemini) labelled the same roofs independently, and I re-checked the disagreements without seeing the earlier labels. "
            "A Random Forest in Spark MLlib was trained on the resulting 290 labels and applied to all roofs. It classified 6.69 million roofs (51.5%) as suitable, "
            "and I then used Sedona to calculate the free area of each of them. If every suitable roof installs a system of up to 3 kW, Kerala's rooftops could provide "
            "18.5 GW and 28.2 TWh per year, which is about 88% of the state's annual electricity requirement. Suitable roofs are much more common in towns (78%) than in "
            "tree-covered villages (42%), and Ernakulam, Thrissur and Malappuram have the highest potential.").replace("'", "\\'")
s = s[:a] + ("  new Paragraph({ spacing: { before: 260, after: 80 }, children: [new TextRun({ text: 'Abstract', bold: true, size: 24, color: '000000' })] }),\n"
             f"  P('{abstract}'),") + s[b:]

# ---------------- 1. Introduction ----------------
put("However, most houses in Kerala are homesteads", "However, most houses in Kerala are homesteads surrounded by coconut, jackfruit and mango trees, and many roofs are partly or fully shaded. A roof that looks large on a map may therefore be of little use for solar panels. A single figure for the whole state is not enough for planning: it is also necessary to know how many roofs are actually suitable and in which districts they are.")
put("The project is also a big data problem.", "This is also a big data problem. Kerala has about 13 million buildings, each stored as a polygon, and the canopy-height map I used has about 82 billion pixels over the state. My laptop has only 8 GB of RAM and could not load this data, so I ran all the heavy processing in Google Colab with Apache Spark and Apache Sedona. The project had two objectives:")
put("To estimate the number of suitable roofs", "To estimate how many roofs in Kerala are suitable for solar panels, how much free area each suitable roof has, and what this gives in capacity, electricity generation, CO₂ savings and household savings, for each district and area type.")
put("To carry out the spatial processing with the tools", "To carry out the spatial processing with the tools covered in the course (Apache Sedona on Spark, PostGIS, MapReduce, K-means, FP-Growth and Random Forest in Spark MLlib), and to compare what each tool contributes.")

# ---------------- 2. Methodology ----------------
put("All datasets used are openly available.", "All the datasets I used are openly available. For area and distance calculations, I projected the data to UTM zone 43N (EPSG:32643).")
put("The study area is the state of Kerala", "The study area is the state of Kerala (about 38,900 km²), which is divided into 14 districts. Buildings are dense on the coastal plain, while the eastern hill districts (Idukki, Wayanad and parts of Pathanamthitta) have fewer and more scattered buildings. Figure 1 shows the workflow. I wrote each step as a separate Colab notebook, 12 in total. Each notebook saved its output to Google Drive as GeoParquet or CSV files, and the next notebook read these files as its input.")
put("The buildings were downloaded for a rectangular area", "I downloaded the buildings for a rectangular area around Kerala, which also covers parts of Tamil Nadu and Karnataka. Using Apache Sedona, I assigned each building to a district by checking whether its centre point lies inside a district polygon (`ST_Contains` with a broadcast join). The district boundaries have up to 4,000 vertices, so I first split them into smaller parts with `ST_SubDivideExplode`; this keeps the spatial index efficient. During cleaning, I checked the geometries for validity and searched for exact duplicates using a hash of each geometry; neither problem was found. I removed 15,538 buildings smaller than 10 m² and flagged 2,213,255 outlines with low source confidence (below 0.70) without removing them. Of the 13,004,903 buildings inside Kerala, 12,989,365 were kept as roofs, with a total roof area of about 1,175 km² and a median roof size of 69 m². The result was saved as GeoParquet, partitioned by district (Table 2).")
put("For the unsupervised analysis, K-means", "For the unsupervised analysis, I applied K-means clustering to 260,447 H3 hexagons, using roof count, roof size, built-up share and tree cover, and chose the number of clusters with the silhouette score. For association rule mining, I represented each roof as a set of simple properties (size class, tree-cover class, crowding class, shape and outline confidence) and ran FP-Growth in Spark MLlib with a minimum support of 0.05 and a minimum confidence of 0.6. Finally, I summarised the results by district and by H3 hexagon and used these summaries in a web dashboard with a 3D map, a district comparison and a household savings calculator.")

# ---------------- 3. Results ----------------
rep("H2('3.1 How well the model judges roofs')", "H2('3.1 Classification accuracy')")
rep("'Table 3. Random Forest accuracy on the 290 gold labels.'", "'Table 3. Accuracy of the Random Forest classifier and simple baselines (290 gold labels).'")
put("The realistic scenario corresponds to about 88%", "The realistic scenario corresponds to about 88% of Kerala's annual electricity requirement and is roughly twenty times the rooftop capacity installed today. The technical maximum is about three times the annual demand. Roof area is therefore not the main limit on rooftop solar in Kerala.")
put("The technical maximum depends on the assumed edge strip", "The technical maximum depends on the edge strip and stair room area that are assumed. With a 0.3 m edge and no stair room it reaches 77.9 GW; with a 1.0 m edge and a 12 m² stair room it falls to 51.5 GW (Figure 4). My earlier simple assumption of 60% of every roof gave 52.0 GW, which is close to the most cautious setting. The difference is that the free share now depends on the size and shape of each roof.")
put("Figure 4. Technical maximum under different", "Figure 4. Technical maximum capacity under different edge-strip and stair-room assumptions. The grey bar is the earlier fixed assumption (60% of every roof); the dark bar is the setting used in this report (0.6 m edge, 8 m² stair room).")
rep("H2('3.3 Where the potential is')", "H2('3.3 Results by district and area type')")
put("Ernakulam has the highest potential, with 3.68 TWh", "Ernakulam has the highest potential: 3.68 TWh per year in the realistic scenario, with 70% of its roofs suitable. Thrissur (3.00 TWh) and Malappuram (2.90 TWh) follow, and Wayanad has the lowest value (0.67 TWh). Malappuram has the largest number of buildings (1.60 million), but only 43% of them are suitable, because many lie in villages with dense tree cover. K-means identified three area types (silhouette score 0.699 for k = 3): towns (3.34 million roofs, median roof size 87 m², 64% tree cover within 300 m), homestead villages (9.46 million roofs, 68 m², 94% tree cover) and sparse open land (0.19 million roofs) (Table 5). In towns, 78% of roofs are suitable, compared with 42% in villages. Villages still contribute 11.3 of the 18.5 GW, because most of Kerala's roofs are located there (Table 6).")
put("Figure 7. Spark UI event timeline", "Figure 7. Spark UI event timeline of the dashboard job. The long bar is the main join of the 13 million roof records; the short jobs after it reused the cached data.")
rep("H2('3.5 What it means for one family')", "H2('3.5 Household savings example')")
put("The savings calculator in the dashboard can be used", "I used the savings calculator in the dashboard to estimate the effect for one household. For a 3 kW system in Ernakulam, I assumed an installation cost of ₹65,000 per kW (₹1.95 lakh in total), less the PM Surya Ghar subsidy of ₹78,000, which gives a net cost of about ₹1.17 lakh. At the Ernakulam yield of about 1,527 kWh per kW, the system generates about 4,580 units per year. Assuming the household uses 200 units a month (2,400 units a year) at ₹6 per unit and exports the remaining units at ₹3 per unit, the annual saving is about ₹21,000, and the payback period is about 5.6 years. These prices are assumptions and can be changed in the calculator.")

# ---------------- 4. Discussion ----------------
put("The results show that about half of Kerala", "The results show that about half of Kerala's roofs are suitable for solar. If each suitable roof installed a typical household system, a large part of the state's electricity demand could be met from rooftops. The technical maximum is much higher than the demand, so the main limits are likely to be cost, grid capacity and the willingness of households to install systems, rather than roof area. Other estimates for Kerala are lower; WRI India, for example, reports 10.9 GW of total solar potential, because it includes these practical limits. The realistic value of 18.5 GW in this study lies between such estimates and the technical maximum of 64.3 GW. I consider the district ranking and the difference between towns and villages to be the most reliable results, because they depend mainly on roof size and tree cover, which the data capture well. On this basis, solar programmes could start in town areas, where roofs are larger and less shaded. Village areas would need a separate approach, because a smaller share of their roofs is suitable.")
rep("H2('4.2 What I learned about the tools')", "H2('4.2 Observations on the big data tools')")
put("The use of a spatial index had the largest effect", "A spatial index had the largest effect on performance. Sedona, which uses a spatial index, was 3.5 to 5.9 times faster than plain Spark, and a GiST index made the PostGIS radius query about 450 times faster (20,462 ms against 45.4 ms). The choice of method also mattered: the same raster lookup took 385.7 minutes (about 6.4 hours) with Sedona's raster join, but only 42 seconds with NumPy array indexing. Spark SQL was about ten times faster than my MapReduce version on RDDs (9.6 s against 97.6 s), mainly because of its query optimiser and column-based processing. Caching the joined data in memory reduced the later summary steps from minutes to seconds. Google Colab was necessary because my laptop could not handle the data, and the same code can run on a Spark cluster without major changes.")
rep("which is close to 90% of the state\\'s electricity requirement", "which is about 88% of the state\\'s annual electricity requirement")

open(P, 'w', encoding='utf-8').write(s)
print('ok')
