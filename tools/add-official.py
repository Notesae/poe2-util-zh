import pathlib
p=pathlib.Path('tools/build-data.py');s=p.read_text('utf-8-sig')
pos=s.index('for en in ambiguous:')
s=s[:pos]+'''for row in json.loads((root/'sources/db-pairs.json').read_text('utf-8-sig')): add(row['en'],row['zh'],row['source'],4)
for row in json.loads((root/'sources/official-pairs.json').read_text('utf-8-sig')):
 add(row['en'],row['zh'],row['source'],5)
 if '#' in row['en'] and row['en'].count('#')==row['zh'].count('#'):
  def template(text):
   i=iter(range(text.count('#')))
   return re.sub('#',lambda m:'{'+str(next(i))+'}',text)
  add(template(row['en']),template(row['zh']),row['source'],5)
''' +s[pos:]
s=s.replace("for en in ambiguous: records.pop(en,None)","for en in ambiguous:\n if records.get(en,{}).get('priority',0)<4: records.pop(en,None)")
s=s.replace("'records':list(records.values())","'apiLabels':json.loads((root/'sources/api-labels.json').read_text('utf-8-sig')),'records':list(records.values())")
p.write_text(s,encoding='utf-8')
