const assert=require('node:assert/strict');
require('../extension/data.js');const {create}=require('../extension/engine.js');const e=create(POE2_ZH_DATA.records);
for(const text of ['Search','Stat Filters','+# to maximum Life','+100 to maximum Life','35% increased Physical Damage','Adds 12 to 24 Fire Damage','Adds # to # Fire Damage','Exalted Orb']){assert.notEqual(e.display(text),text,text);console.log(text,'=>',e.display(text))}
assert.equal(e.display('Totally unknown affix 123'),'Totally unknown affix 123');
const raw={result:[{id:'explicit',label:'Explicit',entries:[{id:'explicit.stat_1',text:'+# to maximum Life',option:{options:[{id:1,text:'Search'}]}}]}]};const result=e.data(raw,'stats');assert.equal(result.result[0].entries[0].id,'explicit.stat_1');assert.equal(result.result[0].entries[0].option.options[0].id,1);assert.equal(raw.result[0].entries[0].text,'+# to maximum Life');assert.match(result.result[0].entries[0].text,/最大生命/);
const item=e.data({result:[{entries:[{name:'Cloak of Flame',type:'Silk Robe',text:'Cloak of Flame Silk Robe'}]}]},'items').result[0].entries[0];assert.equal(item.name,'Cloak of Flame');assert.equal(item.type,'Silk Robe');assert.match(item.text,/烈炎/);
const test=create([{en:'From {0} to {1}',zh:'從 {1} 到 {0}',source:'test'},{en:'Repeat {0} and {0}',zh:'重複 {0}',source:'test'}]);assert.equal(test.display('From 12 to 34'),'從 34 到 12');assert.equal(test.display('Repeat 12 and 34'),'Repeat 12 and 34');
console.log('PASS: values, repeated placeholders, source matches, canonical item fields and stat/option ids');
// 无参原文不能匹配含参译文，大小写回退也必须拒绝；完整双参数词缀保留真实数值。
assert.equal(e.lookup('your maximum Life as Physical damage per second'),null);
assert.equal(e.lookup('YOUR MAXIMUM LIFE AS PHYSICAL DAMAGE PER SECOND'),null);
assert.equal(e.display('Inflict Corrupted Blood for 5 seconds on Block, dealing 50% of your maximum Life as Physical damage per second'),'格擋時對目標造成持續5秒的腐化之血，每秒造成等同於你最大生命50%的物理傷害');
// 编年史职业名优先于旧同形词；历史技能名与改名后的技能保持分别配对。
for(const [en,zh]of [['Invoker','祈靈者'],['Lineage Supports','族裔輔助寶石'],['Chaotic Infusion','混沌灌注'],['Chaotic Surge','混沌波動']])assert.equal(e.display(en),zh);
for(const range of ['(20-25)','(20—25)','(20–25)','20-25','(-20--10)','(1.5-2.5)'])assert.equal(e.display(range+'% Chance to gain a Charge when you kill an enemy'),'殺死敵人時有'+range+'%機率獲得一顆充能');
assert.equal(e.display('Used when you become Ignited'),'當你被點燃時使用');
console.log('PASS: parenthesized, signed and decimal numeric ranges');
for(const [en,zh]of [['+(10-19) to maximum Life','+(10-19)最大生命'],['+(6-10)% to Fire Resistance','+(6-10)% 火焰抗性'],['+(6-10)% to Cold Resistance','+(6-10)% 冰冷抗性']])assert.equal(e.display(en).replace(/\s/g,''),zh.replace(/\s/g,''));
console.log('PASS: signed parenthesized Mobalytics modifier ranges');
assert.equal(e.display('Marks from Supported Skills are not Consumed the\nfirst time they Activate'),'被輔助的技能造成的印記在第一次啟動時不會被消耗');
// 当前值与可变区间必须是一个参数，不丢失括号、符号和数值。
for(const value of ['7(5-10)','7(5–10)','7.5(5.0-10.0)'])assert.equal(e.display(value+'% of Damage is taken from Mana before Life'),'生命值所受的'+value+'%傷害由魔力扣除');
assert.equal(e.display('7(5-10)% unrelated text'),'7(5-10)% unrelated text');
// 重复 sep 标记不得让类别标题串译，API 与普通 DOM 使用相同配对。
assert.equal(e.display('Omens'),'預兆');assert.equal(e.display('Idols'),'魔偶');assert.equal(e.display('Augments'),'增幅');
const staticEngine=create(POE2_ZH_DATA.records,POE2_ZH_DATA.apiLabels);
const separators=staticEngine.data({result:[{id:'Ritual',entries:[{id:'sep',text:'Omens'},{id:'sep',text:'Augments'},{id:'sep',text:'Idols'}]}]},'static');
assert.deepEqual(separators.result[0].entries.map(row=>row.text),['預兆 (Omens)','增幅 (Augments)','魔偶 (Idols)']);
// 来源中文固定为 5%，不能把其他几率也套成 5%。
assert.equal(e.display('Hits with this Weapon have 5% chance to Trigger Molten Shower per 25 Strength'),'每25力量，此武器造成的擊中有5%機率觸發熔火噴濺');
assert.equal(e.display('Hits with this Weapon have 6% chance to Trigger Molten Shower per 25 Strength'),'Hits with this Weapon have 6% chance to Trigger Molten Shower per 25 Strength');
