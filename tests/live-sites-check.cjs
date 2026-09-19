const fs=require('fs'),path=require('path'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext();try{
 const results=[];
 for(const url of ['https://pobb.in/','https://poe.ninja/poe2/builds','https://maxroll.gg/poe2','https://mobalytics.gg/poe-2','https://www.craftofexile.com/?game=poe2','https://www.pathofexile.com/']){
  const page=await context.newPage();try{const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
   for(const file of ['modules.js','data.js','engine.js','site-common.js','site-ninja.js','site-pobb.js','site-maxroll.js','site-mobalytics.js','site-craft.js','site-official.js'])await page.addScriptTag({path:path.resolve('extension',file)});
   const r=await page.evaluate(()=>{const id=POE2_MODULES.match(location.href),ui={...POE2_COMMON_UI,...POE2_SITE_UI[id]},engine=POE2ZH.create(POE2_ZH_DATA.records),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),matches=[];let n;while(n=walker.nextNode()){if(n.parentElement.closest('script,style,code,pre'))continue;const text=n.textContent.trim();const zh=ui[text]||engine.lookup(text)?.zh;if(zh&&zh!==text)matches.push({text,zh})}return {title:document.title,module:id,matchCount:matches.length,examples:matches.slice(0,8)}});results.push({url,status:response?.status(),...r});
  }catch(e){results.push({url,error:e.message.split('\n')[0]})}finally{await page.close()}
 }
 fs.writeFileSync('tests/live-sites-check.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
