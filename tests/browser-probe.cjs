const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();await p.setContent('<h1>Browser ready</h1>');console.log(await p.title(),await p.locator('h1').innerText());await b.close()})().catch(e=>{console.error(e);process.exitCode=1});
