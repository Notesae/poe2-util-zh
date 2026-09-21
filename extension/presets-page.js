// Official trade adapter. Keep this separate from translation so presets also work with it disabled.
(() => {
'use strict';
const request='poe2zh-presets-request', response='poe2zh-presets-response';
const fields=['name','type','disc','term','realm','league','status','filters','stats'];
const clone=value=>JSON.parse(JSON.stringify(value));
let subscribed, pendingSort=null;
function appReady(){
 const app=window.app;
 if(!app?.loaded||app.state?.tab!=='search'||!app.$store||typeof app.load!=='function')throw Error('请先打开并等待市集装备筛选页面加载完成。');
 if(subscribed!==app){
  app.$store.subscribe((mutation)=>{
   if(mutation.type==='addSearchQuery'&&mutation.payload.type==='search'&&pendingSort){
    const sort=pendingSort;pendingSort=null;
    app.$store.commit('updateSearchQuery',{localId:mutation.payload.localId,sort});
   }
   if(mutation.type==='clearSearchForm')pendingSort=null;
  });subscribed=app;
 }
 return app;
}
function snapshot(app){
 const state={};for(const key of fields)state[key]=app.state[key]??null;
 return clone({state,sort:pendingSort||app.transient.search.active?.sort||{price:'asc'}});
}
function validate(app,data){
 if(!data?.state||!Array.isArray(data.state.stats)||!data.state.filters||!data.sort)throw Error('方案数据不完整，无法套用。');
 const s=data.state, catalog=app.static_;
 if(!catalog.leagues.some(l=>l.id===s.league&&l.realm===s.realm))throw Error('该方案的联赛已不可用，请切换有效联赛后更新方案。');
 for(const group of s.stats)for(const filter of group.filters||[]){
  if(!catalog.knownStatsFlat[filter.id])throw Error('方案包含已失效的词缀：'+filter.id+'。请重新保存筛选条件。');
 }
 for(const [id,group]of Object.entries(s.filters)){
  const known=catalog.propertyFilters.find(g=>g.id===id);
  if(!known||Object.keys(group.filters||{}).some(key=>!known.filters.some(f=>f.id===key)))throw Error('方案包含已失效的筛选条件，请重新保存。');
 }
}
document.addEventListener(request,event=>{
 let id;
 try{
  const message=JSON.parse(event.detail);id=message.id;const app=appReady();
  if(message.action==='apply'){
   validate(app,message.data);
   if(app.searchRequest||app.searchLive)throw Error('请等待搜索完成或停止实时搜索后再套用方案。');
   const next=clone(app.state);
   for(const key of fields)next[key]=clone(message.data.state[key]??null);
   next.id=null;next.tab='search';
   app.load(next);pendingSort=clone(message.data.sort);
   app.$store.commit('showAdvancedSearch',true);app.save(false);
  }else if(message.action!=='read')return;
  document.dispatchEvent(new CustomEvent(response,{detail:JSON.stringify({id,data:snapshot(app)})}));
 }catch(error){document.dispatchEvent(new CustomEvent(response,{detail:JSON.stringify({id,error:error.message})}));}
});
})();
