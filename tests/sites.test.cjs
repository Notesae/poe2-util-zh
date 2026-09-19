const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const registry=require('../extension/modules.js');
assert.equal(registry.match('https://maxroll.gg/d4'),null);
assert.equal(registry.match('https://mobalytics.gg/lol'),null);
assert.equal(registry.match('https://poe.ninja/poe1/builds'),null);
assert.equal(registry.match('https://www.pathofexile.com/trade2/search/poe2'),'trade');
assert.equal(registry.match('https://www.pathofexile.com/forum'),'official');
assert.equal(registry.match('https://maxroll.gg.evil.test/poe2'),null);
assert.deepEqual(registry.settings({enabled:false,bilingual:true},'trade'),{enabled:false,bilingual:true});
assert.equal(registry.settings({enabled:false},'ninja').enabled,true);
(async()=>{
 const ext=path.resolve('extension'),profile=fs.mkdtempSync(path.resolve('tests/sites-profile-'));
 const context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
 try{
  const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const html=label=>`<!doctype html><html><head></head><body><h1>${label}</h1><div id="item">Exalted Orb</div><div id="dynamic">+100 to maximum Life</div><input value="Search" placeholder="Search"><select><option>Search</option></select><div class="accountName">Search</div><div contenteditable="true">Search</div><pre>Search</pre><div class="postContent">Search</div><a id="link" href="/original?q=Search">Home</a><button title="Search" aria-label="Search">Search</button></body></html>`;
  await context.route(/^https:\/\//,r=>r.fulfill({contentType:'text/html',body:html(new URL(r.request().url()).searchParams.get('label')||'Search')}));
  const page=await context.newPage(),cdp=await context.newCDPSession(page);let extensionId;
  cdp.on('Runtime.executionContextCreated',async({context:ctx})=>{if(!ctx.auxData?.isDefault){try{const r=await cdp.send('Runtime.evaluate',{expression:'chrome.runtime.id',contextId:ctx.id,returnByValue:true});if(r.result.value)extensionId=r.result.value}catch{}}});
  await cdp.send('Runtime.enable');
  await page.goto('https://poe.ninja/poe2/builds?label=Economy');
  await page.waitForFunction(()=>document.querySelector('h1').textContent==='經濟');
  assert(extensionId,'Extension isolated context must expose its id');
  const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForSelector('#official-enabled');assert.equal(await popup.locator('.module').count(),7);
  const set=async(id,enabled,bilingual=false)=>popup.evaluate(({id,enabled,bilingual})=>chrome.storage.local.set({['module.'+id]:{enabled,bilingual}}),{id,enabled,bilingual});
  const cases=[['ninja','https://poe.ninja/poe2/builds','Economy','經濟'],['pobb','https://pobb.in/example','Share your Build','分享你的構築'],['maxroll','https://maxroll.gg/poe2','Build Guides','流派指南'],['mobalytics','https://mobalytics.gg/poe-2','Starter Builds','開荒流派'],['craft','https://www.craftofexile.com/','Calculator','計算器'],['official','https://www.pathofexile.com/','Patch Notes','更新公告']];
  for(const [id,url,label,zh]of cases){
   await page.goto(url+'?label='+encodeURIComponent(label));await page.waitForFunction(zh=>document.querySelector('h1').textContent===zh,zh);
   assert.equal(await page.locator('#item').innerText(),'崇高石');assert.equal(await page.locator('input').inputValue(),'Search');assert.equal(await page.locator('select').inputValue(),'Search');
   for(const sel of ['.accountName','[contenteditable]','pre','.postContent'])assert.equal(await page.locator(sel).innerText(),'Search');
   assert.equal(await page.locator('#link').getAttribute('href'),'/original?q=Search');
   assert.equal(await page.locator('input').getAttribute('placeholder'),'搜尋');
   await page.locator('#dynamic').evaluate(el=>el.textContent='+250 to maximum Life');await page.waitForFunction(()=>document.querySelector('#dynamic').textContent.includes('250最大生命'));
   await set(id,false);await page.waitForFunction(label=>document.querySelector('h1').textContent===label,label);assert.equal(await page.locator('#dynamic').innerText(),'+250 to maximum Life');assert.equal(await page.locator('input').getAttribute('placeholder'),'Search');
   await set(id,true,true);await page.waitForFunction(label=>document.querySelector('h1').textContent.includes('('+label+')'),label);
   await page.reload();await page.waitForFunction(label=>document.querySelector('h1').textContent.includes('('+label+')'),label);
   await set(id,true);await page.waitForFunction(zh=>document.querySelector('h1').textContent===zh,zh);
  }
  await page.goto('https://maxroll.gg/poe2?label=Build%20Guides');await page.waitForFunction(()=>document.querySelector('h1').textContent==='流派指南');
  await set('ninja',false);assert.equal(await page.locator('h1').innerText(),'流派指南');
  await page.evaluate(()=>history.pushState({},'','/d4'));await page.waitForFunction(()=>document.querySelector('h1').textContent==='Build Guides');
  await page.evaluate(()=>history.pushState({},'','/poe2'));await page.waitForFunction(()=>document.querySelector('h1').textContent==='流派指南');
  await page.goto('https://www.pathofexile.com/trade2/search/poe2/');await page.waitForFunction(()=>document.querySelector('h1').textContent==='搜尋');
  await set('official',false);assert.equal(await page.locator('h1').innerText(),'搜尋');
  await set('trade',false);await page.waitForFunction(()=>document.querySelector('h1').textContent==='Search');
  await set('official',true);assert.equal(await page.locator('h1').innerText(),'Search');
  await set('trade',true);await page.waitForFunction(()=>document.querySelector('h1').textContent==='搜尋');
  await popup.reload();await popup.waitForSelector('#ninja-enabled');assert.equal(await popup.locator('#ninja-enabled').isChecked(),false);assert.equal(await popup.locator('#maxroll-enabled').isChecked(),true);
  await popup.locator('#ninja-enabled').check();assert.equal((await popup.evaluate(()=>chrome.storage.local.get('module.ninja')))['module.ninja'].enabled,true);
  await popup.setViewportSize({width:560,height:600});await popup.screenshot({path:'tests/modules-popup.png',fullPage:true});assert(await popup.evaluate(()=>document.body.scrollHeight<=600),'Popup fits browser height limit');
  assert(await popup.evaluate(()=>{const grid=document.querySelector('#modules');return grid.scrollHeight===grid.clientHeight&&document.documentElement.scrollWidth<=560}),'All cards fit without nested or horizontal scrolling');assert.deepEqual(errors,[]);
  console.log('PASS: six actual MV3 site modules, 7 popup controls, live restore, bilingual persistence, dynamic values, protected fields, SPA routing, trade/official isolation');
 }finally{await context.close();const resolved=path.resolve(profile);assert.equal(path.dirname(resolved),path.resolve('tests'));assert(path.basename(resolved).startsWith('sites-profile-'));fs.rmSync(resolved,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
