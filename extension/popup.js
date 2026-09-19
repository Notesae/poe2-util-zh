'use strict';
(async()=>{
 const registry=POE2_MODULES,raw=await chrome.storage.local.get(null);
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 let active=null;
 try{const s=await chrome.tabs.sendMessage(tab.id,{type:'status'});active=Object.hasOwn(s,'module')?s.module:'trade';document.getElementById('status').textContent=s.pending?'请刷新市集以读取状态。':`当前模块：${registry.modules.find(m=>m.id===active)?.name||'不在支持范围'}\n当前页已替换：${s.translated} 处 · 未匹配：${s.missing} 段`;}
 catch{document.getElementById('status').textContent='请打开支持的网站；更新插件后请刷新网页。';document.getElementById('export').disabled=true}
 for(const module of registry.modules){
  const row=document.createElement('section');row.className='module'+(active===module.id?' active':'');
  const title=document.createElement('a');title.href=module.url;title.target='_blank';title.rel='noreferrer';title.textContent=module.name;row.append(title);
  const hint=document.createElement('p');hint.textContent=module.hint;row.append(hint);
  const controls=document.createElement('div');controls.className='controls';
  const settings=registry.settings(raw,module.id);
  for(const [key,label]of [['enabled','启用汉化'],['bilingual','中英双语']]){
   const wrapper=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=settings[key];input.id=module.id+'-'+key;
   input.addEventListener('change',async()=>{settings[key]=input.checked;try{await chrome.storage.local.set({[registry.key(module.id)]:{...settings}})}catch{input.checked=!input.checked;settings[key]=input.checked;document.getElementById('status').textContent='设置保存失败，请重试。'}});
   wrapper.append(input,document.createTextNode(label));controls.append(wrapper);
  }
  row.append(controls);document.getElementById('modules').append(row);
 }
 document.getElementById('export').addEventListener('click',async()=>{try{await chrome.tabs.sendMessage(tab.id,{type:'export'})}catch{document.getElementById('status').textContent='请先打开支持的网站并刷新。'}});
})();
