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
 // CI 使用支持未打包扩展的 Chromium，本地默认保留 Edge 验证。
 const context=await chromium.launchPersistentContext(profile,{channel:process.env.TEST_BROWSER_CHANNEL||'msedge',headless:true,args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
 try{
  const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const html=label=>`<!doctype html><html><head></head><body><h1>${label}</h1><div id="item">Exalted Orb</div><div id="dynamic">+100 to maximum Life</div><input value="Search" placeholder="Search"><select><option>Search</option></select><div class="accountName">Search</div><div contenteditable="true">Search</div><pre>Search</pre><div class="postContent">Search</div><a id="link" href="/original?q=Search">Home</a><button title="Search" aria-label="Search">Search</button></body></html>`;
  await context.route(/^https:\/\//,r=>r.fulfill({contentType:'text/html',body:html(new URL(r.request().url()).searchParams.get('label')||'Search')}));
  const page=await context.newPage(),cdp=await context.newCDPSession(page);let extensionId;
  // 冷启动加载大型词库时给导航留出余量，译文就绪仍由后续断言验证。
  page.setDefaultNavigationTimeout(60000);
  cdp.on('Runtime.executionContextCreated',async({context:ctx})=>{if(!ctx.auxData?.isDefault){try{const r=await cdp.send('Runtime.evaluate',{expression:'chrome.runtime.id',contextId:ctx.id,returnByValue:true});if(r.result.value)extensionId=r.result.value}catch{}}});
  await cdp.send('Runtime.enable');
  // 初始化只等待 DOM；扩展词库与译文就绪由后续断言等待，不依赖浏览器 load 收尾。
  await page.goto('https://poe.ninja/poe2/builds?label=Economy',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('h1').textContent==='經濟');
  assert(extensionId,'Extension isolated context must expose its id');
  const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForSelector('#official-enabled');assert.equal(await popup.locator('.module').count(),7);
  const set=async(id,enabled,bilingual=false)=>popup.evaluate(({id,enabled,bilingual})=>chrome.storage.local.set({['module.'+id]:{enabled,bilingual}}),{id,enabled,bilingual});
  const cases=[['ninja','https://poe.ninja/poe2/builds','Economy','經濟'],['pobb','https://pobb.in/example','Share your Build','分享你的構築'],['maxroll','https://maxroll.gg/poe2','Build Guides','流派指南'],['mobalytics','https://mobalytics.gg/poe-2','Starter Builds','開荒流派'],['craft','https://www.craftofexile.com/','Calculator','計算器'],['official','https://www.pathofexile.com/','Patch Notes','更新公告']];
  // 各站实页标签的代表用例，验证网站词表优先于游戏词库。
  const reviewedLabels={ninja:['Available Leagues','可用聯盟'],pobb:['Phys Max Hit','物理最大可承受傷害'],maxroll:['Meta','主流玩法'],mobalytics:['Endgame Guides Hub','終局指南總覽'],craft:['Choose base group','選擇基底分類'],official:['Read More.','閱讀更多。']};
  // 审校标签同时覆盖站点词义覆盖、严格动态模板和词库来源派生的别名。
  const auditLabels={
   ninja:[['Omens','預兆'],['Idols','魔偶'],['Volume / Hour','每小時交易量'],['Two Handed Mace / Sceptre','雙手錘／權杖']],
   pobb:[['History','歷史'],['2 months ago','2 個月前'],['Skilltree Preview','天賦樹預覽'],['26% Shock, 3x Frenzy, 3x Power, Custom Mods','26% 感電，3 層狂怒球，3 層暴擊球，自訂詞綴']],
   maxroll:[],
   mobalytics:[['Top','熱門'],['New','最新'],['Show 101 results','顯示 101 筆結果'],['1.3 K Favorites','1.3 K 次收藏'],['Characters remain: 300000','剩餘 300000 字'],['Witch Hunter','女巫獵人'],['Str: 80','力量：80'],['S Tier','S 級'],['30% increased Charm Charges gained, +1 Charm Slot','增加30%護符充能獲取，+1護符欄位'],['Grants Skill: Cast on Block','賦予技能：格擋時施放']],
   craft:[['Body Armours (INT)','胸甲（INT）'],['Executed in 42.246 秒','執行耗時 42.246 秒'],['Choose a crafting method','選擇製作方式']],
   official:[['Expand','展開'],['105 viewers','105 人觀看'],['29% Off','折扣 29%'],['Skill Effects','技能特效']]
  };
  // 新核实术语覆盖真实站点模块；未知技能和作者正文仍由既有保护规则保留。
  auditLabels.ninja.push(['Lineage Gems','族裔輔助寶石']);
  auditLabels.ninja.push(['Active','進行中'],['Previous League','過往聯盟'],['Currency Exchange data is aggregated and provided by Grinding Gear Games in hourly chunks, so prices may have up to an hour delay.','通貨交易所資料由 Grinding Gear Games 每小時彙整提供，因此價格最多可能延遲一小時。']);
  auditLabels.mobalytics.push(['Grants Skill: Level (1-20) Chaotic Infusion','賦予技能：等級 (1-20) 混沌灌注']);
  auditLabels.mobalytics.push(['Invoker','祈靈者'],['Grants Skill: Chaotic Infusion','賦予技能：混沌灌注'],['Grants Skill: Level 18 Chaotic Surge','賦予技能：等級 18 混沌波動'],['Grants Skill: Level 19 Unknown Skill','Grants Skill: Level 19 Unknown Skill']);
  auditLabels.craft.push(['Strongboxes','保險箱']);
  auditLabels.official.push(["Kirac's Vault Pass",'基拉克的秘寶指南']);
  for(const [id,url,label,zh]of cases){
   console.log('Testing site:',id);
   await page.goto(url+'?label='+encodeURIComponent(label));await page.waitForFunction(zh=>document.querySelector('h1').textContent===zh,zh);
   await page.waitForSelector('#poe2zh-widget');
   assert.equal(await page.locator('#poe2zh-widget').count(),1,'One widget on each supported site');
   assert.equal(await page.locator('#item').innerText(),'崇高石');assert.equal(await page.locator('input[placeholder]').inputValue(),'Search');assert.equal(await page.locator('select').inputValue(),'Search');
   for(const sel of ['.accountName','[contenteditable]','pre','.postContent'])assert.equal(await page.locator(sel).innerText(),'Search');
   assert.equal(await page.locator('#link').getAttribute('href'),'/original?q=Search');
   assert.equal(await page.locator('input[placeholder]').getAttribute('placeholder'),'搜尋');
   await page.locator('#dynamic').evaluate(el=>el.textContent='+250 to maximum Life');await page.waitForFunction(()=>document.querySelector('#dynamic').textContent.includes('250最大生命'));
   await set(id,false);await page.waitForFunction(label=>document.querySelector('h1').textContent===label,label);assert.equal(await page.locator('#dynamic').innerText(),'+250 to maximum Life');assert.equal(await page.locator('input[placeholder]').getAttribute('placeholder'),'Search');
   await set(id,true,true);await page.waitForFunction(label=>document.querySelector('h1').textContent.includes('('+label+')'),label);
   await page.reload();await page.waitForFunction(label=>document.querySelector('h1').textContent.includes('('+label+')'),label);
   await set(id,true);await page.waitForFunction(zh=>document.querySelector('h1').textContent===zh,zh);
   // 富文本数值保持节点身份及上标；辅助属性动态更新与关闭恢复均验证。
   await page.evaluate(labels=>{
    const fixture=document.createElement('section');fixture.id='audit-fixture';
    fixture.innerHTML='<p id="audit-es">Energy Shield: <span class="value">12,505</span><sup>271%</sup></p><img id="audit-alt" alt="Exalted Orb"><p id="audit-prose">Hold <kbd>Alt</kbd> <span>and</span> <kbd>Ctrl</kbd></p><p id="audit-range">7<span>(5-10)</span>% of Damage is taken from Mana before Life</p>';
    labels.forEach(([text],index)=>{const label=document.createElement('p');label.id='audit-label-'+index;label.textContent=text;fixture.append(label)});
    document.body.append(fixture);window.auditOriginal=fixture.innerHTML;window.auditSup=fixture.querySelector('sup');
   },auditLabels[id]);
   await page.waitForFunction(()=>document.querySelector('#audit-es').firstChild.nodeValue==='能量護盾： ');
   assert.equal(await page.locator('#audit-es .value').innerText(),'12,505');
   assert.equal(await page.locator('#audit-es sup').innerText(),'271%');
   assert(await page.evaluate(()=>document.querySelector('#audit-es sup')===window.auditSup));
   assert.equal(await page.locator('#audit-prose').innerText(),'Hold Alt and Ctrl');
   assert.equal(await page.locator('#audit-alt').getAttribute('alt'),'崇高石');
   assert.equal(await page.locator('#audit-range').innerText(),'生命值所受的7(5-10)%傷害由魔力扣除');
   for(const [index,[,zh]]of auditLabels[id].entries())assert.equal(await page.locator('#audit-label-'+index).innerText(),zh);
   await page.locator('#audit-alt').evaluate(el=>el.alt='Search');
   await page.locator('#audit-es sup').evaluate(el=>el.firstChild.nodeValue='280%');
   await page.waitForFunction(()=>document.querySelector('#audit-alt').alt==='搜尋');
   assert.equal(await page.locator('#audit-es sup').innerText(),'280%');
   assert.equal(await page.locator('#audit-es .value').innerText(),'12,505');
   await set(id,true,true);
   await page.waitForFunction(()=>document.querySelector('#audit-alt').alt==='搜尋 (Search)');
   assert.equal(await page.locator('#audit-es sup').innerText(),'280%');
   await set(id,false);
   await page.waitForFunction(()=>document.querySelector('#audit-alt').alt==='Search');
   assert.equal(await page.locator('#audit-fixture').innerHTML(),await page.evaluate(()=>window.auditOriginal.replace('alt="Exalted Orb"','alt="Search"').replace('271%','280%')));
   await set(id,true);
   await page.waitForFunction(zh=>document.querySelector('h1').textContent===zh,zh);
   // 六站都覆盖拆分词缀、带数值标签、冒号、原生下拉及不应匹配的对象属性名。
   await page.evaluate(([label])=>{
    const fixture=document.createElement('section');fixture.id='review-fixture';
    fixture.innerHTML='<h2 id="review-label"></h2><p id="review-stat">Adds <span id="review-number">12</span> to <span>24</span> Fire Damage</p><p id="review-value">Life: <span>1,234</span></p><p id="review-colon">Life：</p><p id="review-unknown">constructor</p><select id="review-select"><option value="search-id">Search</option><option>Search</option></select>';
    fixture.querySelector('h2').textContent=label;document.body.append(fixture);
   },reviewedLabels[id]);
   await page.waitForFunction(zh=>document.querySelector('#review-label').textContent===zh,reviewedLabels[id][1]);
   if(id==='craft'){
    // 复刻旧版提示框的 init/focused 与 initerm 行为，检验提示翻译不会污染用户输入。
    await page.evaluate(()=>{
     const fixture=document.createElement('div');fixture.innerHTML='<input id="poecSearchBaseInput" class="init left" value="Search for a base or item"><input id="poecSearchAffixInput" class="init left" value="Search for an affix"><input id="unrelated-hint" class="init" value="Search for an affix">';document.body.append(fixture);
     for(const input of fixture.querySelectorAll('input:not(#unrelated-hint)')){
      input.addEventListener('focus',()=>{if(input.classList.contains('init')){input.setAttribute('initerm',input.value);input.value='';input.classList.remove('init')}input.classList.add('focused')});
      input.addEventListener('blur',()=>{input.classList.remove('focused');if(!input.value){input.value=input.getAttribute('initerm');input.classList.add('init')}});
     }
    });
    await page.waitForFunction(()=>document.querySelector('#poecSearchBaseInput').value==='搜尋基底或物品');
    assert.equal(await page.locator('#poecSearchAffixInput').inputValue(),'搜尋詞綴');
    assert.equal(await page.locator('#unrelated-hint').inputValue(),'Search for an affix');
    await page.locator('#poecSearchBaseInput').focus();
    assert.equal(await page.locator('#poecSearchBaseInput').inputValue(),'');
    assert.equal(await page.locator('#poecSearchBaseInput').getAttribute('initerm'),'Search for a base or item');
    await page.locator('#poecSearchBaseInput').fill('Search for a base or item');
    await page.locator('#poecSearchAffixInput').focus();
    await set(id,true,true);
    assert.equal(await page.locator('#poecSearchBaseInput').inputValue(),'Search for a base or item');
    assert.equal(await page.locator('#poecSearchAffixInput').inputValue(),'');
    await page.locator('#unrelated-hint').focus();
    await page.waitForFunction(()=>document.querySelector('#poecSearchAffixInput').value==='搜尋詞綴 (Search for an affix)');
    await set(id,false);
    await page.waitForFunction(()=>document.querySelector('#poecSearchAffixInput').value==='Search for an affix');
    assert.equal(await page.locator('#poecSearchBaseInput').inputValue(),'Search for a base or item');
    assert.equal(await page.locator('#poecSearchBaseInput').getAttribute('value'),'Search for a base or item');
    await set(id,true);
    await page.locator('#review-label').evaluate(el=>el.textContent='Emulate directly in\n the crafting interface');
    await page.waitForFunction(()=>document.querySelector('#review-label').textContent==='直接在製作介面中模擬');
    // 从实页抽取的作用域结构：同形词只在条件组／快捷键说明中覆盖。
    await page.evaluate(()=>{
     const fixture=document.createElement('section');fixture.id='craft-context';
     fixture.innerHTML='<div id="calculatorZone"><div class="requirements"><h4>Requirements</h4><div id="groupTypeChooser"><ul><li value="and">And</li><li value="or">Or</li><li value="not">Not</li></ul></div></div></div><div id="instructions">Hit <img alt=""> + <div class="keyboardKey">Z</div> to <span>revert</span> emulator actions.</div><div id="filterSelector"><ul><li>Non-Caster</li><li>Non-Resistance</li></ul></div><div id="categoriesSelector"><span>Relic</span></div><p id="craft-gear-requirement">Requirements</p>';
     // 六条说明按实页的文字／图标边界构造，验证中文顺序和图标身份。
     fixture.querySelector('#instructions').innerHTML='<div id="instruction-hover"><div class="keyboardKey">Hover</div> over an item and <img alt=""> to <span>apply</span> the currently selected crafting method to it.</div><div id="instruction-alt">Hold <img alt=""> to toggle between <span>advanced</span> and <span>classic</span> modifier descriptions for items.</div><div id="instruction-shift">Hold <img alt=""> to force <span>tooltips</span> to stay visible and enable the ability to drill-down.</div><div id="instruction-undo">Hit <img alt=""> + <div class="keyboardKey">Z</div> to <span>revert</span> emulator actions.</div><div id="instruction-left">Left <img alt=""> to <span>add</span> or <span>remove</span> modifiers from the modpool to the current item.</div><div id="instruction-right">Right <img alt=""> to access the context menu <span>options</span> for elements.</div>';
     window.instructionImages=[...fixture.querySelectorAll('#instructions img')];
     document.body.append(fixture);window.craftContextOriginal=fixture.innerHTML;
    });
    await page.waitForFunction(()=>document.querySelector('#calculatorZone h4').textContent==='計算條件');
    assert.deepEqual(await page.locator('#groupTypeChooser li').allTextContents(),['全部符合','任一符合','不符合']);
    assert.equal(await page.locator('#groupTypeChooser li').first().getAttribute('value'),'and');
    assert.match(await page.locator('#instructions').innerText(),/按下/);
    assert.equal(await page.locator('#instruction-undo .keyboardKey').innerText(),'Z');
    assert.deepEqual(await page.locator('#instructions > div').allTextContents().then(rows=>rows.map(text=>text.replace(/\s/g,''))),['將游標移到物品上，並按以套用目前選擇的製作方式。','按住以切換進階與一般物品詞綴說明。','按住可讓物品提示保持顯示，並查看更詳細的內容。','按下+Z以復原製作模擬操作。','按左鍵以新增或移除目前物品的詞綴（從詞綴池選取）。','按右鍵即可查看該元素的選單選項。']);
    assert(await page.evaluate(()=>window.instructionImages.every((node,index)=>document.querySelectorAll('#instructions img')[index]===node)));
    assert.deepEqual(await page.locator('#filterSelector li').allTextContents(),['非法術','非抗性']);
    assert.equal(await page.locator('#categoriesSelector').innerText(),'聖物');
    assert.equal(await page.locator('#craft-gear-requirement').innerText(),'物品需求');
    // 需求数值与标点分属不同节点，保留节点身份并只翻译标签。
    await page.evaluate(()=>{
     const fixture=document.createElement('div');fixture.id='craft-requirement-audit';
     fixture.innerHTML='<div class="property"><label>Requires level:</label><div id="craft-numbers">80<span class="label">, Int</span> 121</div></div><p id="unrelated-int">80, Int 121</p>';
     document.body.append(fixture);window.craftRequirementOriginal=fixture.innerHTML;window.craftNumberNodes=[...fixture.querySelector('#craft-numbers').childNodes];
    });
    await page.waitForFunction(()=>document.querySelector('#craft-numbers').textContent==='80, 智慧 121');
    assert.equal(await page.locator('#unrelated-int').innerText(),'80, Int 121');
    assert(await page.evaluate(()=>window.craftNumberNodes.every((node,index)=>document.querySelector('#craft-numbers').childNodes[index]===node)));
    await page.locator('#craft-numbers').evaluate(el=>el.lastChild.nodeValue=' 150');
    await page.waitForFunction(()=>document.querySelector('#craft-numbers').textContent==='80, 智慧 150');
    await set(id,false);await page.waitForFunction(()=>document.querySelector('#craft-context').innerHTML===window.craftContextOriginal);
    assert.equal(await page.locator('#craft-requirement-audit').innerHTML(),await page.evaluate(()=>window.craftRequirementOriginal.replace(' 121</div>',' 150</div>')));
    await set(id,true);await page.waitForFunction(()=>document.querySelector('#calculatorZone h4').textContent==='計算條件');
   }
   if(id==='pobb'){
    await page.locator('#review-label').evaluate(el=>el.textContent='Tree Preview');
    await page.waitForFunction(()=>document.querySelector('#review-label').textContent==='天賦樹預覽');
    // 表单辅助标签可以翻译，但原始值与显式保护区内的属性不得改变。
    await page.evaluate(()=>{
     const fixture=document.createElement('section');fixture.id='form-audit';
     fixture.innerHTML='<textarea id="build-code" aria-label="Path of Building buildcode">Search</textarea><input id="form-label" aria-label="Search" value="Search"><textarea id="protected-code" translate="no" aria-label="Path of Building buildcode">Search</textarea><div class="notranslate"><input id="protected-placeholder" placeholder="Search" value="Search"></div><img id="asc-icon" alt="Ascendancy Thumbnail">';
     document.body.append(fixture);window.formAuditOriginal=fixture.innerHTML;
    });
    await page.waitForFunction(()=>document.querySelector('#build-code').getAttribute('aria-label')==='Path of Building 構築代碼');
    assert.equal(await page.locator('#build-code').inputValue(),'Search');
    assert.equal(await page.locator('#build-code').textContent(),'Search');
    assert.equal(await page.locator('#form-label').getAttribute('aria-label'),'搜尋');
    assert.equal(await page.locator('#form-label').inputValue(),'Search');
    assert.equal(await page.locator('#protected-code').getAttribute('aria-label'),'Path of Building buildcode');
    assert.equal(await page.locator('#protected-placeholder').getAttribute('placeholder'),'Search');
    assert.equal(await page.locator('#asc-icon').getAttribute('alt'),'昇華職業縮圖');
    await page.locator('#build-code').fill('User build code 123');
    await page.locator('#build-code').evaluate(el=>el.setAttribute('aria-label','Search'));
    await page.waitForFunction(()=>document.querySelector('#build-code').getAttribute('aria-label')==='搜尋');
    await set(id,true,true);await page.waitForFunction(()=>document.querySelector('#build-code').getAttribute('aria-label')==='搜尋 (Search)');
    assert.equal(await page.locator('#build-code').inputValue(),'User build code 123');
    await set(id,false);await page.waitForFunction(()=>document.querySelector('#build-code').getAttribute('aria-label')==='Search');
    assert.equal(await page.locator('#form-audit').innerHTML(),await page.evaluate(()=>window.formAuditOriginal.replace('id="build-code" aria-label="Path of Building buildcode"','id="build-code" aria-label="Search"')));
    assert.equal(await page.locator('#build-code').inputValue(),'User build code 123');
    await set(id,true);await page.waitForFunction(()=>document.querySelector('#build-code').getAttribute('aria-label')==='搜尋');
   }
   if(id==='mobalytics'){
    await page.locator('#review-label').evaluate(el=>el.textContent='Save Draft');
    await page.waitForFunction(()=>document.querySelector('#review-label').textContent==='儲存草稿');
    // 按实页创建零子元素的相邻文本节点，不能用单个 textContent 替代此用例。
    await page.evaluate(()=>{
     const fixture=document.createElement('section');fixture.id='split-audit';
     fixture.innerHTML='<div id="split-set"></div><div id="split-optional"></div><div role="dialog"><button id="sort-new">New</button></div><a href="/another-game" id="new-game"><span>New</span></a><p id="armour-stat">Armour: 269</p><p id="evasion-stat">Evasion: 16</p><ul role="listbox"><li role="option">30% increased Charm Charges gained, +1 Charm Slot</li><li role="option">30% increased Charm Effect Duration, +1 Charm Slot</li></ul>';
     fixture.querySelector('#split-set').append(document.createTextNode('set 1'),document.createTextNode(':'));
     fixture.querySelector('#split-optional').append(document.createTextNode('('),document.createTextNode('Optional'),document.createTextNode(')'));
     document.body.append(fixture);window.splitOriginal=fixture.innerHTML;window.splitNodes=[...fixture.querySelector('#split-set').childNodes];
    });
    await page.waitForFunction(()=>document.querySelector('#split-set').textContent==='第 1 組：');
    assert.equal(await page.locator('#split-optional').innerText(),'（選填）');
    assert.equal(await page.locator('#sort-new').innerText(),'最新');
    assert.equal(await page.locator('#new-game').innerText(),'新');
    assert.equal(await page.locator('#armour-stat').innerText(),'護甲值：269');
    assert.equal(await page.locator('#evasion-stat').innerText(),'閃避值：16');
    assert.deepEqual(await page.locator('#split-audit [role="option"]').allTextContents(),['增加30%護符充能獲取，+1護符欄位','增加30%護符效果持續時間，+1護符欄位']);
    await page.locator('#split-set').evaluate(el=>el.firstChild.nodeValue='set 2');
    await page.waitForFunction(()=>document.querySelector('#split-set').textContent==='第 2 組：');
    assert(await page.evaluate(()=>window.splitNodes.every((node,index)=>document.querySelector('#split-set').childNodes[index]===node)));
    await set(id,true,true);await page.waitForFunction(()=>document.querySelector('#split-set').textContent==='第 2 組： (set 2:)');
    await set(id,false);await page.waitForFunction(()=>document.querySelector('#split-set').textContent==='set 2:');
    assert.equal(await page.locator('#split-audit').innerHTML(),await page.evaluate(()=>window.splitOriginal.replace('set 1:','set 2:')));
    await set(id,true);await page.waitForFunction(()=>document.querySelector('#split-set').textContent==='第 2 組：');
   }
   if(id==='official'){
    // 商品名与价格数字原样保留，只翻译站点固定折扣句尾。
    await page.evaluate(()=>{
     const fixture=document.createElement('section');fixture.id='official-copy-audit';
     fixture.innerHTML='<p>Nightfall Armour Pack discounted to 295 Points</p><p>Help and Information</p><p>For technical support and troubleshooting</p><div class="postContent">Nightfall Armour Pack discounted to 295 Points</div>';
     document.body.append(fixture);
    });
    await page.waitForFunction(()=>document.querySelector('#official-copy-audit p').textContent==='Nightfall Armour Pack 特價 295 點數');
    assert.deepEqual(await page.locator('#official-copy-audit p').allTextContents(),['Nightfall Armour Pack 特價 295 點數','協助與資訊','技術支援與疑難排解']);
    assert.equal(await page.locator('#official-copy-audit .postContent').innerText(),'Nightfall Armour Pack discounted to 295 Points');
   }
   await page.waitForFunction(()=>document.querySelector('#review-stat').textContent==='附加12至24火焰傷害').catch(async error=>{throw new Error(id+': '+await page.locator('#review-fixture').innerHTML(),{cause:error})});
   assert.equal(await page.locator('#review-value').innerText(),'生命：1,234');
   assert.equal(await page.locator('#review-colon').innerText(),'生命：');
   assert.equal(await page.locator('#review-unknown').innerText(),'constructor');
   assert.deepEqual(await page.locator('#review-select option').allTextContents(),['搜尋','Search']);
   assert.equal(await page.locator('#review-select').inputValue(),'search-id');
   await page.locator('#review-number').evaluate(el=>el.firstChild.nodeValue='15');
   await page.waitForFunction(()=>document.querySelector('#review-stat').textContent==='附加15至24火焰傷害');
   await set(id,true,true);
   await page.waitForFunction(()=>document.querySelector('#review-stat').textContent==='附加15至24火焰傷害 (Adds 15 to 24 Fire Damage)');
   await set(id,false);
   await page.waitForFunction(()=>document.querySelector('#review-stat').textContent==='Adds 15 to 24 Fire Damage');
   assert.equal(await page.locator('#review-value').innerText(),'Life: 1,234');
   await set(id,true);
  }
  await page.goto('https://mobalytics.gg/poe-2/builds/example');
  // 复刻实页 li > span：三种跨行词缀、动态更新、禁译区、上标和恢复均保留节点身份。
  await page.evaluate(()=>{
   const fixture=document.createElement('main');fixture.id='wrapped-mods';
   fixture.innerHTML='<table><tbody><tr><td><ul><li><span id="wrapped-lightning">On Hitting an enemy, gains maximum added Lightning damage equal to</span></li><li><span>the enemy\'s Power for 20 seconds, up to a total of 500</span></li><li><span id="wrapped-ammo">Bolts fired by Crossbow Attacks have 100% chance to not</span></li><li><span>expend Ammunition if you\'ve Reloaded Recently</span></li><li><span id="wrapped-blood">Inflict Corrupted Blood for 5 seconds on Block, dealing 50% of</span></li><li><span>your maximum Life as Physical damage per second</span></li></ul><ul translate="no"><li><span>Inflict Corrupted Blood for 5 seconds on Block, dealing 50% of</span></li><li><span>your maximum Life as Physical damage per second</span></li></ul><ul><li><span>On Hitting an enemy, gains maximum added Lightning damage equal to</span></li><li><sup id="protected-sup">the enemy\'s Power for 20 seconds, up to a total of 500</sup></li></ul></td></tr></tbody></table>';
   for(const name of ['lightning','ammo','blood'])fixture.querySelector('#wrapped-'+name).parentElement.nextElementSibling.firstChild.id='wrapped-'+name+'-last';
   document.body.append(fixture);window.wrappedOriginal=fixture.innerHTML;
   window.wrappedNodes=[...fixture.querySelectorAll('span')].map(el=>[el,el.firstChild]);
   // 模拟编辑器的空项规范化：任何被扩展清空的列表项会立即被重建为 br。
   window.emptyItemRewrites=0;
   window.editorObserver=new MutationObserver(()=>{for(const li of fixture.querySelectorAll('li'))if(!li.textContent.trim()&&!li.querySelector('br')){li.innerHTML='<br>';window.emptyItemRewrites++}});
   window.editorObserver.observe(fixture,{subtree:true,characterData:true,childList:true});
  });
  await page.waitForFunction(()=>document.querySelector('#wrapped-blood-last')?.textContent.includes('50%的物理傷害'));
  assert.match(await page.locator('#wrapped-lightning-last').textContent(),/最高總計500/);
  assert.match(await page.locator('#wrapped-ammo').textContent(),/100%/);
  assert.equal(await page.locator('#wrapped-ammo-last').textContent(),'不會消耗彈藥');
  assert.equal(await page.locator('#wrapped-mods [translate="no"] li').first().textContent(),'Inflict Corrupted Blood for 5 seconds on Block, dealing 50% of');
  assert.equal(await page.locator('#protected-sup').textContent(),"the enemy's Power for 20 seconds, up to a total of 500");
  await page.locator('#wrapped-blood').evaluate(el=>el.firstChild.nodeValue='Inflict Corrupted Blood for 8 seconds on Block, dealing 60% of');
  await page.waitForFunction(()=>document.querySelector('#wrapped-blood-last').textContent.includes('60%的物理傷害'));
  assert.match(await page.locator('#wrapped-blood').textContent(),/持續8秒/);
  await set('mobalytics',true,true);
  await page.waitForFunction(()=>document.querySelector('#wrapped-blood').textContent.includes('(Inflict Corrupted Blood for 8 seconds'));
  assert.equal(await page.evaluate(()=>window.wrappedNodes.every(([el,node])=>el.isConnected&&el.firstChild===node)),true);
  await set('mobalytics',false);
  await page.waitForFunction(()=>document.querySelector('#wrapped-mods').innerHTML===window.wrappedOriginal.replace('5 seconds on Block, dealing 50%','8 seconds on Block, dealing 60%'));
  await set('mobalytics',true);
  await page.waitForFunction(()=>document.querySelector('#wrapped-blood-last').textContent.includes('60%的物理傷害'));
  // 网站只替换后半项、再重建整个列表时，仍从新的英文节点配对，且从不制造空项。
  await page.locator('#wrapped-lightning-last').evaluate(el=>{const next=document.createElement('span');next.id=el.id;next.textContent="the enemy's Power for 20 seconds, up to a total of 900";el.replaceWith(next)});
  await page.waitForFunction(()=>document.querySelector('#wrapped-lightning-last').textContent==='最高總計900');
  await page.evaluate(()=>{document.querySelector('#wrapped-mods').innerHTML=window.wrappedOriginal});
  await page.waitForFunction(()=>document.querySelector('#wrapped-blood-last').textContent.includes('50%的物理傷害'));
  assert.equal(await page.evaluate(()=>window.emptyItemRewrites),0);
  await set('mobalytics',false);
  await page.waitForFunction(()=>document.querySelector('#wrapped-mods').innerHTML===window.wrappedOriginal);
  await page.evaluate(()=>window.editorObserver.disconnect());
  await set('mobalytics',true);
  // 已确认的跨列表词缀保留所有节点；独立词缀与未知续句不得被一起吞掉。
  await page.evaluate(()=>{
   const fixture=document.createElement('main');fixture.id='split-mods';
   fixture.innerHTML='<table><tbody><tr><td><ul><li id="lightning-first">On Hitting an enemy, gains maximum added Lightning damage equal to</li><li id="lightning-last">the enemy\'s Power for 20 seconds, up to a total of 500</li><li id="independent">+100 to maximum Life</li><li id="ammo-first">Bolts fired by Crossbow Attacks have 100% chance to not</li><li id="ammo-last">expend Ammunition if you\'ve Reloaded Recently</li><li id="unknown">Unknown modifier 42</li></ul></td></tr></tbody></table>';
   document.body.append(fixture);window.splitModsOriginal=fixture.innerHTML;
   window.splitModNodes=[...fixture.querySelectorAll('li')].map(el=>el.firstChild);
  });
  await page.waitForFunction(()=>document.querySelector('#lightning-last').textContent==='最高總計500');
  assert.match(await page.locator('#lightning-first').textContent(),/擊中敵人/);
  assert.match(await page.locator('#ammo-first').textContent(),/100%/);
  assert.equal(await page.locator('#ammo-last').textContent(),'不會消耗彈藥');
  assert.match(await page.locator('#independent').textContent(),/100.*最大生命/);
  assert.equal(await page.locator('#unknown').textContent(),'Unknown modifier 42');
  await page.locator('#lightning-last').evaluate(el=>el.firstChild.nodeValue="the enemy's Power for 20 seconds, up to a total of 750");
  await page.waitForFunction(()=>document.querySelector('#lightning-last').textContent==='最高總計750');
  await set('mobalytics',true,true);
  await page.waitForFunction(()=>document.querySelector('#lightning-last').textContent.includes('total of 750)'));
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#split-mods li')].every((el,i)=>el.firstChild===window.splitModNodes[i])),true);
  await set('mobalytics',false);
  await page.waitForFunction(()=>document.querySelector('#split-mods').innerHTML===window.splitModsOriginal.replace('total of 500','total of 750'));
  await set('mobalytics',true);
  await page.waitForFunction(()=>document.querySelector('#lightning-last').textContent==='最高總計750');
  await page.locator('#lightning-last').evaluate(el=>el.firstChild.nodeValue='Unknown continuation 900');
  await page.waitForFunction(()=>document.querySelector('#lightning-first').textContent==='On Hitting an enemy, gains maximum added Lightning damage equal to');
  assert.equal(await page.locator('#lightning-last').textContent(),'Unknown continuation 900');
  await page.evaluate(()=>{
   const gem=document.createElement('div');gem.id='gem-tip';gem.innerHTML='<p id="cast">Cast Time: <span id="cast-value">0.0</span></p><p id="gem-description">Supports <span>Mark</span> Skills, causing them to not be Consumed the first time they are Activated.</p><p id="gem-effect">Marks from Supported Skills are not Consumed the<br>first time they Activate</p>';document.body.append(gem);window.gemOriginal=gem.innerHTML;
  });
  await page.waitForFunction(()=>document.querySelector('#cast').textContent==='施放時間：0.0');
  assert.equal(await page.locator('#gem-description').innerText(),'輔助印記技能，使其在第一次啟動時不會被消耗。');
  assert.equal((await page.locator('#gem-effect').innerText()).trim(),'被輔助的技能造成的印記在第一次啟動時不會被消耗');
  await set('mobalytics',false);await page.waitForFunction(()=>document.querySelector('#gem-tip').innerHTML===window.gemOriginal);
  await set('mobalytics',true,true);await page.waitForFunction(()=>document.querySelector('#cast').textContent==='施放時間：0.0 (Cast Time: 0.0)');
  await page.locator('#cast-value').evaluate(el=>el.firstChild.nodeValue='1.25');await page.waitForFunction(()=>document.querySelector('#cast').textContent==='施放時間：1.25 (Cast Time: 1.25)');
  await set('mobalytics',true);await page.waitForFunction(()=>document.querySelector('#cast').textContent==='施放時間：1.25');
  await page.evaluate(()=>{
   const tip=document.createElement('div');tip.id='moba-tip';tip.innerHTML='<p id="requires">Requires: <span id="required-level">1</span> Level.</p><ul><li><span id="moba-life">+<span id="life-range">(10-19)</span> to maximum <span>Life</span></span><span class="tier">P13</span></li><li><span id="moba-fire">+(6-10)% to Fire Resistance</span><span class="tier">S8</span></li><li><span id="moba-cold">+<span>(6-10)</span>% to <span>Cold Resistance</span></span><span class="tier">S8</span></li></ul><button id="track">Track Build</button>';document.body.append(tip);window.mobaOriginal=tip.innerHTML;
  });
  await page.waitForFunction(()=>document.querySelector('#requires').textContent==='需求：等級 1');
  assert.match(await page.locator('#moba-life').innerText(),/\+\(10-19\).*最大生命/);
  assert.match(await page.locator('#moba-fire').innerText(),/\+\(6-10\)%.*火焰抗性/);
  assert.match(await page.locator('#moba-cold').innerText(),/\+\(6-10\)%.*冰冷抗性/);
  assert.deepEqual(await page.locator('.tier').allTextContents(),['P13','S8','S8']);assert.equal(await page.locator('#track').innerText(),'追蹤流派');
  await set('mobalytics',false);await page.waitForFunction(()=>document.querySelector('#moba-tip').innerHTML===window.mobaOriginal);
  await set('mobalytics',true,true);await page.waitForFunction(()=>document.querySelector('#moba-life').textContent.includes('(+(10-19) to maximum Life)'));
  await page.locator('#required-level').evaluate(el=>el.firstChild.nodeValue='20');await page.waitForFunction(()=>document.querySelector('#requires').textContent==='需求：等級 20 (Requires: 20 Level.)');
  await set('mobalytics',true);await page.waitForFunction(()=>document.querySelector('#requires').textContent==='需求：等級 20');
  await page.goto('https://poe.ninja/poe2/builds');
  await page.evaluate(()=>{
   const labels=document.createElement('div');labels.innerHTML='<h2 id="spirit">SPIRIT SKILLS</h2><p id="rare">Rare Belt</p><p id="weapons">Bow / Quiver</p><select id="typed"><option value="original-charm">Charm</option></select>';document.body.append(labels);
   const tooltip=document.createElement('div');tooltip.id='tooltip';tooltip.setAttribute('role','tooltip');
   tooltip.innerHTML='<div id="used">Used when you become <span>Ignited</span></div><div id="charge"><span id="range">(20-25)</span>% Chance to gain a <span>Charge</span> when you kill an enemy</div><div id="ground">Creates <span>Ignited Ground</span> for 4 seconds when used, <span>Igniting</span> enemies as though dealing <span>Fire</span> damage equal to <span id="damage">500</span>% of your maximum <span>Life</span></div>';
   document.body.append(tooltip);window.originalTooltip=tooltip.innerHTML;window.rangeNode=document.querySelector('#range');
  });
  await page.waitForFunction(()=>document.querySelector('#used').textContent==='當你被點燃時使用');
  assert.equal(await page.locator('#spirit').innerText(),'精魂技能');assert.equal(await page.locator('#rare').innerText(),'稀有腰帶');assert.equal(await page.locator('#weapons').innerText(),'弓／箭袋');assert.equal(await page.locator('#typed option').innerText(),'護符');assert.equal(await page.locator('#typed').inputValue(),'original-charm');
  assert.equal(await page.locator('#charge').innerText(),'殺死敵人時有(20-25)%機率獲得一顆充能');
  assert.equal(await page.locator('#ground').innerText(),'使用時生成持續4秒的點燃地面來點燃敵人，造成等同於你最大生命500%的火焰傷害');
  await set('ninja',false);await page.waitForFunction(()=>document.querySelector('#tooltip').innerHTML===window.originalTooltip);
  assert(await page.evaluate(()=>document.querySelector('#range')===window.rangeNode),'Preserve framework-owned spans');
  await set('ninja',true);await page.waitForFunction(()=>document.querySelector('#used').textContent==='當你被點燃時使用');
  // 局部数值变化不能再次改写相邻译文，防止退化为全页恢复和扫描。
  await page.evaluate(()=>{
   window.unrelatedWrites=0;
   window.unrelatedObserver=new MutationObserver(changes=>{window.unrelatedWrites+=changes.length});
   window.unrelatedObserver.observe(document.querySelector('#used'),{subtree:true,characterData:true,childList:true});
  });
  await page.locator('#damage').evaluate(el=>el.firstChild.nodeValue='650');await page.waitForFunction(()=>document.querySelector('#ground').textContent.includes('650%'));
  assert.equal(await page.evaluate(()=>window.unrelatedWrites),0,'An updated sentence must not rewrite unrelated translations');
  await page.evaluate(()=>window.unrelatedObserver.disconnect());
  // 新增独立文本、属性及删除节点后仍可翻译，并在关闭时恢复框架最新值。
  await page.evaluate(()=>{
   const label=document.createElement('p');label.id='incremental-label';label.textContent='Search';document.body.append(label);
   document.querySelector('#link').setAttribute('title','Search');
  });
  await page.waitForFunction(()=>document.querySelector('#incremental-label').textContent==='搜尋'&&document.querySelector('#link').title==='搜尋');
  await page.locator('#incremental-label').evaluate(el=>el.remove());
  await set('ninja',true,true);await page.waitForFunction(()=>document.querySelector('#ground').textContent.includes('(Creates Ignited Ground'));
  assert(!await page.locator('#ground').innerText().then(text=>text.includes('Creates 點燃地面')),'No mixed-language original');
  await set('ninja',false);await page.waitForFunction(()=>document.querySelector('#ground').textContent.includes('equal to 650%'));
  await set('ninja',true);
  await page.goto('https://maxroll.gg/poe2?label=Build%20Guides');await page.waitForFunction(()=>document.querySelector('h1').textContent==='流派指南');
  await set('ninja',false);assert.equal(await page.locator('h1').innerText(),'流派指南');
  await page.evaluate(()=>history.pushState({},'','/d4'));await page.waitForFunction(()=>document.querySelector('h1').textContent==='Build Guides');
  await page.waitForFunction(()=>!document.querySelector('#poe2zh-widget'));
  await page.evaluate(()=>history.pushState({},'','/poe2'));await page.waitForFunction(()=>document.querySelector('h1').textContent==='流派指南');
  await page.waitForSelector('#poe2zh-widget');
  // 无尾斜线的市集入口也必须注入市集脚本，且不能被官网模块接管。
  await page.goto('https://www.pathofexile.com/trade2');await page.waitForFunction(()=>document.querySelector('h1').textContent==='搜尋');
  await set('official',false);assert.equal(await page.locator('h1').innerText(),'搜尋');
  // 市集浮层沿用 bridge 的设置刷新流程，关闭后刷新页面仍显示可重新启用的按钮。
  await page.locator('#poe2zh-widget .seal').click();
  assert.match(await page.locator('#poe2zh-widget .notice').textContent(),/自动刷新/);
  await page.locator('#poe2zh-widget #enabled').uncheck();await page.waitForFunction(()=>document.querySelector('h1').textContent==='Search');
  await page.waitForSelector('#poe2zh-widget');
  await set('official',true);assert.equal(await page.locator('h1').innerText(),'Search');
  await set('trade',true);await page.waitForFunction(()=>document.querySelector('h1').textContent==='搜尋');
  await popup.reload();await popup.waitForSelector('#ninja-enabled');assert.equal(await popup.locator('#ninja-enabled').isChecked(),false);assert.equal(await popup.locator('#maxroll-enabled').isChecked(),true);
  await popup.locator('#ninja-enabled').check();assert.equal((await popup.evaluate(()=>chrome.storage.local.get('module.ninja')))['module.ninja'].enabled,true);
  // 浮层只写当前模块，与弹窗双向同步；关闭翻译后仍可重新开启，不影响其他站点。
  await page.goto('https://poe.ninja/poe2/economy?label=Economy');
  const widget=page.locator('#poe2zh-widget');
  await widget.locator('.seal').click();await widget.locator('.panel').waitFor({state:'visible'});
  assert.equal(await widget.locator('h2').textContent(),'NINJA');
  // 浮动入口使用本地 SVG 路径，不依赖字体图标或远程图片。
  assert.equal(await widget.locator('.seal svg').count(),1);
  assert.equal(await widget.locator('.seal svg').getAttribute('aria-hidden'),'true');
  assert.equal(await widget.locator('.brand-title').textContent(),'流亡译典');
  await widget.locator('[value="bilingual"]').check();
  await page.waitForFunction(()=>document.querySelector('h1').textContent==='經濟 (Economy)');
  await widget.locator('#enabled').uncheck();await page.waitForFunction(()=>document.querySelector('h1').textContent==='Economy');
  assert.equal(await widget.locator('[value="chinese"]').isDisabled(),true);
  assert.equal(await widget.isVisible(),true);
  assert.equal((await popup.evaluate(()=>chrome.storage.local.get('module.maxroll')))['module.maxroll'].enabled,true);
  await popup.reload();await popup.waitForSelector('#ninja-enabled');assert.equal(await popup.locator('#ninja-enabled').isChecked(),false);
  await popup.locator('#ninja-enabled').check();await page.waitForFunction(()=>document.querySelector('h1').textContent==='經濟 (Economy)');
  await widget.locator('[value="chinese"]').check();await page.waitForFunction(()=>document.querySelector('h1').textContent==='經濟');
  await widget.locator('.close').press('Escape');assert.equal(await widget.locator('.panel').isHidden(),true);
  assert.equal(await widget.locator('.seal').evaluate(el=>el.getRootNode().activeElement===el),true);
  await widget.locator('.seal').click();await page.locator('h1').click();assert.equal(await widget.locator('.panel').isHidden(),true);
  // 注入宿主按钮样式仍不能污染 Shadow DOM；留存桌面与窄屏图用于视觉检查。
  await page.addStyleTag({content:'button{font-size:60px!important;background:red!important}body{background:#292b30;color:#e6dfd0}'});
  await widget.locator('.seal').click();
  assert.notEqual(await widget.locator('.seal').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 0, 0)');
  fs.mkdirSync(path.resolve('output/playwright'),{recursive:true});
  await widget.screenshot({path:'output/playwright/widget-desktop.png'});
  await page.setViewportSize({width:360,height:640});
  const bounds=await widget.locator('.panel').boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=360&&bounds.y+bounds.height<=640);
  await widget.screenshot({path:'output/playwright/widget-mobile.png'});
  await page.evaluate(()=>history.pushState({},'','/poe1/economy'));await page.waitForFunction(()=>!document.querySelector('#poe2zh-widget'));
  await page.evaluate(()=>history.pushState({},'','/poe2/economy'));await page.waitForSelector('#poe2zh-widget');assert.equal(await widget.locator('.panel').isHidden(),true);
  await popup.setViewportSize({width:560,height:600});await popup.screenshot({path:'tests/modules-popup.png',fullPage:true});assert(await popup.evaluate(()=>document.body.scrollHeight<=600),'Popup fits browser height limit');
  assert(await popup.evaluate(()=>{const grid=document.querySelector('#modules');return grid.scrollHeight===grid.clientHeight&&document.documentElement.scrollWidth<=560}),'All cards fit without nested or horizontal scrolling');assert.deepEqual(errors,[]);
  console.log('PASS: six actual MV3 site modules, 7 popup controls, live restore, bilingual persistence, dynamic values, protected fields, SPA routing, trade/official isolation');
 }finally{await context.close();const resolved=path.resolve(profile);assert.equal(path.dirname(resolved),path.resolve('tests'));assert(path.basename(resolved).startsWith('sites-profile-'));fs.rmSync(resolved,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
