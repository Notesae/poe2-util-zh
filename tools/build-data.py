import csv,json,pathlib,hashlib,re
root=pathlib.Path(__file__).resolve().parents[1]
records={}; conflicts=[]; ambiguous=set()
def add(en,zh,source,priority=0):
 en=en.strip(); zh=zh.strip()
 if not en or not re.search('[\u3400-\u9fff]',zh) or en==zh: return
 if en in records and records[en]['zh']!=zh:
  conflicts.append({'en':en,'kept':records[en]['zh'],'other':zh,'source':source})
  if priority==records[en]['priority'] and re.sub(r'\s','',zh)!=re.sub(r'\s','',records[en]['zh']): ambiguous.add(en)
  if priority<=records[en]['priority']: return
 records[en]={'en':en,'zh':zh,'source':source,'priority':priority}
up=root/'poe2-trade-tw'
for en,zh in json.loads((up/'json/translate.zh_TW.json').read_text('utf-8-sig')).items(): add(en,zh,'poe2db-plugin:json/translate.zh_TW.json',3)
for en,row in json.loads((up/'json/translate.json').read_text('utf-8-sig')).items():
 if row.get('zh_tw'): add(en,row['zh_tw'],'poe2db-plugin:json/translate.json',3)
sha=(root/'sources/charm-commit.txt').read_text('utf-8-sig').strip()
for p in sorted((root/'sources').glob('*.csv')):
 for i,row in enumerate(csv.reader(p.open(encoding='utf-8-sig',newline='')),1):
  if len(row)==2: add(row[0],row[1],f'PoeCharm2@{sha}:Data/Translate/zh-rTW/{p.name}:{i}')
for row in json.loads((root/'sources/db-pairs.json').read_text('utf-8-sig')): add(row['en'],row['zh'],row['source'],4)
for row in json.loads((root/'sources/db-extra-pairs.json').read_text('utf-8-sig')): add(row['en'],row['zh'],row['source'],4)
for row in json.loads((root/'sources/db-mod-pairs.json').read_text('utf-8-sig')): add(row['en'],row['zh'],row['source'],4)
for row in json.loads((root/'sources/official-pairs.json').read_text('utf-8-sig')):
 add(row['en'],row['zh'],row['source'],5)
 if '#' in row['en'] and row['en'].count('#')==row['zh'].count('#'):
  def template(text):
   i=iter(range(text.count('#')))
   return re.sub('#',lambda m:'{'+str(next(i))+'}',text)
  add(template(row['en']),template(row['zh']),row['source'],5)
# Extract separately delimited modifiers from two verified multi-mod item descriptions.
for row in json.loads((root/'sources/db-mod-pairs.json').read_text('utf-8-sig')):
 if not any(x in row['source'] for x in ('/Atziris_Soul_Core_of_Alacrity#','/Legacy_of_Oberns_Bastion#')): continue
 ens=row['en'].split(', '); zhs=row['zh'].split(', ')
 if len(ens)!=len(zhs): continue
 for en,zh in zip(ens,zhs):
  if row['en'].startswith('Bonded: ') and not en.startswith('Bonded: '):
   en=row['en'].split(': ',1)[0]+': '+en; zh=row['zh'].split(': ',1)[0]+': '+zh
  add(en,zh,row['source']+' (delimited modifier)',4)
# Preserve the official local-modifier qualifier verbatim.
for row in json.loads((root/'sources/official-pairs.json').read_text('utf-8-sig')):
 if row['en'].endswith(' (Local)'):
  match=re.search(r' (\([^()]+\))$',row['zh'])
  if match: add('(Local)',match[1],row['source']+' (qualifier)',5)
for en in ambiguous:
 if records.get(en,{}).get('priority',0)<4: records.pop(en,None)
data={'version':(root/'sources/version.txt').read_text('utf-8-sig').strip(),'sourcePage':'https://poe2db.tw/tw/PoeCharm','commit':sha,'apiLabels':json.loads((root/'sources/api-labels.json').read_text('utf-8-sig')),'records':list(records.values())}
(root/'extension/data.js').write_text('globalThis.POE2_ZH_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(root/'sources/conflicts.json').write_text(json.dumps(conflicts,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'records':len(records),'conflicts':len(conflicts),'templates':sum('{' in k for k in records)},ensure_ascii=False))
