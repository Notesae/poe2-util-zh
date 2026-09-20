const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 // CI 使用锁定版本的 Chromium，本地默认保留 Chrome 验证。
 const browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const data=JSON.parse(fs.readFileSync('sources/trade-stats-en.json','utf8'));
 // 使用快照模拟筛选接口，验证 DOM 之前的原生标签覆盖也已修正。
 const filterData=JSON.parse(fs.readFileSync('sources/trade-filters-en.json','utf8'));
 await page.route('https://www.pathofexile.com/**',route=>{
  const url=route.request().url();if(url.includes('/api/trade2/data/stats'))return route.fulfill({json:data});
  if(url.includes('/api/trade2/data/filters'))return route.fulfill({json:filterData});
  if(url.includes('/api/trade2/search/'))return route.fulfill({json:{received:JSON.parse(route.request().postData())}});
  return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><h1>Search</h1><input placeholder="Search"><div id="results"><span>+100 to maximum Life</span><span class="accountName">Search</span><span id="dynamic">Exalted Orb</span></div></body></html>'});
 });
 for(const name of ['data.js','engine.js','main.js'])await context.addInitScript({path:path.resolve('extension',name)});
 await page.goto('https://www.pathofexile.com/trade2/search/poe2/');
 await page.waitForFunction(()=>document.querySelector('h1').textContent==='搜尋');
 // 市集审校回归：单位、上架范围、清空按钮与动态结果数不改变原始输入。
 const reviewed=[['Physical DPS','物理每秒傷害'],['Elemental DPS','元素每秒傷害'],['Remove All','移除全部'],['Listed','上架時間'],['Up to an Hour Ago','最近 1 小時內'],['Showing 100 results (10000+ matched)','顯示 100 筆結果（符合 10000+ 筆）'],['listed 7 days ago','7 天前上架'],[': 13 Requires:',': 13 需求：'],['constructor','constructor']];
 // 裂痕在市集类别中不是联盟名；只替换显示文字，不修改请求标识。
 reviewed.push(['Breach','裂痕']);
 await page.evaluate(rows=>{const section=document.createElement('section');section.id='audit-trade';rows.forEach(([text])=>{const p=document.createElement('p');p.textContent=text;section.append(p)});document.body.append(section)},reviewed);
 await page.waitForFunction(()=>document.querySelector('#audit-trade p').textContent==='物理每秒傷害');
 assert.deepEqual(await page.locator('#audit-trade p').allTextContents(),reviewed.map(row=>row[1]));
 // 复刻实际空按钮 title 与带前导连字符的分页，不把词表单条命中当作实页通过。
 await page.evaluate(()=>{
  const fixture=document.createElement('section');fixture.id='trade-structure';
  fixture.innerHTML='<span class="filter-title">Blacklist<span id="blacklist-count"> - Showing 1-50 of 0 (Max 1000)</span></span><button id="layout-default" title="Default"></button><button id="layout-compact" title="Compact"></button><button id="layout-columns" title="Compact Two-Columned"></button><button id="original-hint">Search</button><span id="site-original-hint" title="Requires:">Requires:</span>';
  document.body.append(fixture);
 });
 await page.waitForFunction(()=>document.querySelector('#layout-compact').title==='緊湊');
 assert.equal(await page.locator('#blacklist-count').textContent(),' - 顯示 1-50／0 筆（上限 1000）');
 assert.equal(await page.locator('#layout-default').getAttribute('title'),'預設');
 assert.equal(await page.locator('#layout-columns').getAttribute('title'),'雙欄緊湊');
 assert.equal(await page.locator('#original-hint').getAttribute('title'),'Search');
 assert.equal(await page.locator('#site-original-hint').getAttribute('title'),'Requires:');
 await page.locator('#layout-compact').evaluate(el=>el.title='Default');
 await page.waitForFunction(()=>document.querySelector('#layout-compact').title==='預設');
 await page.locator('#blacklist-count').evaluate(el=>el.firstChild.nodeValue=' - Showing 51-100 of 120 (Max 1000)');
 await page.waitForFunction(()=>document.querySelector('#blacklist-count').textContent===' - 顯示 51-100／120 筆（上限 1000）');
 const filters=await page.evaluate(async()=>JSON.stringify(await(await fetch('/api/trade2/data/filters')).json()));
 assert(filters.includes('物理每秒傷害 (Physical DPS)'));assert(filters.includes('最近 1 小時內 (Up to an Hour Ago)'));
 assert.equal(await page.locator('.accountName').innerText(),'Search');assert.equal(await page.locator('input').getAttribute('placeholder'),'搜尋');
 const result=await page.evaluate(async()=>{const response=await fetch('/api/trade2/data/stats');const j=await response.json();return j.result.flatMap(x=>x.entries).find(x=>x.text.includes('最大生命'))});assert(result);assert.match(result.text,/\(/);
 const xhr=await page.evaluate(()=>new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('GET','/api/trade2/data/stats');x.responseType='json';x.onload=()=>resolve(x.response.result.flatMap(v=>v.entries).some(v=>v.text.includes('最大生命')));x.onerror=reject;x.send()}));assert(xhr);
 const xhrText=await page.evaluate(()=>new Promise(resolve=>{const x=new XMLHttpRequest();x.open('GET','/api/trade2/data/stats');x.onreadystatechange=()=>{if(x.readyState===4)resolve(JSON.parse(x.responseText).result.flatMap(v=>v.entries).some(v=>v.text.includes('最大生命')))};x.send()}));assert(xhrText);
 const body={query:{stats:[{filters:[{id:result.id,value:{min:100}}]}]}}, echoed=await page.evaluate(async body=>(await(await fetch('/api/trade2/search/poe2/Test',{method:'POST',body:JSON.stringify(body)})).json()).received,body);assert.deepEqual(echoed,body);
 await page.locator('#dynamic').evaluate(el=>el.textContent='Adds 12 to 24 Fire Damage');await page.waitForFunction(()=>document.querySelector('#dynamic').textContent.includes('附加12至24'));
 await page.evaluate(()=>{const el=document.createElement('span');el.id='new-result';el.textContent='35% increased Physical Damage';document.querySelector('#results').append(el)});await page.waitForFunction(()=>document.querySelector('#new-result').textContent.includes('35%物理傷害'));
 await page.screenshot({path:'tests/browser-check.png'});assert.deepEqual(errors,[]);
 await page.evaluate(()=>localStorage.setItem('poe2db-zh-settings-v1',JSON.stringify({enabled:false})));await page.reload();assert.equal(await page.locator('h1').innerText(),'Search');
 console.log('PASS: Chromium DOM, dynamic results, account exclusion, fetch, XHR json/text, canonical POST, disable');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});

