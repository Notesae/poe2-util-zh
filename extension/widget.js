/* 页面内当前站点控制器：隔离样式，共用扩展设置，不接触网站表单与请求。 */
(() => {
 'use strict';
 // 一个页面只挂载一个控件；未支持的 SPA 路由不保留可见入口。
 const registry=POE2_MODULES;
 let host,shadow,raw={},active=null,busy=false,ready=false,routeTimer;
 // 原创矢量译文符印：交叠书页、文字笔画与顶端星芒，不依赖字体字形或外部资源。
 const emblem=`<svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path d="M8 9h17v22H8z" fill="currentColor" fill-opacity=".08"/><path d="M8 9h17v22H8V9Zm17 4h7v22H15v-4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 16h9m-4.5-3v3m-3 2c1.1 3.1 3.5 5.3 7 6m-.5-8c-.6 3.7-3.5 7.2-7.5 9M26 23l-3 8m3-8 3 8m-5-2h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="m31 3 1.3 3.7L36 8l-3.7 1.3L31 13l-1.3-3.7L26 8l3.7-1.3L31 3Z" fill="currentColor"/></svg>`;
 // 深色铸金面板使用层级表面和细线结构；动画仅改变透明度与位移。
 const css=`
 :host{all:initial!important;position:fixed!important;right:max(24px,env(safe-area-inset-right))!important;bottom:max(24px,env(safe-area-inset-bottom))!important;z-index:2147483646!important;display:block!important;color-scheme:light!important;direction:ltr!important}
 *{box-sizing:border-box} [hidden]{display:none!important}
 .widget{font:14px/1.6 'Microsoft YaHei','PingFang SC',sans-serif;color:#302a23;letter-spacing:0;text-align:left}
 button,input{font:inherit}button{cursor:pointer}button:disabled{cursor:wait;opacity:.55}button:focus-visible,input:focus-visible{outline:3px solid #9b542d;outline-offset:4px}
 .seal{display:flex;align-items:center;justify-content:center;width:56px;height:56px;margin-left:auto;border:1px solid #bd9b68;border-radius:50%;background:#292720;color:#eddcbb;box-shadow:0 4px 16px #201b2426;position:relative;transition:transform .18s cubic-bezier(.22,1,.36,1)}
 .seal:before{content:'';position:absolute;inset:5px;border:1px solid #746148;border-radius:50%}.seal span{font:24px/1 'Noto Serif CJK SC','Songti SC',SimSun,serif}.seal:hover{transform:translateY(-2px);background:#393329}.seal:active{transform:translateY(0)}
 .dot{position:absolute;right:0;bottom:2px;width:12px;height:12px;background:#547858;border:2px solid #f5efe3;border-radius:50%}.paused .dot{background:#8c8272}
 .panel{width:min(328px,calc(100vw - 32px));max-height:calc(100dvh - 108px);overflow:auto;margin-bottom:12px;background:#f5efe3;border:1px solid #c5b89f;border-radius:16px;box-shadow:0 12px 36px #211a232b;animation:reveal .2s cubic-bezier(.22,1,.36,1);padding:24px}
 .eyebrow{font-size:10px;letter-spacing:2px;color:#766348;margin:0 40px 8px 0;font-weight:700}.heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}h2{font:600 24px/1.35 'Noto Serif CJK SC','Songti SC',SimSun,serif;margin:0;overflow-wrap:anywhere}.close{flex-shrink:0;width:44px;height:44px;margin:-12px -12px 0 0;border:0;background:transparent;color:#6b5b47;border-radius:8px;font-size:24px}.close:hover{background:#e8dfce}
 .scope{margin:8px 0 24px;color:#75654e;font-size:12px}.row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 0;border-top:1px solid #d9ceb9}.label{font-weight:700}.state{font-size:12px;color:#75654e;margin-top:2px}
 .toggle{position:relative;flex-shrink:0;width:48px;height:44px;display:flex;align-items:center}.toggle input{position:absolute;inset:0;opacity:0;margin:0;width:100%;height:100%;cursor:pointer;z-index:1}.track{width:48px;height:26px;background:#887e70;border:1px solid #776b5c;border-radius:20px;pointer-events:none}.track:after{content:'';display:block;width:18px;height:18px;margin:3px;background:#faf6ed;border-radius:50%;transition:transform .16s cubic-bezier(.22,1,.36,1)}input:checked+.track{background:#536e50;border-color:#536e50}input:checked+.track:after{transform:translateX(22px)}input:focus-visible+.track{outline:3px solid #9b542d;outline-offset:4px}input:disabled{cursor:wait}.toggle:has(input:disabled){opacity:.55}
 fieldset{margin:0;padding:4px 0 0;border:0;min-width:0}legend{font-weight:700;padding:0;margin-bottom:12px}.modes{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:#e8dfce;border-radius:10px}.mode{position:relative;text-align:center;min-height:44px;display:grid;place-items:center}.mode input{position:absolute;inset:0;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}.mode span{display:grid;place-items:center;width:100%;min-height:44px;border:1px solid transparent;border-radius:7px;color:#665844;font-size:13px}.mode input:checked+span{background:#fdf9f0;color:#302a23;border-color:#c7b695;font-weight:700}.mode input:focus-visible+span{outline:3px solid #9b542d;outline-offset:1px}.mode:has(input:disabled){opacity:.55}
 .notice{font-size:12px;color:#75654e;margin:16px 0 0;min-height:38px}.error{color:#9a322b}.footer{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid #d9ceb9;font-size:10px;letter-spacing:1px;color:#75654e}
 @keyframes reveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
 @media(max-width:480px){:host{right:max(16px,env(safe-area-inset-right))!important;bottom:max(16px,env(safe-area-inset-bottom))!important}.panel{padding:20px}.seal{width:52px;height:52px}}
 @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
 /* 深色视觉覆盖基础布局，保留既有无障碍与响应式行为。 */
 :host{color-scheme:dark!important}
 .widget{color:#ece8df;font-family:'Microsoft YaHei','PingFang SC',sans-serif}
 button:focus-visible,input:focus-visible{outline-color:#e3b86f}
 .seal{width:58px;height:58px;border-radius:18px;border-color:#7d6948;background:#202521;color:#e1bb7b;box-shadow:0 6px 22px #10130f66,inset 0 1px #d8b37322}
 .seal:before{inset:4px;border-radius:13px;border-color:#d6b5771c}.seal svg{width:37px;height:37px}.seal:hover{background:#30352d;transform:translateY(-3px)}.seal[aria-expanded="true"]{border-color:#d6b577;background:#30352d}
 .dot{width:8px;height:8px;right:8px;bottom:7px;border:0;background:#b9c58e;box-shadow:0 0 0 3px #202521}.paused .dot{background:#9e988a}
 .panel{width:min(344px,calc(100vw - 32px));padding:0;border:1px solid #4d4a3c;border-radius:20px;background:#1e2320;box-shadow:0 18px 50px #0b100b66;overflow:auto}
 .masthead{position:relative;padding:22px 22px 18px;background:linear-gradient(120deg,#31362b,#252b25 58%,#202620);border-bottom:1px solid #444738;overflow:hidden}
 .masthead:after{content:'';position:absolute;width:115px;height:115px;border:1px solid #d6b57712;right:-14px;top:-40px;transform:rotate(45deg);pointer-events:none}
 .brand{display:flex;align-items:center;gap:10px;margin-bottom:20px;color:#d6b577}.brand svg{width:28px;height:28px}.brand-copy{display:flex;flex-direction:column;gap:1px}.brand-title{font-size:12px;letter-spacing:2px;font-weight:700}.eyebrow{font-size:9px;letter-spacing:2px;font-weight:400;color:#b3b5a2;margin:0}
 .heading{align-items:center}h2{font:600 23px/1.3 'Microsoft YaHei','PingFang SC',sans-serif;letter-spacing:-.4px;color:#f2ebde}.close{position:absolute;right:12px;top:12px;margin:0;font-size:20px;color:#b9bba8;z-index:1}.close:hover{background:#d6b57714;color:#f0d5a4}.close svg{width:16px;height:16px}
 .scope{display:flex;align-items:center;gap:7px;margin:8px 0 0;font-size:11px;color:#b3b5a2}.scope:before{content:'';width:5px;height:5px;background:#b3bc8a;transform:rotate(45deg)}
 .body{padding:0 22px 20px}.row{border:0;padding:22px 0;gap:16px}.label{font-size:14px;font-weight:600;color:#efeadf}.state{font-size:11px;color:#aeb2a0;margin-top:5px}.track{height:25px;border:1px solid #707364;background:#42483e}.track:after{width:17px;height:17px;background:#d8d9cb}input:checked+.track{background:#cfb47e;border-color:#cfb47e}input:checked+.track:after{background:#292e24}input:focus-visible+.track{outline-color:#e3b86f}
 fieldset{padding-top:18px;border-top:1px solid #3c4236}legend{float:left;width:100%;font-size:11px;color:#adb09f;font-weight:400;letter-spacing:1px;margin-bottom:12px}.modes{clear:both;padding:0;gap:10px;background:none;border-radius:0}.mode{min-height:100px;text-align:left}.mode>span{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:9px;min-height:100px;padding:14px;border:1px solid #59604e;border-radius:10px;background:#242a23;color:#b9bcaa;font-size:12px}.mode input{z-index:1}.mode input:checked+span{border-color:#bca16d;background:#32372a;color:#efcf94;font-weight:500;box-shadow:inset 0 0 0 1px #bca16d22}.mode input:checked+span:after{content:'✓';position:absolute;right:10px;top:8px;font-size:11px;color:#efcf94}.mode:hover>span{border-color:#bca16d}.mode input:focus-visible+span{outline-color:#e3b86f}
 .sample{display:flex;align-items:center;gap:7px;height:26px;font-size:22px;font-weight:500;line-height:1;font-family:'Noto Serif CJK SC','Songti SC',SimSun,serif}.sample small{font:12px/1.2 Georgia,serif;border-left:1px solid #7b8067;padding-left:8px;color:#b4b7a4;letter-spacing:1px}.mode b{font-weight:inherit}
 .notice{font-size:11px;color:#afb3a2;margin:17px 0 0;min-height:0;line-height:1.7}.error{color:#f2a99a}.footer{margin:0;padding:12px 22px;background:#1a1f1b;border-top:1px solid #373f32;font-size:9px;color:#b2b5a3;letter-spacing:1px}.footer span:first-child{display:flex;align-items:center;gap:6px}.footer svg{width:12px;height:12px;color:#b7bf98}
 .sample{font-style:normal}
 @media(max-width:480px){.panel{padding:0}.masthead{padding:20px}.body{padding:0 20px 18px}.seal{width:54px;height:54px}.seal svg{width:34px;height:34px}}
 `;
 // 收起不是模态关闭，不阻止用户继续操作页面；Esc 与关闭按钮将焦点还给入口。
 function setOpen(open,focus=false){
  if(!shadow)return;
  shadow.querySelector('.panel').hidden=!open;
  shadow.querySelector('.seal').setAttribute('aria-expanded',String(open));
  if(focus)shadow.querySelector(open?'.close':'.seal').focus();
 }
 // 从共享存储渲染状态，停用翻译时仍保留入口，方便重新启用。
 function render(){
  if(!shadow||!active)return;
  const settings=registry.settings(raw,active),module=registry.modules.find(item=>item.id===active);
  shadow.querySelector('h2').textContent=module.name;
  shadow.querySelector('.state').textContent=settings.enabled?'正在汉化':'已暂停 · 保留原文';
  shadow.querySelector('.widget').classList.toggle('paused',!settings.enabled);
  shadow.querySelector('#enabled').checked=settings.enabled;
  shadow.querySelector('#enabled').disabled=busy||!ready;
  for(const input of shadow.querySelectorAll('[name="mode"]')){input.checked=(input.value==='bilingual')===settings.bilingual;input.disabled=busy||!ready||!settings.enabled}
  shadow.querySelector('.seal').setAttribute('aria-label','当前网站翻译选项：'+module.name+'，'+(settings.enabled?'已开启':'已暂停'));
  const notice=shadow.querySelector('.notice');notice.classList.remove('error');
  notice.textContent=!ready?'正在读取设置…':busy?'正在保存…':active==='trade'?'修改后将自动刷新市集，请先保留未提交的输入。':'偏好保存在本机，修改即时生效。';
 }
 // 设置只写当前模块，失败时回滚界面；串行保存避免快速点击覆盖彼此。
 async function save(field,value){
  if(busy||!ready||!active)return;
  const id=active,key=registry.key(id),before=raw[key],next={...registry.settings(raw,id),[field]:value};
  let failed=false;
  busy=true;raw[key]=next;render();
  try{await chrome.storage.local.set({[key]:next})}
  catch{raw[key]=before;failed=true}
  finally{busy=false;render();if(failed&&active===id){const notice=shadow.querySelector('.notice');notice.textContent='保存失败，请重试；若扩展已更新，请刷新页面。';notice.classList.add('error')}}
 }
 // 根据同一站点注册表挂载/移除入口，覆盖支持与不支持路由之间的 SPA 切换。
 function syncRoute(){
  const id=registry.match(location.href);
  if(!id){host?.remove();host=null;shadow=null;active=null;return}
  if(!document.body)return;
  if(host?.isConnected&&active===id)return;
  if(host?.isConnected){active=id;setOpen(false);render();return}
  active=id;host=document.createElement('div');host.id='poe2zh-widget';host.lang='zh-CN';host.setAttribute('data-poe2zh-skip','');host.setAttribute('translate','no');
  shadow=host.attachShadow({mode:'open'});
  // 模板完全由扩展常量构成；站点名称与状态仅通过 textContent 写入。
  shadow.innerHTML=`<style>${css}</style><div class="widget"><section class="panel" hidden role="region" aria-label="当前网站翻译选项"><header class="masthead"><div class="brand">${emblem}<div class="brand-copy"><span class="brand-title">流亡译典</span><p class="eyebrow">PATH OF EXILE II</p></div></div><button class="close" type="button" aria-label="收起翻译选项"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button><div class="heading"><h2></h2></div><p class="scope">仅调整当前站点</p></header><div class="body"><div class="row"><div><div class="label" id="enabled-label">网站汉化</div><div class="state"></div></div><label class="toggle"><input id="enabled" type="checkbox" role="switch" aria-labelledby="enabled-label"><span class="track"></span></label></div><fieldset><legend>阅读偏好</legend><div class="modes"><label class="mode"><input type="radio" name="mode" value="chinese" aria-label="仅中文"><span><i class="sample" aria-hidden="true">文</i><b>仅中文</b></span></label><label class="mode"><input type="radio" name="mode" value="bilingual" aria-label="中英双语"><span><i class="sample" aria-hidden="true">文<small>EN</small></i><b>中英双语</b></span></label></div></fieldset><p class="notice" role="status" aria-live="polite"></p></div><footer class="footer"><span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m8 2 5 2v4c0 3-5 6-5 6s-5-3-5-6V4l5-2Z" stroke="currentColor"/><path d="m5.5 8 1.5 1.5 3-3" stroke="currentColor"/></svg>独立站点设置</span><span class="version"></span></footer></section><button class="seal" type="button" aria-expanded="false">${emblem}<i class="dot" aria-hidden="true"></i></button></div>`;
  shadow.querySelector('.version').textContent='v'+chrome.runtime.getManifest().version;
  shadow.querySelector('.panel').id='poe2zh-options';
  shadow.querySelector('.seal').setAttribute('aria-controls','poe2zh-options');
  shadow.querySelector('.seal').title='流亡译典 · 当前网站选项';
  shadow.querySelector('.seal').addEventListener('click',()=>setOpen(shadow.querySelector('.panel').hidden,true));
  shadow.querySelector('.close').addEventListener('click',()=>setOpen(false,true));
  shadow.querySelector('#enabled').addEventListener('change',event=>save('enabled',event.target.checked));
  for(const input of shadow.querySelectorAll('[name="mode"]'))input.addEventListener('change',()=>save('bilingual',input.value==='bilingual'));
  shadow.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();setOpen(false,true)}event.stopPropagation()});
  shadow.addEventListener('click',event=>event.stopPropagation());
  document.body.append(host);render();
 }
 // 弹窗、其他同站标签页与浮层共用 storage 事件，保持显示一致。
 chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;for(const [key,value]of Object.entries(changes))raw[key]=value.newValue;render()});
 chrome.storage.local.get(null).then(value=>{raw=value;ready=true;syncRoute();render()}).catch(()=>{syncRoute();if(shadow)shadow.querySelector('.notice').textContent='无法读取设置，请刷新页面后重试。'});
 document.addEventListener('pointerdown',event=>{if(host&&!event.composedPath().includes(host))setOpen(false)},true);
 document.addEventListener('DOMContentLoaded',syncRoute,{once:true});
 routeTimer=setInterval(syncRoute,500);
 window.addEventListener('pagehide',event=>{if(!event.persisted)clearInterval(routeTimer)});
})();
