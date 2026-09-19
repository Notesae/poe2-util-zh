'use strict';
let latest=null;
document.addEventListener('poe2db-zh-status',event=>{try{const v=JSON.parse(event.detail);latest={translated:Number(v.translated)||0,missing:Number(v.missing)||0,records:Number(v.records)||0,version:String(v.version).slice(0,40),api:Number(v.api)||0}}catch{}});
const key='poe2db-zh-settings-v1';
function sync(settings){
 const next=JSON.stringify({enabled:settings.enabled!==false,bilingual:!!settings.bilingual});
 const old=localStorage.getItem(key);if(old===next)return;
 localStorage.setItem(key,next);
 if(old!==null||settings.enabled===false||settings.bilingual)location.reload();
}
const readSettings=()=>chrome.storage.local.get(null).then(raw=>sync(POE2_MODULES.settings(raw,'trade')));
readSettings();
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.enabled||changes.bilingual||changes[POE2_MODULES.key('trade')]))readSettings()});
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message.type==='status'){document.dispatchEvent(new Event('poe2db-zh-request-status'));reply(latest||{pending:true})}
 if(message.type==='export'){document.dispatchEvent(new Event('poe2db-zh-export'));reply({ok:true})}
});
