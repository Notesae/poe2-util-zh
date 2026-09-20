/* 隔离式 DOM 翻译：不拦截请求；仅允许制作器两个已验证的 init 提示值，保护用户输入。 */
(() => {
 'use strict';
 const registry=POE2_MODULES, originals=new Map(), missing=new Set();
 // 合并一批 DOM 变更的扫描范围，避免每次变更都遍历整个页面。
 const pending=new Set();
 const skip='script,style,noscript,code,pre,textarea,input,option,[contenteditable]:not([contenteditable="false"]),[translate="no"],.notranslate,[data-poe2zh-skip],.accountName,.account-name,.characterName,.character-name,.username,.author,.postContent,.forumPost,.comment-body,a[href*="/account/view-profile/"],a[href*="/character/"],a[href*="/user/"]';
 // 表单值继续跳过，只允许翻译未受显式保护的表单辅助属性。
 const attributeSkip=skip.split(',').filter(selector=>!['input','textarea'].includes(selector)).join(',');
 // 旧版制作器仅这两个输入框把固定提示存于 value；其他输入值始终不翻译。
 const craftHints={'poecSearchBaseInput':'Search for a base or item','poecSearchAffixInput':'Search for an affix'};
 let raw={},id=null,current=null,engine=null,ui={},uiLower={},timer,observer,translated=0;
 // 先按实际组件匹配局部语义，再查站点 UI、动态模板与游戏词库。
 function lookup(text,element=null){
  const trimmed=text.trim(),clean=POE2ZH.norm(trimmed);
  let scoped=null;
  // 新品徽标属于链接说明，不应使用排序的“最新”；按钮仍按排序词表处理。
  if(id==='mobalytics'&&clean==='New'&&element?.closest('a[href]'))scoped='新';
  if(id==='craft'&&element){
   if(element.closest('#instructions')){
    scoped=Object.hasOwn(POE2_CRAFT_INSTRUCTIONS,clean)?POE2_CRAFT_INSTRUCTIONS[clean]:null;
    // 未收录的说明片段保留英文，不能退回单词替换制造半句中文。
    if(!scoped)return null;
   }
   if(element.closest('#groupTypeChooser')&&/^(And|Or|Not)$/.test(clean))scoped=({And:'全部符合',Or:'任一符合',Not:'不符合'})[clean];
   if(element.closest('#calculatorZone .requirements')&&clean==='Requirements')scoped='計算條件';
   if(element.closest('#categoriesSelector')&&clean==='Relic')scoped=engine.lookup('Relics')?.zh;
   // 实页需求为 80<span class="label">, Int</span> 121，只替换属性名，数值留在原节点。
   const requirement=element.closest('.property'),attribute=/^(,\s*)?(Str|Dex|Int)$/.exec(clean);
   if(attribute&&/^(?:Requires level|需求等級)[:：]/i.test(requirement?.querySelector(':scope > label')?.textContent.trim()||''))scoped=(attribute[1]||'')+({Str:'力量',Dex:'敏捷',Int:'智慧'}[attribute[2]]);
   // 只在词缀标签筛选器中识别否定前缀，不扩展到任意正文。
   if(element.closest('#filterSelector')&&/^Non-(Ailment|Armour|Attribute|Aura|Caster|Chaos|Cold|Critical|Curse|Damage|Elemental|Energy Shield|Evasion|Fire|Life|Lightning|Mana|Physical|Resistance)$/.test(clean)){
    const term=clean.slice(4),translated=uiLower[term.toLowerCase()]||engine.lookup(term)?.zh;
    if(translated)scoped='非'+translated;
   }
  }
  // 单独连接词不是完整界面标签，禁止从游戏词库翻译正文碎片。
  if(!scoped&&/^(and|or|not|hit)$/i.test(clean))return null;
  // 只读取词表自身键；界面标签允许大小写和中英文冒号差异。
  const label=clean.replace(/[:：]$/,'').toLowerCase();
  let zh=scoped||(Object.hasOwn(ui,clean)?ui[clean]:Object.hasOwn(uiLower,label)?uiLower[label]:null);
  if(zh&&/[:：]$/.test(clean))zh+='：';
  // 已知界面标签后只接受数值、百分比和数值范围，避免把任意正文误当属性。
  const numeric=/^([^:：]+)[:：]\s*([+\-]?[\d,.]+%?(?:\s*[-/–—]\s*[+\-]?[\d,.]+%?)*)$/.exec(clean);
  if(!zh&&numeric&&Object.hasOwn(uiLower,numeric[1].trim().toLowerCase()))zh=uiLower[numeric[1].trim().toLowerCase()]+'：'+numeric[2];
  if(!zh)zh=dynamicLabel(clean);
  if(!zh)zh=engine.lookup(trimmed)?.zh;
  if(!zh&&id==='mobalytics'){
   // 仅处理已确认的站点别名，译文仍读取有来源的完整游戏词条。
   const alias=clean==='Witch Hunter'?'Witchhunter':clean==='Acolyte'?'Acolyte of Chayula':null;
   if(alias)zh=engine.lookup(alias)?.zh;
   const property=/^(Cast Time|Cooldown Time|Mana Cost|Cost|Reservation|Cost Multiplier):\s*(\d+(?:\.\d+)?%?)(?:\s*(seconds?|sec|s))?$/i.exec(clean);
   if(property){const label=uiLower[property[1].toLowerCase()];if(label)zh=label+'：'+property[2]+(property[3]?' 秒':'')}
   const requirement=/^Requires:\s*(\d+)\s+Level\.?$/i.exec(clean);
   if(requirement)zh='需求：等級 '+requirement[1];
   const set=/^Set (\d+)$/.exec(clean);if(set)zh='第 '+set[1]+' 組';
   const act=/^Act (\d+)$/.exec(clean);if(act)zh='第 '+act[1]+' 章';
  }
  if(!zh&&id==='ninja'){
   const rarity=/^(Normal|Magic|Rare) (Charm|Belt|Quiver|Amulet|Ring|Helmet|Gloves|Boots|Body Armour|Weapon|Jewel|Flask|Shield|Focus|Bow|Spear|Sceptre)$/.exec(clean);
   if(rarity){const a=engine.lookup(rarity[1]),b=engine.lookup(rarity[2]);if(a&&b)zh=a.zh+b.zh}
   if(!zh&&/^(Two Handed Mace|Bow|Quiver|Spear|Sceptre|Unarmed|Unknown|Shield|Focus|Wand|Staff|Crossbow)( \/ (Two Handed Mace|Bow|Quiver|Spear|Sceptre|Unarmed|Unknown|Shield|Focus|Wand|Staff|Crossbow))+$/.test(clean)){
    const parts=clean.split(' / ').map(x=>engine.lookup(x==='Two Handed Mace'?'Two-Handed Mace':x)?.zh);if(parts.every(Boolean))zh=parts.join('／');
   }
   const count=/^Found\s+([\d,]+)\s+characters\.$/.exec(clean);if(count)zh='找到 '+count[1]+' 個角色。';
   const time=/^(Week|Day|Hour) (\d+)$/.exec(clean);if(time)zh='第 '+time[2]+({Week:' 週',Day:' 天',Hour:' 小時'}[time[1]]);
  }
  if(!zh||zh===trimmed)return null;
  return text.replace(trimmed,zh+(current.bilingual?' ('+trimmed+')':''));
 }
 // 动态界面只匹配封闭模板，未知正文、作者名和数值均保持不变。
 function dynamicLabel(text){
  let match;
  if(['pobb','mobalytics'].includes(id)){
   match=/^(\d+) (second|minute|hour|day|week|month|year)s? ago$/.exec(text);
   if(match)return match[1]+({second:' 秒',minute:' 分鐘',hour:' 小時',day:' 天',week:' 週',month:' 個月',year:' 年'}[match[2]])+'前';
  }
  if(id==='mobalytics'){
   if(match=/^Show ([\d,]+) results$/.exec(text))return '顯示 '+match[1]+' 筆結果';
   if(match=/^([\d,.]+(?:\s*[KM])?) Favorites$/.exec(text))return match[1]+' 次收藏';
   if(match=/^(\d+) choices$/.exec(text))return match[1]+' 個選項';
   if(match=/^(?:(\d+) characters remaining|Characters remain: (\d+))$/.exec(text))return '剩餘 '+(match[1]||match[2])+' 字';
   if(match=/^(\d+)([dhm]) ago$/.exec(text))return match[1]+({d:' 天',h:' 小時',m:' 分鐘'}[match[2]])+'前';
   if(match=/^([SABCD]) Tier$/.exec(text))return match[1]+' 級';
   if(match=/^set ([12]):$/i.exec(text))return '第 '+match[1]+' 組：';
   // 任务奖励仅组合已验证的两类词缀，不泛化拆分任意带逗号的正文。
   if(/^\d+(?:\.\d+)?% increased (?:Charm Charges gained|Charm Effect Duration|Skill Effect Duration), \+\d+ Charm Slots?$/.test(text)){
    const rewards=text.split(', ').map(part=>engine.lookup(part)?.zh);
    if(rewards.every(Boolean))return rewards.join('，');
   }
   // 只翻译词库已知技能；保留可选技能等级，旧技能名按历史来源翻译而非改成新版名。
   if(match=/^Grants Skill: (?:Level (\d+|\(\d+[-–—]\d+\)) )?([A-Za-z][A-Za-z '\-]+)$/.exec(text)){
    const skill=engine.lookup(match[2]);if(skill)return '賦予技能：'+(match[1]?'等級 '+match[1]+' ':'')+skill.zh;
   }
  }
  if(id==='craft'){
   if(match=/^(Body Armours?) \((BASE|(?:DEX|INT|STR)(?:[\s/]+(?:DEX|INT|STR))*)\)$/.exec(text))return '胸甲（'+match[2]+'）';
   if(match=/^Executed in ([\d.]+) (?:seconds?|秒)$/.exec(text))return '執行耗時 '+match[1]+' 秒';
  }
  if(id==='official'){
   if(match=/^(\d+)% Off$/.exec(text))return '折扣 '+match[1]+'%';
   if(match=/^(\d+) viewers?$/.exec(text))return match[1]+' 人觀看';
   if(match=/^Ends in (\d+) (day|hour|minute)s?$/.exec(text))return match[1]+({day:' 天',hour:' 小時',minute:' 分鐘'}[match[2]])+'後結束';
   // 商品名原样保留，只翻译固定折扣句尾；数值和点数单位不参与换算。
   if(match=/^(.{1,160}) discounted to ([\d,]+) Points$/.exec(text))return match[1]+' 特價 '+match[2]+' 點數';
  }
  if(id==='pobb'&&text.includes(', ')){
   // 配置条目只识别已知状态和充能，未知自定义片段原样保留。
   const parts=text.split(', ').map(part=>{
    const state=/^(\d+)% (Shock)$/.exec(part),charge=/^(\d+)x (Frenzy|Power)$/.exec(part);
    if(state){const term=engine.lookup(state[2]);if(term)return state[1]+'% '+term.zh}
    if(charge){const term=engine.lookup(charge[2]+' Charge');if(term)return charge[1]+' 層'+term.zh}
    return part==='Custom Mods'?ui['Custom Mods']:part;
   });
   if(parts.some((part,index)=>part!==text.split(', ')[index]))return parts.join('，');
  }
  return null;
 }
 // 保存每个节点或属性的翻译前后值，供动态更新及关闭模块时精确恢复。
 function replace(target,attr){
  const value=attr==='value'?target.value:attr?target.getAttribute(attr):target.nodeValue;if(!value?.trim())return;
  let entries=originals.get(target),entry=entries?.get(attr);
  if(entry&&entry.after===value)return;
  if(entry){entries.delete(attr);if(!entries.size)originals.delete(target)}
  const next=lookup(value,attr?target:target.parentElement);
  if(!next){if(value.length<180&&/[a-z]{3}/i.test(value)&&missing.size<1000)missing.add(value.trim());return}
  if(!entries)entries=new Map();entries.set(attr,{before:value,after:next});originals.set(target,entries);
  if(attr==='value')target.value=next;else if(attr)target.setAttribute(attr,next);else target.nodeValue=next;
  translated++;
 }
 // 设置切换时恢复全部原文；增量扫描时只恢复当前子树中保存的原文。
 function restore(reset=true,root=null){
  if(root){
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_ALL);
   let target=root;
   do{
    const entries=originals.get(target);if(!entries)continue;
    for(const [attr,entry]of entries){
     const value=attr==='value'?target.value:attr?target.getAttribute(attr):target.nodeValue;
     if(value===entry.after){if(attr==='value')target.value=entry.before;else if(attr)target.setAttribute(attr,entry.before);else target.nodeValue=entry.before}
    }
    originals.delete(target);
   }while(target=walker.nextNode());
   return;
  }
  for(const [target,entries]of originals)for(const [attr,entry]of entries){
   const value=attr==='value'?target.value:attr?target.getAttribute(attr):target.nodeValue;
   if(value===entry.after){if(attr==='value')target.value=entry.before;else if(attr)target.setAttribute(attr,entry.before);else target.nodeValue=entry.before}
  }
  originals.clear();if(reset){translated=0;missing.clear()}
 }
 // 在局部子树内优先匹配完整句子，保留框架拥有的节点以支持数值更新。
 function sentences(root){
  const handled=new WeakSet();
  // 物品表只配对三种已确认的两段词缀；完整句须命中来源词库，不合并任意相邻属性。
  if(id==='mobalytics')for(const list of [root,...root.querySelectorAll('ul,ol')]){
   if(!list.matches('ul,ol')||!list.closest('main table')||list.closest(skip))continue;
   const items=[...list.children];
   for(let i=0;i<items.length-1;i++){
    const first=items[i],second=items[i+1];
    // 真实编辑器用 li > span 包装文字；只允许纯文本 span，不跨链接、上标或禁译区合并。
    if(!first.matches('li')||!second.matches('li')||[first,second].some(item=>item.querySelector(':not(span)')||item.querySelector(skip)))continue;
    const a=first.textContent.trim(),b=second.textContent.trim();
    const lightning=a==='On Hitting an enemy, gains maximum added Lightning damage equal to'&&/^the enemy's Power for 20 seconds, up to a total of [\d,]+$/.test(b);
    const ammunition=/^Bolts fired by Crossbow Attacks have \d+(?:\.\d+)?% chance to not$/.test(a)&&b==="expend Ammunition if you've Reloaded Recently";
    const blood=/^Inflict Corrupted Blood for \d+ seconds on Block, dealing \d+% of$/.test(a)&&b==='your maximum Life as Physical damage per second';
    if((!lightning&&!ammunition&&!blood)||first.closest(skip)||second.closest(skip))continue;
    // 从完整来源译文按语义边界分成两段，每项保留非空内容，避免编辑器将空项重建为 br。
    const complete=engine.lookup(a+' '+b)?.zh;if(!complete)continue;
    const parts=(lightning?/^(.+，)(最高總計.+)$/:ammunition?/^(.+)(不會消耗彈藥)$/:/^(.+，)(每秒造成.+)$/).exec(complete);
    if(!parts)continue;
    const groups=[first,second].map(item=>{const nodes=[],walker=document.createTreeWalker(item,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())if(node.nodeValue.trim())nodes.push(node);return nodes});
    // 多文本节点的富文本不压平；只有已验证的每项一个文本节点才原位替换。
    if(groups.some(nodes=>nodes.length!==1))continue;
    groups.forEach(([target],index)=>{
     const before=target.nodeValue,trimmed=before.trim();
     const after=before.replace(trimmed,parts[index+1]+(current.bilingual?' ('+trimmed+')':''));
     originals.set(target,new Map([[null,{before:target.nodeValue,after}]]));
     target.nodeValue=after;handled.add(target);
    });
    translated++;i++;
   }
  }
  // Match complete phrasing containers before translating individual keywords.
  // Keep every original node so framework updates and disabling remain reversible.
  for(const el of [root,...root.querySelectorAll('div,p,span,li,td')]){
   if(!el.matches('div,p,span,li,td'))continue;
   // React 可能把标点拆为相邻文本节点：即便没有子元素，也需要完整匹配。
   if(el.closest(skip)||handled.has(el.firstChild)||el.childNodes.length<2)continue;
   // 上下标、快捷键及语义数值组件必须保持自己的文本和样式，不能整句压平。
   if(el.querySelector('div,p,li,table,button,input,textarea,select,a,svg,img,sup,sub,kbd,time,meter,progress,'+skip))continue;
   if(el.textContent.length>800)continue;
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];let node;
   while(node=walker.nextNode())nodes.push(node);
   if(nodes.length<2||nodes.some(n=>handled.has(n)))continue;
   const text=el.innerText||el.textContent,next=lookup(text,el);if(!next)continue;
   nodes.forEach((target,i)=>{
    const after=i===0?next:'';originals.set(target,new Map([[null,{before:target.nodeValue,after}]]));
    target.nodeValue=after;handled.add(target);
   });
   translated++;
  }
  return handled;
 }
 // 初次加载和设置变化扫描全页，普通 DOM 更新仅扫描合并后的变动子树。
 function scan(roots=[document.body]){
  if(!current?.enabled||!document.body)return;
  observer.disconnect();
  for(const root of roots){
   if(!root.isConnected)continue;
   restore(false,root);
   // handled 记录已整句翻译的节点，walker 只访问当前范围的其余文本。
   const handled=sentences(root);
   // 只写入未聚焦且处于提示状态的已知 value，不改默认值、initerm 或用户搜索词。
   if(id==='craft')for(const input of [root,...root.querySelectorAll('input.init')]){
    if(input.matches('input.init')&&Object.hasOwn(craftHints,input.id)&&input.value===craftHints[input.id]&&document.activeElement!==input&&!input.closest(attributeSkip))replace(input,'value');
   }
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement?.closest(skip)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
   let node;while(node=walker.nextNode())if(!handled.has(node))replace(node,null);
   for(const el of [root,...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')]){
    if(el.closest(attributeSkip))continue;
    for(const attr of ['placeholder','aria-label','title','alt'])replace(el,attr);
   }
   // 仅翻译有显式 value 的选项标签，保持筛选值不变。
   for(const option of [root,...root.querySelectorAll('select option[value]')].filter(el=>el.matches('select option[value]'))){
    if(option.closest('[translate="no"],[data-poe2zh-skip]'))continue;
    for(const node of option.childNodes)if(node.nodeType===3)replace(node,null);
   }
  }
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title','alt',...(id==='craft'?['class']:[])]});
 }
 function configure(){
  const nextId=registry.match(location.href),next=nextId&&nextId!=='trade'?registry.settings(raw,nextId):null;
  if(id===nextId&&JSON.stringify(next)===JSON.stringify(current))return;
  observer.disconnect();clearTimeout(timer);timer=null;pending.clear();restore();id=nextId;current=next;
  if(!current)return;
  ui={...POE2_COMMON_UI,...POE2_SITE_UI[id]};
  uiLower=Object.fromEntries(Object.entries(ui).map(([en,zh])=>[en.toLowerCase(),zh]));
  if(!engine)engine=POE2ZH.create(POE2_ZH_DATA.records);
  scan();
 }
 // 将文本变更提升到完整句子容器；新增顶层块单独处理，避免提升到 body。
 observer=new MutationObserver(changes=>{
  // 仅发生删除时清理失联节点，每批最多遍历一次原文记录。
  if(changes.some(change=>change.removedNodes.length))for(const target of originals.keys())if(!target.isConnected)originals.delete(target);
  for(const change of changes){
   // 制作器的聚焦／失焦以 class 标记提示状态；忽略其他元素的样式变动。
   if(change.type==='attributes'&&change.attributeName==='class'&&!Object.hasOwn(craftHints,change.target.id))continue;
   // body 下新增块作为独立根，其余变更保留父容器以重建完整句子。
   const nodes=change.type==='childList'&&change.target===document.body?change.addedNodes:[change.target];
   for(const node of nodes){
    let root=node.nodeType===3?node.parentElement:node;
    if(!root||root.nodeType!==1)continue;
    while(root.matches('span,b,strong,em,i,small,br')&&root.parentElement&&root.parentElement!==document.body)root=root.parentElement;
    // 跨 li 词缀的任一半更新时恢复并重扫同一列表，不能遗留另一半的旧译文。
    if(id==='mobalytics'&&root.closest('main table li'))root=root.closest('main table li').parentElement;
    if([...pending].some(parent=>parent.contains(root)))continue;
    for(const child of pending)if(root.contains(child))pending.delete(child);
    pending.add(root);
   }
  }
  // 固定批处理窗口，持续变动的页面也能及时显示译文。
  if(!timer&&pending.size)timer=setTimeout(()=>{timer=null;const roots=[...pending];pending.clear();scan(roots)},80);
 });
 chrome.storage.local.get(null).then(value=>{raw=value;configure()});
 // 捕获阶段先恢复提示，让网站自己的聚焦处理缓存英文原文，避免污染 initerm。
 document.addEventListener('focus',event=>{if(id==='craft'&&Object.hasOwn(craftHints,event.target.id))restore(false,event.target)},true);
 chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;for(const [key,value]of Object.entries(changes))raw[key]=value.newValue;configure()});
 const routeTimer=setInterval(configure,500);
 window.addEventListener('pagehide',event=>{if(!event.persisted){clearInterval(routeTimer);clearTimeout(timer);observer.disconnect()}});
 chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(message.type==='status')reply({module:id,enabled:!!current?.enabled,translated,missing:missing.size,records:POE2_ZH_DATA.records.length,version:POE2_ZH_DATA.version});
  if(message.type==='export'){
   const blob=new Blob([JSON.stringify({module:id,version:POE2_ZH_DATA.version,missing:[...missing]},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='poe2-'+(id||'site')+'-untranslated.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);reply({ok:true});
  }
 });
})();
