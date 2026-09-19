/* Site registry and settings are shared by the popup and isolated content scripts. */
(() => {
 'use strict';
 const modules = [
  {id:'trade',name:'PoE2 市集',hint:'筛选、物品与交易结果',url:'https://www.pathofexile.com/trade2/'},
  {id:'ninja',name:'NINJA',hint:'PoE2 行情、流派与装备',url:'https://poe.ninja/poe2/builds'},
  {id:'pobb',name:'POBb.in',hint:'构筑分享与属性面板',url:'https://pobb.in/'},
  {id:'maxroll',name:'Maxroll',hint:'PoE2 导航、构筑与游戏词条',url:'https://maxroll.gg/poe2'},
  {id:'mobalytics',name:'Mobalytics',hint:'PoE2 流派、指南与游戏词条',url:'https://mobalytics.gg/poe-2'},
  {id:'craft',name:'Craft of Exile',hint:'制作工具界面与游戏词条',url:'https://www.craftofexile.com/?game=poe2'},
  {id:'official',name:'Path of Exile 官网',hint:'官网导航；市集有独立开关',url:'https://www.pathofexile.com/'}
 ];
 function match(raw) {
  let u;try {u=new URL(raw)}catch{return null}
  if(u.protocol!=='https:')return null;
  const h=u.hostname.replace(/^www\./,''),p=u.pathname;
  if(h==='pathofexile.com')return /^\/trade2(?:\/|$)/.test(p)?'trade':/^\/trade(?:\/|$)/.test(p)?null:'official';
  if(h==='poe.ninja'&&/^\/poe2(?:\/|$)/.test(p))return 'ninja';
  if(h==='pobb.in')return 'pobb';
  if(h==='maxroll.gg'&&/^\/poe2(?:\/|$)/.test(p))return 'maxroll';
  if(h==='mobalytics.gg'&&/^\/poe-2(?:\/|$)/.test(p))return 'mobalytics';
  if(h==='craftofexile.com'||h==='beta.craftofexile.com')return 'craft';
  return null;
 }
 const key=id=>'module.'+id;
 function settings(raw,id){
  const saved=raw[key(id)];
  return {enabled:saved?.enabled??(id==='trade'?raw.enabled!==false:true),bilingual:saved?.bilingual??(id==='trade'?!!raw.bilingual:false)};
 }
 globalThis.POE2_MODULES={modules,match,key,settings};
 globalThis.POE2_SITE_UI={};
 if(typeof module!=='undefined')module.exports=globalThis.POE2_MODULES;
})();
