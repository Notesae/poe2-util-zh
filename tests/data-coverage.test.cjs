const assert=require('node:assert/strict');require('../extension/data.js');const e=require('../extension/engine.js').create(POE2_ZH_DATA.records,POE2_ZH_DATA.apiLabels);
const stats=require('../sources/trade-stats-en.json').result.flatMap(x=>x.entries),items=require('../sources/trade-items-en.json').result.flatMap(x=>x.entries).filter(x=>!x.type.startsWith('[DNT]'));
assert.equal(stats.filter(x=>!e.lookup(x.text)).length,0,'Every current stat must have a sourced match');
assert.equal(items.filter(x=>!e.lookup(x.type)||(x.name&&!e.lookup(x.name))).length,0,'Every visible item name/base must have a sourced match');
const filterData=require('../sources/trade-filters-en.json'),translated=e.data(filterData,'filters');
function check(a,b){if(!a||typeof a!=='object')return;for(const[k,v]of Object.entries(a)){if(['id','type','name'].includes(k)&&typeof v!=='object')assert.deepEqual(b[k],v);else if(v&&typeof v==='object')check(v,b[k]);else if(['text','label','title'].includes(k)&&typeof v==='string')assert.match(b[k],/[\u3400-\u9fff]/)}}check(filterData,translated);
for(const row of POE2_ZH_DATA.records){assert(row.source);assert(!row.zh.includes('\ufffd'),'No replacement characters');}
console.log(`PASS source-backed coverage: ${stats.length} stats, ${items.length} player-visible items, all filter labels; canonical filter fields preserved`);
