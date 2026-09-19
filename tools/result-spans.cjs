const fs=require('fs');let p='extension/main.js',s=fs.readFileSync(p,'utf8');s=s.replace(".price-value,[data-poe2zh-skip]'", ".price-value,[data-poe2zh-skip],[data-poe2zh-original]'");
const start=s.indexOf('function scan(root){');s=s.slice(0,start)+`
const resultCopies=new Map();
const resultSelector='.results [data-field],.results .explicitMod,.results .implicitMod,.results .enchantMod,.results .runeMod,.results .fracturedMod,.results .craftedMod';
function localizeResult(el){
 if(el.closest('[data-poe2zh-skip]'))return;
 const original=el.textContent.trim(),r=engine.lookup(original),previous=resultCopies.get(el);
 if(!r){if(previous){previous.remove();resultCopies.delete(el);el.removeAttribute('data-poe2zh-original')}return}
 let copy=previous;if(!copy){copy=document.createElement('span');copy.setAttribute('data-poe2zh-skip','');copy.className='poe2zh-result';resultCopies.set(el,copy);status.translated++}
 const text=r.zh+(settings.bilingual?' ('+original+')':'');if(copy.textContent!==text)copy.textContent=text;
 copy.title=original;el.setAttribute('data-poe2zh-original','');if(copy.previousSibling!==el)el.after(copy);
}
function cleanCopies(){for(const [el,copy]of resultCopies)if(!el.isConnected){copy.remove();resultCopies.delete(el)}}
`+s.slice(start);
s=s.replace("if(root.closest(skip))return;\n const walker", "const result=root.closest(resultSelector);if(result){localizeResult(result);return}\n if(root.closest(skip))return;\n for(const el of root.querySelectorAll(resultSelector))localizeResult(el);\n const walker");
s=s.replace("if(root.nodeType===3){translateNode(root);return}","if(root.nodeType===3){const result=root.parentElement?.closest(resultSelector);if(result)localizeResult(result);else translateNode(root);return}");
s=s.replace('function flush(){timer=null;', 'function flush(){timer=null;cleanCopies();');s=s.replace('function start(){scan(document.body);',`function start(){const style=document.createElement('style');style.textContent='[data-poe2zh-original]{display:none!important}.poe2zh-result{white-space:pre-line}';document.head.append(style);scan(document.body);`);
fs.writeFileSync(p,s);

