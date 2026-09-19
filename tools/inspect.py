import pathlib,json
s=pathlib.Path('sources/db-us-Jewels.html').read_text('utf-8-sig');i=s.find('Notable Passive Skills in Radius also grant');print(json.dumps(s[i-400:i+800],ensure_ascii=True))
