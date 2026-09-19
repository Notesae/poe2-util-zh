/* Isolated DOM localization: never intercepts requests or changes form values. */
(() => {
 'use strict';
 const registry=POE2_MODULES, originals=new Map(), missing=new Set();
 const skip='script,style,noscript,code,pre,textarea,input,option,[contenteditable]:not([contenteditable="false"]),[translate="no"],.notranslate,[data-poe2zh-skip],.accountName,.account-name,.characterName,.character-name,.username,.author,.postContent,.forumPost,.comment-body,a[href*="/account/view-profile/"],a[href*="/character/"],a[href*="/user/"]';
 let raw={},id=null,current=null,engine=null,ui={},timer,observer,translated=0;
 function lookup(text){
  const trimmed=text.trim(),clean=POE2ZH.norm(trimmed);
  let zh=ui[clean]||ui[clean.replace(/:$/,'')];
  if(zh&&clean.endsWith(':'))zh+=':';
  if(!zh)zh=engine.lookup(trimmed)?.zh;
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
 function restore(){
  for(const [target,entries]of originals)for(const [attr,entry]of entries){
   const value=attr?target.getAttribute(attr):target.nodeValue;
   if(value===entry.after){if(attr)target.setAttribute(attr,entry.before);else target.nodeValue=entry.before}
  }
  originals.clear();translated=0;missing.clear();
 }
 function scan(){
  if(!current?.enabled||!document.body)return;
  observer.disconnect();
  for(const target of originals.keys())if(!target.isConnected)originals.delete(target);
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement?.closest(skip)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let node;while(node=walker.nextNode())replace(node,null);
  for(const el of document.querySelectorAll('[placeholder],[aria-label],[title]')){
   if(el.closest(skip)&&!el.matches('input[placeholder]'))continue;
   for(const attr of ['placeholder','aria-label','title'])replace(el,attr);
  }
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
 }
 function configure(){
  const nextId=registry.match(location.href),next=nextId&&nextId!=='trade'?registry.settings(raw,nextId):null;
  if(id===nextId&&JSON.stringify(next)===JSON.stringify(current))return;
  observer.disconnect();restore();id=nextId;current=next;
  if(!current)return;
  ui={...POE2_COMMON_UI,...POE2_SITE_UI[id]};
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
