import json,pathlib,re
from html.parser import HTMLParser
root=pathlib.Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links={};self.key=None;self.parts=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a':self.key=a.get('href');self.parts=[]
 def handle_data(self,data):
  if self.key:self.parts.append(data)
 def handle_endtag(self,tag):
  if tag=='a' and self.key:
   text=' '.join(''.join(self.parts).split());key=re.sub(r'^https://poe2db.tw/','',self.key);key=re.sub(r'^(us|tw)/','',key)
   if text and len(text)<160 and not key.startswith(('#','http','javascript')):self.links.setdefault(key,set()).add(text)
   self.key=None
pairs=[]
for p in sorted((root/'sources').glob('db-us-*.html')):
 q=p.with_name(p.name.replace('db-us-','db-tw-'))
 if not q.exists():continue
 en=Links();zh=Links();en.feed(p.read_text('utf-8-sig'));zh.feed(q.read_text('utf-8-sig'))
 for k,values in en.links.items():
  zhs=zh.links.get(k,set())
  if len(values)==len(zhs)==1:
   a=next(iter(values));b=next(iter(zhs))
   if re.search('[\u3400-\u9fff]',b) and a!=b:pairs.append({'en':a,'zh':b,'source':'https://poe2db.tw/tw/'+k})
(root/'sources/db-pairs.json').write_text(json.dumps(pairs,ensure_ascii=False,indent=2),encoding='utf-8')
print('DB link pairs',len(pairs))
# Join nested trade data by ids, never by array position.
api={};official=[]
def align(a,b,kind,path=''):
 if isinstance(a,list) and isinstance(b,list):
  index={str(x['id']):x for x in b if isinstance(x,dict) and 'id'in x}
  for x in a:
   if isinstance(x,dict) and 'id'in x and str(x['id'])in index:align(x,index[str(x['id'])],kind,path+'/'+str(x['id']))
 elif isinstance(a,dict) and isinstance(b,dict):
  for k,v in a.items():
   if k not in b:continue
   if isinstance(v,str) and isinstance(b[k],str) and k in ('text','label','title','description','placeholder') and re.search('[\u3400-\u9fff]',b[k]):
    source='https://pathofexile.tw/api/trade2/data/'+kind+'#'+path+'/'+k
    official.append({'en':v,'zh':b[k],'source':source})
    api[kind+path+'/'+k]={'en':v,'zh':b[k],'source':source}
   elif isinstance(v,(dict,list)):align(v,b[k],kind,path+'/'+k)
for kind in ['stats','filters','static','items']:
 a=json.loads((root/f'sources/trade-{kind}-en.json').read_text('utf-8-sig'));b=json.loads((root/f'sources/trade-{kind}-tw.json').read_text('utf-8-sig'));align(a,b,kind)
(root/'sources/official-pairs.json').write_text(json.dumps(official,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'sources/api-labels.json').write_text(json.dumps(api,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Official ID label pairs',len(api))
