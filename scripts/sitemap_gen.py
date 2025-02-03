import json
import xml.etree.ElementTree as ET
from datetime import datetime

namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
ET.register_namespace('', namespace['ns'])

with open('../src/assets/themes.json') as json_file:
    styles = json.load(json_file)

tree = ET.parse('../public/sitemap.xml')
root = tree.getroot()

existing_urls = {url.find('ns:loc', namespace).text for url in root.findall('ns:url', namespace)}

base_url = 'https://tomp2.github.io/minecolonies-style-explorer/'

current_date = datetime.now().isoformat()

for style in styles:
    style_url = f'{base_url}?theme={style}'
    if style_url not in existing_urls:
        url_element = ET.Element(f'{{{namespace["ns"]}}}url')
        loc_element = ET.SubElement(url_element, f'{{{namespace["ns"]}}}loc')
        loc_element.text = style_url
        lastmod_element = ET.SubElement(url_element, f'{{{namespace["ns"]}}}lastmod')
        lastmod_element.text = current_date
        changefreq_element = ET.SubElement(url_element, f'{{{namespace["ns"]}}}changefreq')
        changefreq_element.text = 'daily'
        priority_element = ET.SubElement(url_element, f'{{{namespace["ns"]}}}priority')
        priority_element.text = '0.8'
        root.append(url_element)

tree.write('../public/sitemap.xml', encoding='UTF-8', xml_declaration=True)
