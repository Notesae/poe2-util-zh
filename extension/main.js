(() => {
'use strict';
const settingsKey='poe2db-zh-settings-v1';
let settings;try{settings=JSON.parse(localStorage.getItem(settingsKey)||'{}')}catch{settings={}}
if(settings.enabled===false){
 for(const key of ['lscache-trade2items','lscache-trade2stats','lscache-trade2data','lscache-trade2filters']){localStorage.removeItem(key);localStorage.removeItem(key+'-cacheexpiration')}
 return;
}
// 审校后的市集界面覆盖与游戏词库分离，防止上游错字和不完整单位回流。
const reviewedUI={'Physical DPS':'物理每秒傷害','Elemental DPS':'元素每秒傷害','Listed':'上架時間','Remove All':'移除全部','Default':'預設','Compact':'緊湊','Compact Two-Columned':'雙欄緊湊','History':'歷史','Logged in as':'目前登入','Log Out':'登出','Messages':'訊息','Contact Support':'聯絡客服','BACK TO MAIN SITE':'返回主站','Privacy Policy':'隱私政策','Terms of Use':'使用條款','at max Quality':'最大品質時','Contact Options':'聯絡選項','Ignore Player':'忽略玩家','Travel to Hideout':'前往藏身處'};
// 页脚使用一条合并链接，仅翻译链接标签，不翻译法律正文。
reviewedUI['Terms of Use, Privacy Notice and Cookies Notice']='使用條款、隱私權聲明與 Cookie 聲明';
// 市集物品分类指裂痕机制，不是旧联盟名称；依据 https://poe2db.tw/tw/Breach。
reviewedUI.Breach='裂痕';
// 原生筛选会先读取 API／站点词典；时间范围必须在 DOM 翻译之前纠正。
for(const [en,zh]of [['an Hour','1 小時'],['3 Hours','3 小時'],['12 Hours','12 小時'],['a Day','1 天'],['3 Days','3 天'],['a Week','1 週'],['2 Weeks','2 週'],['1 Month','1 個月'],['2 Months','2 個月']])reviewedUI['Up to '+en+' Ago']='最近 '+zh+'內';
// 同时覆盖 API 标签路径和 DOM 查词，确保筛选与结果卡使用同一含义。
const reviewedLabels=Object.fromEntries(Object.entries(POE2_ZH_DATA.apiLabels).map(([key,value])=>[key,Object.hasOwn(reviewedUI,value.en)?{...value,zh:reviewedUI[value.en]}:value]));
const engine=POE2ZH.create([...POE2_ZH_DATA.records,...Object.entries(reviewedUI).map(([en,zh])=>({en,zh,source:'editorial:trade-audit'}))],reviewedLabels), missing=new Set();
// 仅识别市集固定数量和相对时间模板，不翻译卖家名或查询输入。
function tradeLookup(text){
 const clean=text.trim();let match,zh=Object.hasOwn(reviewedUI,clean)?reviewedUI[clean]:null;
 if(match=/^Showing ([\d,]+) results \(([\d,+]+) matched\)$/.exec(clean))zh='顯示 '+match[1]+' 筆結果（符合 '+match[2]+' 筆）';
 if(match=/^(-\s*)?Showing ([\d,-]+) of (\d+) \(Max (\d+)\)$/.exec(clean))zh=(match[1]||'')+'顯示 '+match[2]+'／'+match[3]+' 筆（上限 '+match[4]+'）';
 if(match=/^Up to (an?|\d+) (Hour|Day|Week|Month)s? Ago$/i.exec(clean))zh='最近 '+(/^[aA]/.test(match[1])?'1':match[1])+({hour:' 小時',day:' 天',week:' 週',month:' 個月'}[match[2].toLowerCase()])+'內';
 if(match=/^listed (?:(\d+) (minute|hour|day|week|month)s? ago|last (week|month)|just now)$/i.exec(clean))zh=match[3]?({week:'上週',month:'上個月'}[match[3].toLowerCase()])+'上架':match[1]?match[1]+({minute:' 分鐘',hour:' 小時',day:' 天',week:' 週',month:' 個月'}[match[2].toLowerCase()])+'前上架':'剛剛上架';
 if(match=/^(:\s*\d+\s+)?Requires:$/.exec(clean))zh=(match[1]||'')+'需求：';
 return zh?{zh}:engine.lookup(clean);
}
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
Object.assign(ui,reviewedUI);
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
// 记录扩展生成的原文提示，避免新增 title 翻译把悬停原文再次译成中文。
const originalTitles=new WeakMap();
const skip='script,style,textarea,input,[contenteditable="true"],.accountName,.account-name,.characterName,.character-name,.whisper,.price-value,a[href*="/account/view-profile/"],[data-poe2zh-skip],[data-poe2zh-original]';
// 翻译普通市集文本节点，跳过账号、价格输入与扩展维护的结果副本。
function translateNode(node){
 if(node.nodeType!==3||!node.parentElement||node.parentElement.closest(skip))return;
 const current=node.nodeValue;if(originals.get(node)===current||!current.trim())return;
 const r=tradeLookup(current);if(!r){note(current.trim());return}
 const translated=current.replace(current.trim(),r.zh+(settings.bilingual?' ('+current.trim()+')':''));
 if(current===translated)return;
 node.nodeValue=translated;originals.set(node,translated);status.translated++;
 const el=node.parentElement;if(!el.hasAttribute('title')){originalTitles.set(el,current.trim());el.setAttribute('title',current.trim())}
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
// 只扫描变动子树，分别处理结果卡副本、普通标签与辅助属性。
function scan(root){
 if(root.nodeType===3){const result=root.parentElement?.closest(resultSelector);if(result)localizeResult(result);else translateNode(root);return}if(root.nodeType!==1)return;
 const result=root.closest(resultSelector);if(result){localizeResult(result);return}
 if(root.closest(skip))return;
 for(const el of root.querySelectorAll(resultSelector))localizeResult(el);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())translateNode(node);
 for(const el of [root,...root.querySelectorAll('[placeholder],[aria-label],[alt],[title]')]){
  if(el.closest(skip)&&!el.matches('input[placeholder]'))continue;
  for(const attr of ['placeholder','aria-label','alt','title']){
   const text=el.getAttribute(attr);if(!text)continue;
   // title 仅翻译实际控件；结果原文提示和外部已重写的标题分别处理。
   if(attr==='title'&&(!el.matches('button,[role="button"],input,select')||originalTitles.get(el)===text))continue;
   const translated=tradeLookup(text)?.zh;if(translated&&translated!==text)el.setAttribute(attr,translated);
  }
 }
}
function flush(){timer=null;cleanCopies();for(const node of pending)if(node.isConnected)scan(node);pending.clear();report()}
const observer=new MutationObserver(changes=>{
 for(const m of changes){if(m.type==='characterData')pending.add(m.target);else if(m.type==='attributes')pending.add(m.target);else for(const node of m.addedNodes)pending.add(node)}
 if(!timer)timer=setTimeout(flush,60);
});
// 注入结果副本样式并监听站点动态文本、输入提示和图标辅助名称。
function start(){const style=document.createElement('style');style.textContent='[data-poe2zh-original]{display:none!important}.poe2zh-result{white-space:pre-line}';document.head.append(style);scan(document.body);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','alt','title']});report()}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
document.addEventListener('poe2db-zh-request-status',report);
document.addEventListener('poe2db-zh-export',()=>{
 const blob=new Blob([JSON.stringify({version:status.version,missing:[...missing]},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='poe2-untranslated.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
})();
