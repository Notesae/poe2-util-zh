import pathlib,json,re
items=json.loads(pathlib.Path('sources/missing-items.json').read_text('utf-8-sig'));names=set()
for x in items:
 if not x['type'].startswith('[DNT]'):names.add(x.get('name',x['type']))
for x in ['Dance with Death','Bonded Modifiers']:names.add(x)
pathlib.Path('sources/extra-pages.json').write_text(json.dumps(sorted(set(re.sub("[^A-Za-z0-9 _-]",'',x).replace(' ','_') for x in names))),encoding='utf-8')
