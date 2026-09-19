/* Exact, source-backed translations only. No fuzzy or word-by-word translation. */
(function (root) {
'use strict';
const norm = s => s.replace(/\[([^\[\]|]+)\|([^\[\]]+)\]/g,'$2').replace(/\[([^\[\]]+)\]/g,'$1').replace(/\s+/g,' ').trim();
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const signature = s => norm(s).replace(/[+\-]?\{\d+\}%?|[+\-]?(?:\d+(?:\.\d+)?|#)(?:[—–]\d+(?:\.\d+)?)?%?/g,'@');
function create(records,apiLabels={}) {
 const exact=new Map(), templates=new Map(), cache=new Map(), casefold=new Map();
 for(const r of records){
  const en=norm(r.en), zh=norm(r.zh).replace(new RegExp(' \\('+escape(r.en)+'\\)$'),'');
  if (!/\{\d+\}/.test(en)) {exact.set(en,{...r,zh});continue;}
  const ids=[...en.matchAll(/\{(\d+)\}/g)].map(m=>m[1]);
  const zids=[...zh.matchAll(/\{(\d+)\}/g)].map(m=>m[1]);
  if(ids.some(id=>!zids.includes(id))||zids.some(id=>!ids.includes(id))||en.replace(/\{\d+\}/g,'').replace(/[^a-z]/gi,'').length<4)continue;
  const key=signature(en);
  if(!templates.has(key))templates.set(key,[]);
  templates.get(key).push({...r,en,zh,ids,regex:null,specificity:en.replace(/\{\d+\}/g,'').length,plain:!r.en.includes('[')});
 }
 for(const [key,value]of exact){const lower=key.toLowerCase();if(!casefold.has(lower))casefold.set(lower,value);else if(casefold.get(lower)?.zh!==value.zh)casefold.set(lower,null)}
 function lookup(raw){
  const en=norm(raw); if(cache.has(en)) return cache.get(en);
  let found=exact.get(en)||casefold.get(en.toLowerCase())||null;
  if(!found&&en.endsWith(' (Local)')){const base=lookup(en.slice(0,-8)),qualifier=exact.get('(Local)');if(base&&qualifier)found={...base,zh:base.zh+' '+qualifier.zh};}
  if(!found&&en.startsWith('Bonded: ')){const base=lookup(en.slice(8)),prefix=exact.get('Bonded');if(base&&prefix)found={...base,zh:prefix.zh+': '+base.zh};}
  if(!found){
   const matches=[];
   for(const t of templates.get(signature(en))||[]){
    if(!t.regex)t.regex=new RegExp('^'+t.en.split(/\{\d+\}/).map(escape).join('([+\\-]?(?:\\d+(?:\\.\\d+)?|#)(?:[—–]\\d+(?:\\.\\d+)?)?%?)')+'$');
    const m=t.regex.exec(en);if(!m)continue;
    const values={};let valid=true;
    t.ids.forEach((id,i)=>{if(values[id]!==undefined&&values[id]!==m[i+1])valid=false;values[id]=m[i+1]});
    if(valid)matches.push({...t,zh:t.zh.replace(/\{(\d+)\}/g,(_,id)=>values[id])});
   }
   if(matches.length){matches.sort((a,b)=>(b.priority||0)-(a.priority||0)||b.specificity-a.specificity||Number(b.plain)-Number(a.plain));const best=matches.filter(x=>(x.priority||0)===(matches[0].priority||0)&&x.specificity===matches[0].specificity&&x.plain===matches[0].plain);if(new Set(best.map(x=>x.zh.replace(/\s/g,''))).size===1)found=best[0];}
  }
  if(cache.size>10000)cache.clear();cache.set(en,found);return found;
 }
 const display=(text,bilingual=false)=>{if(typeof text!=='string')return text;const r=lookup(text);return r?r.zh+(bilingual?' ('+text+')':''):text;};
 function data(payload,kind){
  // Only labels are localized. Query ids, names, types, options and numeric values retain their canonical values.
  const copy=JSON.parse(JSON.stringify(payload));
  function walk(node,path=''){
   if(Array.isArray(node)){for(const x of node)walk(x,path+'/'+String(x?.id??''));return;}
   if(!node||typeof node!=='object')return;
   for(const [key,value] of Object.entries(node)){
    if(typeof value==='string'&&['text','label','title','placeholder','description'].includes(key)){const pair=apiLabels[kind+path+'/'+key];node[key]=pair&&norm(pair.en)===norm(value)?pair.zh+' ('+value+')':display(value,true);}
    else if(value&&typeof value==='object')walk(value,path+'/'+key);
   }
   if(kind==='items'&&typeof node.type==='string'){
    const canonical=node.name?node.name+' '+node.type:node.type;
    if(!node.text||node.text===canonical||node.text===node.type){
     const complete=lookup(canonical),base=lookup(node.type),name=node.name?lookup(node.name):null;
     if(complete)node.text=complete.zh+' ('+canonical+')';
     else if(base&&(!node.name||name))node.text=(name?name.zh+' ':'')+base.zh+' ('+canonical+')';
     else node.text=canonical;
    }
   }
  }walk(copy);return copy;
 }
 return {lookup,display,data,exact,signature};
}
root.POE2ZH={create,norm,signature};
if(typeof module!=='undefined')module.exports=root.POE2ZH;
})(globalThis);
