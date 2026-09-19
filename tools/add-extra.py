import pathlib
p=pathlib.Path('tools/build-data.py');s=p.read_text('utf-8-sig');s=s.replace("for row in json.loads((root/'sources/db-mod-pairs.json')", "for row in json.loads((root/'sources/db-extra-pairs.json').read_text('utf-8-sig')): add(row['en'],row['zh'],row['source'],4)\nfor row in json.loads((root/'sources/db-mod-pairs.json')");p.write_text(s,encoding='utf-8')
