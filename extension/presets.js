(() => {
'use strict';
const key='poe2zh-trade-presets-v1';
let rows=[],selected='',baseline='',undo=null,busy=false,root,host;
const pending=new Map();
document.addEventListener('poe2zh-presets-response',event=>{
 try{const value=JSON.parse(event.detail),entry=pending.get(value.id);if(entry){clearTimeout(entry.timer);pending.delete(value.id);value.error?entry.reject(Error(value.error)):entry.resolve(value.data)}}catch{}
});
function rpc(action,data){return new Promise((resolve,reject)=>{
 const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('市集尚未准备好，请刷新页面后重试。'))},3000);
 pending.set(id,{resolve,reject,timer});document.dispatchEvent(new CustomEvent('poe2zh-presets-request',{detail:JSON.stringify({id,action,data})}));
})}
const el=id=>root.getElementById(id);
const notice=text=>{el('message').textContent=text};
function summary(data){
 const s=data.state,stats=s.stats.reduce((n,g)=>n+(g.filters?.length||0),0);
 const filters=Object.values(s.filters).reduce((n,g)=>n+Object.keys(g.filters||{}).length,0);
 const price=s.filters.trade_filters?.filters.price;
 return [s.league,s.term||s.name||s.type,`${stats} 条词缀 · ${filters} 项筛选`,price?`价格 ${price.min??'不限'}–${price.max??'不限'} ${price.option||''}`:''].filter(Boolean).join(' · ');
}
function render(){
 const list=el('list');list.replaceChildren();
 const query=el('find').value.trim().toLocaleLowerCase();
 const visible=rows.filter(row=>(row.name+' '+summary(row.data)).toLocaleLowerCase().includes(query));
 el('empty').hidden=!!visible.length;el('empty').textContent=rows.length?'没有匹配的方案。':'还没有方案。填好条件后，点击“保存新方案”。';
 for(const row of visible){
  const item=document.createElement('article'),title=document.createElement('strong'),desc=document.createElement('p');
  title.textContent=row.name+(row.id===selected?' · 当前方案':'');desc.textContent=summary(row.data);item.append(title,desc);
  for(const [label,action]of [['套用',()=>apply(row)],['重命名',()=>editName(row)],['删除',()=>remove(row)]]){
   const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',label+' '+row.name);button.onclick=()=>run(action);item.append(button);
  }list.append(item);
 }
 el('update').disabled=!selected;el('undo').hidden=!undo;
}
async function persist(next){await chrome.storage.local.set({[key]:next});rows=next;render()}
async function run(action){if(busy)return;busy=true;try{await action()}catch(error){notice(error.message||'保存失败，请重试。')}finally{busy=false}}
function editName(row){
 el('editor').hidden=false;el('name').value=row?.name||'';el('editor').dataset.id=row?.id||'';el('name').focus();
}
async function apply(row){
 const data=await rpc('apply',row.data);selected=row.id;baseline=JSON.stringify(data);el('current').textContent=row.name;render();notice('已套用完整条件，点击市集“搜索”获取结果。');
}
async function remove(row){
 await persist(rows.filter(r=>r.id!==row.id));undo=row;
 if(selected===row.id){selected='';baseline='';el('current').textContent='未选择方案'}
 render();notice('已删除“'+row.name+'”，可撤销。');
}
async function mount(){
 const panel=document.querySelector('#trade .search-panel');
 if(!panel||!/\/trade2\/search(?:\/|$)/.test(location.pathname)){host?.remove();return}
 if(host?.isConnected)return;
 if(host){panel.before(host);return}
 host=document.createElement('div');host.dataset.poe2zhSkip='';host.id='poe2zh-presets';root=host.attachShadow({mode:'open'});
 root.innerHTML=`<style>
 :host{display:block;color-scheme:dark}*{box-sizing:border-box}header,.actions{display:flex;align-items:center;flex-wrap:wrap}#current{flex:1;overflow-wrap:anywhere}button,input{font:inherit}button{cursor:pointer}button:disabled{cursor:default}input{min-width:0;max-width:100%}#name{flex:1}article strong,p{overflow-wrap:anywhere}#list{overflow:auto}#message:empty{display:none}[hidden]{display:none!important}
 /* Match the native trade controls: compact square surfaces, muted separators and blue primary actions. */
 :host{margin:0;font-family:inherit;font-size:13px;line-height:1.4;color:#dfcf99}
 section{background:rgba(0,0,0,.9);padding:8px;border:0;border-bottom:1px solid #343434;border-radius:0}
 header,.actions{gap:5px}header{min-height:30px}header strong{font-weight:400;color:#c7b581;padding:0 8px 0 4px}#current{color:#858585;min-width:80px;padding-right:8px}
 button,input{border:1px solid transparent;border-radius:0;min-height:30px;padding:5px 12px;background:#202325;color:#dfcf99}button:hover{background:#33383b;color:#fff0c4}button:disabled{opacity:1;color:#777;background:#191b1c}button:focus-visible,input:focus-visible{outline:1px solid #c6a765;outline-offset:1px}
 #save,#editor button[type=submit]{background:#103149;border-color:#4a5269}#save:hover,#editor button[type=submit]:hover{background:#194664}#toggle{display:inline-flex;align-items:center;gap:12px}#toggle:after{content:'';width:6px;height:6px;border-right:2px solid #aaa;border-bottom:2px solid #aaa;transform:rotate(45deg);margin-top:-4px}#toggle[aria-expanded=true]:after{transform:rotate(225deg);margin-top:4px}
 input{background:#1d1f20;border-color:#3b3b3b;color:#eee;padding:5px 9px}input::placeholder{color:#858585}#editor{margin-top:8px;padding:8px;background:#151617;border-top:1px solid #343434}#editor label{color:#aaa}#manager{margin-top:8px;border-top:1px solid #343434;padding-top:8px}#find{width:360px;max-width:100%;margin:0 0 6px}#empty{margin:5px 0;padding:6px 2px;color:#929292}
 article{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;column-gap:5px;align-items:center;padding:8px;border-top:1px solid #303030;background:#191b1c}article:nth-child(even){background:#131415}article strong{grid-column:1;grid-row:1;font-weight:400;color:#dfcf99}article p{grid-column:1;grid-row:2;margin:3px 12px 0 0;color:#939393;font-size:12px}article button{grid-row:1 / span 2;margin:0}article button:first-of-type{background:#103149;border-color:#4a5269}#list{max-height:300px}#message{margin-top:6px;padding:3px 2px;color:#b7a784;font-size:12px}#undo{margin-top:4px}
 @media(max-width:540px){header strong{padding-left:0}#current{min-width:calc(100% - 100px)}header button{flex:1}article{grid-template-columns:repeat(3,minmax(0,1fr))}article strong,article p{grid-column:1 / -1}article button{grid-row:3;margin-top:6px}#editor label{width:100%}#editor input{flex-basis:100%}}
 </style><section aria-label="保存筛选方案"><header><strong>筛选方案</strong><span id="current">未选择方案</span><button id="toggle" aria-expanded="false">我的方案</button><button id="save">保存新方案</button><button id="update" disabled>更新方案</button></header>
 <form id="editor" class="actions" hidden><label for="name">方案名称</label><input id="name" maxlength="60" required autocomplete="off"><button type="submit">保存</button><button id="cancel" type="button">取消</button></form>
 <div id="manager" hidden><input id="find" aria-label="查找方案" placeholder="按名称或条件查找"><p id="empty"></p><div id="list"></div></div><div id="message" role="status" aria-live="polite"></div><button id="undo" hidden>撤销删除</button></section>`;
 panel.before(host);
 el('toggle').onclick=()=>{el('manager').hidden=!el('manager').hidden;el('toggle').setAttribute('aria-expanded',String(!el('manager').hidden));render()};
 el('save').onclick=()=>editName();el('cancel').onclick=()=>{el('editor').hidden=true;el('save').focus()};el('find').oninput=render;
 el('editor').onsubmit=event=>{event.preventDefault();run(async()=>{
  const name=el('name').value.trim(),id=el('editor').dataset.id;
  if(!name)throw Error('请输入方案名称。');
  if(rows.some(r=>r.name===name&&r.id!==id))throw Error('已有同名方案，请换一个名称。');
  if(id){await persist(rows.map(r=>r.id===id?{...r,name}:r));if(selected===id)el('current').textContent=name}
  else{const data=await rpc('read'),row={id:crypto.randomUUID(),name,data};await persist([...rows,row]);selected=row.id;baseline=JSON.stringify(data);el('current').textContent=name}
  el('editor').hidden=true;render();notice('方案已保存。');
 })};
 el('update').onclick=()=>run(async()=>{const data=await rpc('read');await persist(rows.map(r=>r.id===selected?{...r,data}:r));baseline=JSON.stringify(data);el('current').textContent=rows.find(r=>r.id===selected).name;notice('已更新当前方案。')});
 el('undo').onclick=()=>run(async()=>{if(undo){await persist([...rows,undo]);undo=null;render();notice('已恢复删除的方案。')}});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){el('editor').hidden=true;el('manager').hidden=true;el('toggle').setAttribute('aria-expanded','false');el('toggle').focus()}});
 try{const raw=await chrome.storage.local.get(key);rows=raw[key]||[];render()}catch{notice('无法读取已保存方案，请刷新后重试。')}
}
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[key]&&root){rows=changes[key].newValue||[];if(!rows.some(r=>r.id===selected)){selected='';baseline='';el('current').textContent='未选择方案'}render()}});
setInterval(()=>{
 mount();
 if(host?.isConnected&&selected&&!busy)rpc('read').then(data=>{const row=rows.find(r=>r.id===selected);if(row)el('current').textContent=row.name+(JSON.stringify(data)!==baseline?' · 已修改':'')}).catch(()=>{});
},1000);
})();
