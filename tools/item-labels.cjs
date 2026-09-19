const fs=require('fs');let p='extension/engine.js',s=fs.readFileSync(p,'utf8');s=s.replace("if(!node.text||node.text===canonical||node.text===node.type)node.text=display(canonical,true);",`if(!node.text||node.text===canonical||node.text===node.type){
     const complete=lookup(canonical),base=lookup(node.type),name=node.name?lookup(node.name):null;
     if(complete)node.text=complete.zh+' ('+canonical+')';
     else if(base&&(!node.name||name))node.text=(name?name.zh+' ':'')+base.zh+' ('+canonical+')';
     else node.text=canonical;
    }`);fs.writeFileSync(p,s);
