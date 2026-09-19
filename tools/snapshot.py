import pathlib,json,hashlib,datetime
root=pathlib.Path(__file__).resolve().parents[1]
rows=[{'file':'upstream.7z','url':'https://poe2db.tw/dls/poe2-trade-tw-0604v3.7z'}]
sha=(root/'sources/charm-commit.txt').read_text('utf-8-sig').strip()
for p in sorted((root/'sources').glob('*.csv')):rows.append({'file':'sources/'+p.name,'url':f'https://raw.githubusercontent.com/Chuanhsing/PoeCharm2/{sha}/Data/Translate/zh-rTW/{p.name}'})
for p in sorted((root/'sources').glob('db-*.html')):
 _,lang,name=p.stem.split('-',2);rows.append({'file':'sources/'+p.name,'url':f'https://poe2db.tw/{lang}/{name}'})
for lang,host in [('en','www.pathofexile.com'),('tw','pathofexile.tw')]:
 for kind in ['items','stats','static','filters']:rows.append({'file':f'sources/trade-{kind}-{lang}.json','url':f'https://{host}/api/trade2/data/{kind}'})
for row in rows:
 p=root/row['file']
 if p.exists():row['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
(root/'sources/downloads.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(len(rows),'source snapshots recorded')
