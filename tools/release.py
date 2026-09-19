"""Build installable release assets from a clean checkout, without downloads."""
import json
import os
import pathlib
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'extension/manifest.json').read_text('utf-8-sig'))
package = json.loads((root / 'package.json').read_text('utf-8-sig'))
if package['version'] != manifest['version']:
    raise SystemExit('package.json and manifest.json versions must match')
tag = os.environ.get('GITHUB_REF_NAME', '')
if os.environ.get('GITHUB_REF_TYPE') == 'tag' and tag != 'v' + manifest['version']:
    raise SystemExit('Tag must match extension version: v' + manifest['version'])
out = root / 'dist'
out.mkdir(exist_ok=True)
target = out / ('poe2-util-zh-' + manifest['version'] + '.zip')
files = sorted((root / 'extension').rglob('*')) + [root / 'README.md', root / 'SOURCES.md']
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in files:
        if file.is_file():
            archive.write(file, file.relative_to(root).as_posix())
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    for script in manifest['content_scripts']:
        for name in script['js']:
            assert 'extension/' + name in archive.namelist()
print(target)
