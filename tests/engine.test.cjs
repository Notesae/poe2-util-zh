const assert=require('node:assert/strict');
require('../extension/data.js');const {create}=require('../extension/engine.js');const e=create(POE2_ZH_DATA.records);
for(const text of ['Search','Stat Filters','+# to maximum Life','+100 to maximum Life','35% increased Physical Damage','Adds 12 to 24 Fire Damage','Adds # to # Fire Damage','Exalted Orb']){assert.notEqual(e.display(text),text,text);console.log(text,'=>',e.display(text))}
assert.equal(e.display('Totally unknown affix 123'),'Totally unknown affix 123');
const raw={result:[{id:'explicit',label:'Explicit',entries:[{id:'explicit.stat_1',text:'+# to maximum Life',option:{options:[{id:1,text:'Search'}]}}]}]};const result=e.data(raw,'stats');assert.equal(result.result[0].entries[0].id,'explicit.stat_1');assert.equal(result.result[0].entries[0].option.options[0].id,1);assert.equal(raw.result[0].entries[0].text,'+# to maximum Life');assert.match(result.result[0].entries[0].text,/最大生命/);
const item=e.data({result:[{entries:[{name:'Cloak of Flame',type:'Silk Robe',text:'Cloak of Flame Silk Robe'}]}]},'items').result[0].entries[0];assert.equal(item.name,'Cloak of Flame');assert.equal(item.type,'Silk Robe');assert.match(item.text,/烈炎/);
const test=create([{en:'From {0} to {1}',zh:'從 {1} 到 {0}',source:'test'},{en:'Repeat {0} and {0}',zh:'重複 {0}',source:'test'}]);assert.equal(test.display('From 12 to 34'),'從 34 到 12');assert.equal(test.display('Repeat 12 and 34'),'Repeat 12 and 34');
console.log('PASS: values, repeated placeholders, source matches, canonical item fields and stat/option ids');
