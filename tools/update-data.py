import argparse,concurrent.futures,datetime,hashlib,json,pathlib,subprocess,sys,urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--refresh',action='store_true');args=parser.parse_args()
manifest=json.loads((root/'sources/downloads.json').read_text('utf-8-sig'))
def download(row):
 dest=root/row['file']
 if dest.exists() and not args.refresh:return
 dest.parent.mkdir(parents=True,exist_ok=True)
 request=urllib.request.Request(row['url'],headers={'User-Agent':'PoE2TradeZh/0.1 source updater'})
 with urllib.request.urlopen(request,timeout=60) as response: data=response.read()
 dest.write_bytes(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(download,manifest))
(root/'sources/version.txt').write_text(datetime.date.today().isoformat(),encoding='utf-8')
subprocess.run(['tar','-xf','upstream.7z'],cwd=root,check=True)
backup=(root/'extension/data.js').read_bytes() if (root/'extension/data.js').exists() else None
try:
 for command in [[sys.executable,'tools/collect-pairs.py'],['node','tools/collect-mods.cjs'],['node','tools/collect-extra.cjs'],[sys.executable,'tools/build-data.py'],['node','tests/engine.test.cjs'],['node','tools/coverage.cjs'],['node','tools/item-coverage.cjs'],['node','tests/data-coverage.test.cjs']]:subprocess.run(command,cwd=root,check=True)
except BaseException:
 if backup is not None:(root/'extension/data.js').write_bytes(backup)
 raise
print('Updated dictionary; reload the unpacked extension and the trade page.')
