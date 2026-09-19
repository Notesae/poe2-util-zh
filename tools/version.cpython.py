import pathlib
p=pathlib.Path('tools/build-data.py');s=p.read_text('utf-8-sig').replace("data={'version':'2026-09-19'", "data={'version':(root/'sources/version.txt').read_text('utf-8-sig').strip()");p.write_text(s,encoding='utf-8')
p=pathlib.Path('tools/update-data.py');s=p.read_text('utf-8-sig').replace("subprocess.run(['tar'", "(root/'sources/version.txt').write_text(datetime.date.today().isoformat(),encoding='utf-8')\nsubprocess.run(['tar'");p.write_text(s,encoding='utf-8')
pathlib.Path('sources/version.txt').write_text('2026-09-19',encoding='utf-8')
