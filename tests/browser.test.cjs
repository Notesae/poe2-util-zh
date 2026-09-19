const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const data=JSON.parse(fs.readFileSync('sources/trade-stats-en.json','utf8'));
 await page.route('https://www.pathofexile.com/**',route=>{
  const url=route.request().url();if(url.includes('/api/trade2/data/stats'))return route.fulfill({json:data});
  if(url.includes('/api/trade2/search/'))return route.fulfill({json:{received:JSON.parse(route.request().postData())}});
  return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><h1>Search</h1><input placeholder="Search"><div id="results"><span>+100 to maximum Life</span><span class="accountName">Search</span><span id="dynamic">Exalted Orb</span></div></body></html>'});
 });
 for(const name of ['data.js','engine.js','main.js'])await context.addInitScript({path:path.resolve('extension',name)});
 await page.goto('https://www.pathofexile.com/trade2/search/poe2/');
 await page.waitForFunction(()=>document.querySelector('h1').textContent==='搜尋');
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

