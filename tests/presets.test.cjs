const path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
// Model the public app/store contract from the official trade bundle (2026-09-20).
const fixture=`<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#101115;margin:20px"><div id="trade"><div class="search-panel">装备筛选</div></div><script>
const original={id:null,tab:'search',name:null,type:'Bow',disc:null,term:null,realm:'poe2',league:'Test',status:'online',filters:{trade_filters:{filters:{price:{max:5,option:'divine'}}}},stats:[{type:'and',filters:[{id:'explicit.life',value:{min:100},disabled:false}]}],exchange:{want:{},have:{},fulfillable:true}};
const subscribers=[];
window.app={loaded:true,state:structuredClone(original),transient:{search:{active:null}},static_:{leagues:[{id:'Test',realm:'poe2'}],knownStatsFlat:{'explicit.life':{}},propertyFilters:[{id:'trade_filters',filters:[{id:'price'}]}]},
 load(state){this.state=state;this.transient.search.active=null},save(){},
 $store:{subscribe(fn){subscribers.push(fn)},commit(type,payload){if(type==='addSearchQuery')app.transient.search.active={...payload};if(type==='updateSearchQuery')Object.assign(app.transient.search.active,payload);for(const fn of subscribers)fn({type,payload})}}
};
</script></body></html>`;
(async()=>{
 const ext=path.resolve('extension');
 const context=await chromium.launchPersistentContext(path.resolve('tests/presets-profile'),{channel:process.env.TEST_BROWSER_CHANNEL||'msedge',headless:true,args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
 try{
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://www.pathofexile.com/**',r=>r.fulfill({contentType:'text/html',body:fixture}));
 await page.goto('https://www.pathofexile.com/trade2/search/poe2/Test');
 const host=page.locator('#poe2zh-presets');await host.waitFor();
 await host.getByRole('button',{name:'我的方案',exact:true}).click();
 // Clean up only this isolated test profile through the extension's reversible delete UI.
 for(const button of await host.getByRole('button',{name:/^删除 /}).all())await button.click();
 const save=async name=>{await host.getByRole('button',{name:'保存新方案',exact:true}).click();await host.getByLabel('方案名称').fill(name);await host.getByRole('button',{name:'保存',exact:true}).click();await host.getByText('方案已保存。',{exact:true}).waitFor()};
 await page.evaluate(()=>app.transient.search.active={sort:{dps:'desc'}});
 await save('弓 · 5 Divine');
 await page.evaluate(()=>{app.state.filters={};app.state.stats=[];app.state.type='Ring';app.state.term='changed'});
 await host.getByText('弓 · 5 Divine · 已修改',{exact:true}).waitFor();
 await host.getByRole('button',{name:'套用 弓 · 5 Divine',exact:true}).click();
 assert.equal(await page.evaluate(()=>app.state.type),'Bow');
 assert.equal(await page.evaluate(()=>app.state.term),null);
 assert.equal(await page.evaluate(()=>app.state.stats[0].filters[0].value.min),100);
 await page.evaluate(()=>app.$store.commit('addSearchQuery',{type:'search',localId:'test',sort:{price:'asc'}}));
 assert.deepEqual(await page.evaluate(()=>app.transient.search.active.sort),{dps:'desc'});
 await page.evaluate(()=>app.state.filters.trade_filters.filters.price.max=10);
 await host.getByRole('button',{name:'更新方案',exact:true}).click();await host.getByText('已更新当前方案。').waitFor();
 await host.getByRole('button',{name:'重命名 弓 · 5 Divine',exact:true}).click();await host.getByLabel('方案名称').fill('升级弓');await host.getByRole('button',{name:'保存',exact:true}).click();
 await host.getByRole('button',{name:'套用 升级弓',exact:true}).waitFor();
 await page.reload();await host.waitFor();await host.getByRole('button',{name:'我的方案',exact:true}).click();
 await host.getByRole('button',{name:'套用 升级弓',exact:true}).click();assert.equal(await page.evaluate(()=>app.state.filters.trade_filters.filters.price.max),10);
 await host.getByRole('button',{name:'保存新方案',exact:true}).click();await host.getByLabel('方案名称').fill('升级弓');await host.getByRole('button',{name:'保存',exact:true}).click();await host.getByText('已有同名方案，请换一个名称。').waitFor();await host.getByRole('button',{name:'取消',exact:true}).click();
 await host.getByLabel('查找方案').fill('找不到');await host.getByText('没有匹配的方案。').waitFor();await host.getByLabel('查找方案').fill('');
 await host.getByRole('button',{name:'删除 升级弓',exact:true}).click();await host.getByRole('button',{name:'撤销删除',exact:true}).click();await host.getByRole('button',{name:'套用 升级弓',exact:true}).waitFor();
 await page.evaluate(()=>{app.static_.leagues=[];app.state.type='Ring'});
 await host.getByRole('button',{name:'套用 升级弓',exact:true}).click();await host.getByText(/该方案的联赛已不可用/).waitFor();assert.equal(await page.evaluate(()=>app.state.type),'Ring');
 await page.evaluate(()=>{app.static_.leagues=[{id:'Test',realm:'poe2'}];app.searchRequest={}});
 await host.getByRole('button',{name:'套用 升级弓',exact:true}).click();await host.getByText(/请等待搜索完成/).waitFor();assert.equal(await page.evaluate(()=>app.state.type),'Ring');await page.evaluate(()=>app.searchRequest=null);
 await page.evaluate(()=>{app.static_.knownStatsFlat={};app.state.type='Ring'});
 await host.getByRole('button',{name:'套用 升级弓',exact:true}).click();await host.getByText(/方案包含已失效的词缀/).waitFor();assert.equal(await page.evaluate(()=>app.state.type),'Ring');
 await page.setViewportSize({width:360,height:800});await page.screenshot({path:'tests/presets-mobile.png'});
 assert(await host.evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
 await page.setViewportSize({width:1280,height:800});await page.screenshot({path:'tests/presets-desktop.png'});
 assert.deepEqual(errors,[]);console.log('PASS presets: MV3 storage, CRUD, unsent state, full replacement, sort, reload, find, undo, invalid stats, narrow layout');
 }finally{await context.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
