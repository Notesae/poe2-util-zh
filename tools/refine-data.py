import pathlib
p=pathlib.Path('tools/build-data.py')
s=p.read_text('utf-8-sig').replace('records={}; conflicts=[]','records={}; conflicts=[]; ambiguous=set()')
s=s.replace("conflicts.append({'en':en,'kept':records[en]['zh'],'other':zh,'source':source})", "conflicts.append({'en':en,'kept':records[en]['zh'],'other':zh,'source':source})\n  if priority==records[en]['priority'] and re.sub(r'\\s','',zh)!=re.sub(r'\\s','',records[en]['zh']): ambiguous.add(en)")
s=s.replace("data={'version'", "for en in ambiguous: records.pop(en,None)\ndata={'version'")
p.write_text(s,encoding='utf-8')
