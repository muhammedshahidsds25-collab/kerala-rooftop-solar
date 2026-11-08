"""Screenshot every Spark UI page (and save its numbers) - run while the Spark session is alive.
Usage: python shoot_spark.py <output folder> [ui url]"""
import json
import os
import sys
import urllib.request

from playwright.sync_api import sync_playwright

OUT = sys.argv[1]
UI = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:4040'
os.makedirs(OUT, exist_ok=True)


def api(path):
    return json.load(urllib.request.urlopen(f'{UI}/api/v1/{path}'))


app = api('applications')[0]['id']
data = {k: api(f'applications/{app}/{k}') for k in ('jobs', 'stages', 'executors', 'storage/rdd', 'environment')}
try:
    data['sql'] = api(f'applications/{app}/sql?length=1000')
except Exception:
    data['sql'] = []
with open(f'{OUT}/spark_ui_data.json', 'w') as f:
    json.dump(data, f, indent=1)
longest = max(data['sql'], key=lambda q: q.get('duration', 0))['id'] if data['sql'] else None

pages = {'spark_jobs': '/jobs/', 'spark_stages': '/stages/', 'spark_storage': '/storage/',
         'spark_executors': '/executors/', 'spark_environment': '/environment/', 'spark_sql_list': '/SQL/'}
if longest is not None:
    pages['spark_sql_plan'] = f'/SQL/execution/?id={longest}'
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1600, 'height': 1000})
    for name, path in pages.items():
        page.goto(UI + path)
        page.wait_for_timeout(3000)                    # executors and SQL plan pages draw with JavaScript
        if name == 'spark_jobs':
            page.screenshot(path=f'{OUT}/{name}.png', full_page=True)
            page.get_by_text('Event Timeline').first.click()
            page.mouse.move(800, 990)                  # no tooltip over the timeline
            page.wait_for_timeout(2500)
            name = 'spark_timeline'
        page.screenshot(path=f'{OUT}/{name}.png', full_page=True)
        print('saved', name)
    browser.close()
print(f'{len(data["jobs"])} jobs, {len(data["stages"])} stages, longest SQL query id {longest} -> {OUT}')
