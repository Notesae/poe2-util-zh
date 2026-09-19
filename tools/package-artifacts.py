import pathlib,zipfile,json,hashlib,py_compile
root=pathlib.Path.cwd();out=root/'dist';out.mkdir(exist_ok=True)
tools=['build-data.py','collect-pairs.py','collect-mods.cjs','collect-extra.cjs','coverage.cjs','item-coverage.cjs','update-data.py','snapshot.py']
tests=['engine.test.cjs','data-coverage.test.cjs','browser.test.cjs','extension.test.cjs','sites.test.cjs','live-sites-check.cjs','live-sites-check.json']
for name in tools:
 if name.endswith('.py'):py_compile.compile(str(root/'tools'/name),doraise=True)
installer=list((root/'extension').glob('*'))+[root/'README.md',root/'SOURCES.md']
source=installer+[root/'package.json']+[root/'tools'/n for n in tools]+[root/'tests'/n for n in tests]
source += [p for p in (root/'sources').iterdir() if p.suffix in ('.csv','.json','.txt') and p.name not in ('charm-tree.json',)]
source += [root/'poe2-trade-tw/json/translate.json',root/'poe2-trade-tw/json/translate.zh_TW.json']
for name,files in [('poe2-trade-zh.zip',installer),('poe2-trade-zh-source.zip',source)]:
 path=out/name
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in files:z.write(p,p.relative_to(root).as_posix())
 with zipfile.ZipFile(path)as z:
  assert z.testzip() is None
  manifest=json.loads(z.read('extension/manifest.json').decode('utf-8-sig'))
  for script in manifest['content_scripts']:
   for p in script['js']:assert 'extension/'+p in z.namelist()
 print(name,path.stat().st_size,'bytes',hashlib.sha256(path.read_bytes()).hexdigest())
