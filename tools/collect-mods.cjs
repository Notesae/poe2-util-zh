const fs=require('fs');const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();const out=[];
for(const page of ['Runes','Soul_Core','Idol','Unique_item','Jewels']){
 const a=fs.readFileSync('sources/db-us-'+page+'.html','utf8'),z=fs.readFileSync('sources/db-tw-'+page+'.html','utf8');
 const rows=await p.evaluate(([a,z,page])=>{
 const parse=html=>{const doc=new DOMParser().parseFromString(html,'text/html'),map={};for(const col of doc.querySelectorAll('.col')){
  const link=col.querySelector('a[href]'),mods=[...col.querySelectorAll('.explicitMod,.implicitMod,.bondedMod')];if(!link||!mods.length)continue;
  const key=link.getAttribute('href');map[key]=mods.map(el=>{const clone=el.cloneNode(true);let i=0;const nums=[];for(const span of clone.querySelectorAll('.mod-value')){nums.push(span.textContent);span.textContent='{'+i+++'}'}return{cls:el.className,text:clone.textContent.trim(),nums}})
 }return map};
 const en=parse(a),zh=parse(z),pairs=[];
 for(const [key,rows]of Object.entries(en)){
  const zs=zh[key];if(!zs||rows.length!==zs.length)continue;
  let eb='',zb='';
  rows.forEach((row,i)=>{const t=zs[i];if(row.cls!==t.cls||JSON.stringify(row.nums)!==JSON.stringify(t.nums))return;
   let x=row.text,y=t.text;
   if(row.cls==='bondedMod'&&x==='Bonded:'){eb=x;zb=y;return}
   // Equipment labels are part of the source row, but not part of the trade modifier.
   if(['Runes','Soul_Core','Idol','Jewels'].includes(page)&&x.includes(': ')&&y.match(/[:：]/)){
    x=x.slice(x.indexOf(': ')+2);y=y.slice(y.search(/[:：]/)+1).trim();
   }
   if(row.cls==='bondedMod'&&eb){x=eb+' '+x;y=zb+' '+y}
   if(/[\u3400-\u9fff]/.test(y)&&x&&x!==y)pairs.push({en:x,zh:y,source:'https://poe2db.tw/tw/'+key+'#'+row.cls+'-'+i});
  });
 }return pairs;
 },[a,z,page]);out.push(...rows);console.log(page,rows.length);
}
fs.writeFileSync('sources/db-mod-pairs.json',JSON.stringify(out,null,2));await b.close()})().catch(e=>{console.error(e);process.exitCode=1});

