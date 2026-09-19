const fs=require('fs');const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage(),out=[];
for(const name of JSON.parse(fs.readFileSync('sources/extra-pages.json','utf8'))){
 const a='sources/db-us-'+name+'.html',z='sources/db-tw-'+name+'.html';if(!fs.existsSync(a)||!fs.existsSync(z))continue;
 const pairs=await p.evaluate(([a,z,name])=>{const parse=s=>new DOMParser().parseFromString(s,'text/html');const en=parse(a),zh=parse(z),pairs=[];
 for(const selector of ['h1','.newItemPopup .itemHeader .itemName']){const es=[...en.querySelectorAll(selector)],zs=[...zh.querySelectorAll(selector)];if(es.length!==zs.length)continue;es.forEach((e,i)=>{const x=e.textContent.trim(),y=zs[i].textContent.trim();if(x&&y&&/[\u3400-\u9fff]/.test(y))pairs.push({en:x,zh:y,source:'https://poe2db.tw/tw/'+name+'#'+selector})})}return pairs;
 },[fs.readFileSync(a,'utf8'),fs.readFileSync(z,'utf8'),name]);out.push(...pairs);
}fs.writeFileSync('sources/db-extra-pairs.json',JSON.stringify(out,null,2));console.log('extra names',out.length);await b.close()})().catch(e=>{console.error(e);process.exitCode=1});
