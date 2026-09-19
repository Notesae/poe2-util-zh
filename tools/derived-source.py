import pathlib
p=pathlib.Path('tools/build-data.py');s=p.read_text('utf-8-sig');pos=s.index('for en in ambiguous:');s=s[:pos]+'''# Extract separately delimited modifiers from two verified multi-mod item descriptions.
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
  match=re.search(r' (\\([^()]+\\))$',row['zh'])
  if match: add('(Local)',match[1],row['source']+' (qualifier)',5)
''' +s[pos:];p.write_text(s,encoding='utf-8')
