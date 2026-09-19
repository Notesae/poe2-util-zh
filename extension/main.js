(() => {
'use strict';
const settingsKey='poe2db-zh-settings-v1';
let settings;try{settings=JSON.parse(localStorage.getItem(settingsKey)||'{}')}catch{settings={}}
if(settings.enabled===false){
 for(const key of ['lscache-trade2items','lscache-trade2stats','lscache-trade2data','lscache-trade2filters']){localStorage.removeItem(key);localStorage.removeItem(key+'-cacheexpiration')}
 return;
}
const engine=POE2ZH.create(POE2_ZH_DATA.records,POE2_ZH_DATA.apiLabels), missing=new Set();
const status={translated:0,missing:0,records:POE2_ZH_DATA.records.length,version:POE2_ZH_DATA.version,api:0};
function report(){document.dispatchEvent(new CustomEvent('poe2db-zh-status',{detail:JSON.stringify({...status,missing:missing.size})}))}
function note(text){if(text.length<250&&/[a-z]{3}/i.test(text)&&missing.size<1000)missing.add(text)}
function kindOf(url){try{const u=new URL(url,location.href);return u.origin===location.origin&&u.pathname.match(/^\/api\/trade2\/data\/(items|stats|static|filters)\/?$/)?.[1]}catch{return null}}
// Translate existing native cache before the trade app mounts. Disabling clears only these regenerable caches.
try{

 for(const [key,kind]of Object.entries({'lscache-trade2items':'items','lscache-trade2stats':'stats','lscache-trade2data':'static','lscache-trade2filters':'filters'})){
  const current=localStorage.getItem(key);if(!current)continue;
  localStorage.setItem(key,JSON.stringify(engine.data(JSON.parse(current),kind)));
 }
}catch(e){console.warn('[PoE2 中文] Cache preparation failed',e)}
// Native UI translation dictionary. Preserve any existing site entries.
const ui={};for(const [en,r]of engine.exact)if(r.source.startsWith('poe2db-plugin:json/translate.zh_TW'))ui[en]=r.zh;
Object.assign(window.__||(window.__={}),ui);
const originalFetch=window.fetch;
window.fetch=async function(input,init){
 const response=await originalFetch.call(this,input,init), kind=kindOf(typeof input==='string'||input instanceof URL?String(input):input.url);
 if(!kind||!response.ok)return response;
 try{
  const localized=engine.data(await response.clone().json(),kind);status.api++;report();
  const wrapped=new Response(JSON.stringify(localized),{status:response.status,statusText:response.statusText,headers:response.headers});
  for(const k of ['url','redirected','type'])Object.defineProperty(wrapped,k,{value:response[k]});
  return wrapped;
 }catch{return response}
};
// XHR adapter intercepts response getters, before any app event listener can read them.
const proto=XMLHttpRequest.prototype, open=proto.open;
const responseDesc=Object.getOwnPropertyDescriptor(proto,'response'), textDesc=Object.getOwnPropertyDescriptor(proto,'responseText');
proto.open=function(method,url,...rest){
 const kind=kindOf(url);let cached,rawLast;
 if(kind){
  const get=()=>{
   const raw=this.responseType==='json'?responseDesc.get.call(this):textDesc.get.call(this);
   if(this.readyState!==4||this.status<200||this.status>=300)return raw;
   if(raw===rawLast&&cached!==undefined)return cached;
   try{cached=engine.data(typeof raw==='string'?JSON.parse(raw):raw,kind);rawLast=raw;status.api++;return cached}catch{return raw}
  };
  Object.defineProperty(this,'response',{configurable:true,get:()=>{const value=get();return this.responseType==='json'?value:typeof value==='string'?value:JSON.stringify(value)}});
  Object.defineProperty(this,'responseText',{configurable:true,get:()=>{if(this.responseType&&this.responseType!=='text')return textDesc.get.call(this);const value=get();return typeof value==='string'?value:JSON.stringify(value)}});
 }else{delete this.response;delete this.responseText}
 return open.call(this,method,url,...rest);
};
// Incremental text rendering also covers result cards, menus, tooltips and SPA updates.
const originals=new WeakMap(), pending=new Set();let timer;
const skip='script,style,textarea,input,[contenteditable="true"],.accountName,.account-name,.characterName,.character-name,.whisper,.price-value,a[href*="/account/view-profile/"],[data-poe2zh-skip],[data-poe2zh-original]';
function translateNode(node){
 if(node.nodeType!==3||!node.parentElement||node.parentElement.closest(skip))return;
 const current=node.nodeValue;if(originals.get(node)===current||!current.trim())return;
 const r=engine.lookup(current);if(!r){note(current.trim());return}
 const translated=current.replace(current.trim(),r.zh+(settings.bilingual?' ('+current.trim()+')':''));
 if(current===translated)return;
 node.nodeValue=translated;originals.set(node,translated);status.translated++;
 const el=node.parentElement;if(!el.hasAttribute('title'))el.setAttribute('title',current.trim());
}

const resultCopies=new Map();
const resultSelector='.results [data-field],.results .explicitMod,.results .implicitMod,.results .enchantMod,.results .runeMod,.results .fracturedMod,.results .craftedMod';
function localizeResult(el){
 if(el.closest('[data-poe2zh-skip]')||el.querySelector(resultSelector))return;
 const original=el.textContent.trim(),r=engine.lookup(original),previous=resultCopies.get(el);
 if(!r){if(previous){previous.remove();resultCopies.delete(el);el.removeAttribute('data-poe2zh-original')}return}
 let copy=previous;if(!copy){copy=document.createElement('span');copy.setAttribute('data-poe2zh-skip','');copy.className='poe2zh-result';resultCopies.set(el,copy);status.translated++}
 const text=r.zh+(settings.bilingual?' ('+original+')':'');if(copy.textContent!==text)copy.textContent=text;
 copy.title=original;el.setAttribute('data-poe2zh-original','');if(copy.previousSibling!==el)el.after(copy);
}
function cleanCopies(){for(const [el,copy]of resultCopies)if(!el.isConnected){copy.remove();resultCopies.delete(el)}}
function scan(root){
 if(root.nodeType===3){const result=root.parentElement?.closest(resultSelector);if(result)localizeResult(result);else translateNode(root);return}if(root.nodeType!==1)return;
 const result=root.closest(resultSelector);if(result){localizeResult(result);return}
 if(root.closest(skip))return;
 for(const el of root.querySelectorAll(resultSelector))localizeResult(el);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())translateNode(node);
 for(const el of [root,...root.querySelectorAll('[placeholder],[aria-label]')]){
  if(el.closest('[data-poe2zh-skip]'))continue;
  for(const attr of ['placeholder','aria-label']){const text=el.getAttribute(attr);if(text){const translated=engine.display(text);if(translated!==text)el.setAttribute(attr,translated)}}
 }
}
function flush(){timer=null;cleanCopies();for(const node of pending)if(node.isConnected)scan(node);pending.clear();report()}
const observer=new MutationObserver(changes=>{
 for(const m of changes){if(m.type==='characterData')pending.add(m.target);else if(m.type==='attributes')pending.add(m.target);else for(const node of m.addedNodes)pending.add(node)}
 if(!timer)timer=setTimeout(flush,60);
});
function start(){const style=document.createElement('style');style.textContent='[data-poe2zh-original]{display:none!important}.poe2zh-result{white-space:pre-line}';document.head.append(style);scan(document.body);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label']});report()}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
document.addEventListener('poe2db-zh-request-status',report);
document.addEventListener('poe2db-zh-export',()=>{
 const blob=new Blob([JSON.stringify({version:status.version,missing:[...missing]},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='poe2-untranslated.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
})();
