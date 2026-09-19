/* Isolated DOM localization: never intercepts requests or changes form values. */
(() => {
 'use strict';
 const registry=POE2_MODULES, originals=new Map(), missing=new Set();
 const skip='script,style,noscript,code,pre,textarea,input,option,[contenteditable]:not([contenteditable="false"]),[translate="no"],.notranslate,[data-poe2zh-skip],.accountName,.account-name,.characterName,.character-name,.username,.author,.postContent,.forumPost,.comment-body,a[href*="/account/view-profile/"],a[href*="/character/"],a[href*="/user/"]';
 let raw={},id=null,current=null,engine=null,ui={},uiLower={},timer,observer,translated=0;
 function lookup(text){
  const trimmed=text.trim(),clean=POE2ZH.norm(trimmed);
  let zh=ui[clean]||ui[clean.replace(/:$/,'')]||uiLower[clean.toLowerCase().replace(/:$/,'')];
  if(zh&&clean.endsWith(':'))zh+=':';
  if(!zh)zh=engine.lookup(trimmed)?.zh;
  if(!zh&&id==='mobalytics'){
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
   if(!zh&&/^(Bow|Quiver|Spear|Sceptre|Unarmed|Unknown|Shield|Focus|Wand|Staff|Crossbow)( \/ (Bow|Quiver|Spear|Sceptre|Unarmed|Unknown|Shield|Focus|Wand|Staff|Crossbow))+$/.test(clean)){
    const parts=clean.split(' / ').map(x=>engine.lookup(x)?.zh);if(parts.every(Boolean))zh=parts.join('／');
   }
   const count=/^Found\s+([\d,]+)\s+characters\.$/.exec(clean);if(count)zh='找到 '+count[1]+' 個角色。';
   const time=/^(Week|Day|Hour) (\d+)$/.exec(clean);if(time)zh='第 '+time[2]+({Week:' 週',Day:' 天',Hour:' 小時'}[time[1]]);
  }
  if(!zh||zh===trimmed)return null;
  return text.replace(trimmed,zh+(current.bilingual?' ('+trimmed+')':''));
 }
 function replace(target,attr){
  const value=attr?target.getAttribute(attr):target.nodeValue;if(!value?.trim())return;
  let entries=originals.get(target),entry=entries?.get(attr);
  if(entry&&entry.after===value)return;
  if(entry){entries.delete(attr);if(!entries.size)originals.delete(target)}
  const next=lookup(value);
  if(!next){if(value.length<180&&/[a-z]{3}/i.test(value)&&missing.size<1000)missing.add(value.trim());return}
  if(!entries)entries=new Map();entries.set(attr,{before:value,after:next});originals.set(target,entries);
  if(attr)target.setAttribute(attr,next);else target.nodeValue=next;
  translated++;
 }
 function restore(reset=true){
  for(const [target,entries]of originals)for(const [attr,entry]of entries){
   const value=attr?target.getAttribute(attr):target.nodeValue;
   if(value===entry.after){if(attr)target.setAttribute(attr,entry.before);else target.nodeValue=entry.before}
  }
  originals.clear();if(reset){translated=0;missing.clear()}
 }
 function sentences(){
  const handled=new WeakSet();
  // Match complete phrasing containers before translating individual keywords.
  // Keep every original node so framework updates and disabling remain reversible.
  for(const el of document.body.querySelectorAll('div,p,span,li,td')){
   if(el.closest(skip)||handled.has(el.firstChild)||!el.children.length)continue;
   if(el.querySelector('div,p,li,table,button,input,textarea,select,a,svg,img,'+skip))continue;
   if(el.textContent.length>800)continue;
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];let node;
   while(node=walker.nextNode())nodes.push(node);
   if(nodes.length<2||nodes.some(n=>handled.has(n)))continue;
   const text=el.innerText||el.textContent,next=lookup(text);if(!next)continue;
   nodes.forEach((target,i)=>{
    const after=i===0?next:'';originals.set(target,new Map([[null,{before:target.nodeValue,after}]]));
    target.nodeValue=after;handled.add(target);
   });
   translated++;
  }
  return handled;
 }
 function scan(){
  if(!current?.enabled||!document.body)return;
  observer.disconnect();
  // Reconstruct English first, including after a tooltip reuses just one span.
  if(id==='ninja'||id==='mobalytics')restore(false);
  for(const target of originals.keys())if(!target.isConnected)originals.delete(target);
  const handled=id==='ninja'||id==='mobalytics'?sentences():new WeakSet();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement?.closest(skip)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let node;while(node=walker.nextNode())if(!handled.has(node))replace(node,null);
  for(const el of document.querySelectorAll('[placeholder],[aria-label],[title]')){
   if(el.closest(skip)&&!el.matches('input[placeholder]'))continue;
   for(const attr of ['placeholder','aria-label','title'])replace(el,attr);
  }
  // Explicit option values remain canonical even when their display label changes.
  if(id==='ninja')for(const option of document.querySelectorAll('select option[value]')){
   if(option.closest('[translate="no"],[data-poe2zh-skip]'))continue;
   for(const node of option.childNodes)if(node.nodeType===3)replace(node,null);
  }
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
 }
 function configure(){
  const nextId=registry.match(location.href),next=nextId&&nextId!=='trade'?registry.settings(raw,nextId):null;
  if(id===nextId&&JSON.stringify(next)===JSON.stringify(current))return;
  observer.disconnect();restore();id=nextId;current=next;
  if(!current)return;
  ui={...POE2_COMMON_UI,...POE2_SITE_UI[id]};
  uiLower=Object.fromEntries(Object.entries(ui).map(([en,zh])=>[en.toLowerCase(),zh]));
  if(!engine)engine=POE2ZH.create(POE2_ZH_DATA.records);
  scan();
 }
 observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,80)});
 chrome.storage.local.get(null).then(value=>{raw=value;configure()});
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
