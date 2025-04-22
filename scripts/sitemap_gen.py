import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Iterable

REPO_DIR = Path(__file__).parent.parent
SITEMAP = REPO_DIR / "public/sitemap.xml"

def generate_sitemap(style_ids: Iterable[str]):
    namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    ET.register_namespace('', namespace['ns'])

    tree = ET.parse(SITEMAP)
    root = tree.getroot()

    existing_urls = {url.find('ns:loc', namespace).text for url in root.findall('ns:url', namespace)}

    base_url = 'https://tomp2.github.io/minecolonies-style-explorer/'

    current_date = datetime.now().isoformat()

    for style_id in style_ids:
        style_url = f'{base_url}?theme={style_id}'
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

    tree.write(SITEMAP, encoding='UTF-8', xml_declaration=True)


def main():
    STYLES_DIR = REPO_DIR / 'public/minecolonies'
    style_ids = []
    for style_dir in STYLES_DIR.iterdir():
        if not style_dir.is_dir():
            continue

        if not style_dir.joinpath('style.json').exists():
            continue

        style_ids.append(style_dir.name)

    generate_sitemap(style_ids)


if __name__ == '__main__':
    main()
