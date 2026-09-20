const fs=require('fs'),path=require('path'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL||'msedge',headless:true});const context=await browser.newContext();try{
 const results=[];
 // 七个模块都采样；词库匹配仅用于发现候选缺漏，不等同于真实扩展验收。
 for(const url of ['https://pobb.in/','https://pobb.in/Jk5PC8sJXUxf','https://poe.ninja/poe2/builds','https://maxroll.gg/poe2','https://mobalytics.gg/poe-2','https://www.craftofexile.com/?game=poe2','https://beta.craftofexile.com/?game=poe2','https://www.pathofexile.com/','https://www.pathofexile.com/trade2/']){
  const page=await context.newPage();try{const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
   // 验证页不代表网站正文；保留 HTTP 状态，避免把 CSP 注入错误误报为扩展故障。
   const title=await page.title();
   if(response?.status()>=400||/just a moment|attention required|verify.*human/i.test(title)){
    results.push({url,status:response?.status(),title,blocked:true});continue;
   }
   for(const file of ['modules.js','data.js','engine.js','site-common.js','site-ninja.js','site-pobb.js','site-maxroll.js','site-mobalytics.js','site-craft.js','site-official.js'])await page.addScriptTag({path:path.resolve('extension',file)});
   // 给客户端页面短暂渲染时间，保留未匹配的可见短文本供人工校对。
   await page.waitForTimeout(2000);
   const r=await page.evaluate(()=>{
    const id=POE2_MODULES.match(location.href),ui={...POE2_COMMON_UI,...POE2_SITE_UI[id]};
    const lower=Object.fromEntries(Object.entries(ui).map(([en,zh])=>[en.toLowerCase(),zh]));
    const engine=POE2ZH.create(POE2_ZH_DATA.records),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),matches=[],missing=new Set();
    let n;while(n=walker.nextNode()){
     if(n.parentElement.closest('script,style,code,pre,textarea,input')||!n.parentElement.getClientRects().length)continue;
     const text=n.textContent.trim(),label=POE2ZH.norm(text).toLowerCase();
     const zh=(Object.hasOwn(lower,label)?lower[label]:null)||engine.lookup(text)?.zh;
     if(zh&&zh!==text)matches.push({text,zh});else if(/[a-z]{3}/i.test(text)&&text.length<200)missing.add(text);
    }
    return {title:document.title,module:id,matchCount:matches.length,examples:matches.slice(0,8),missing:[...missing].slice(0,100)};
   });results.push({url,status:response?.status(),...r});
  }catch(e){results.push({url,error:e.message.split('\n')[0]})}finally{await page.close()}
 }
 fs.writeFileSync('tests/live-sites-check.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
