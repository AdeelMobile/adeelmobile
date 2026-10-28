let spPlan=[];
function parseSpecs(t){
 const L=t.split('\n').map(l=>l.replace(/\r/g,'')).filter(l=>l.trim()),out=[];
 if(!L.length)return out;
 if(L[0].includes('\t')){
  const h=L[0].split('\t').map(s=>s.trim());
  L.slice(1).forEach(l=>{const c=l.split('\t'),s={};h.slice(1).forEach((k,i)=>{if(k&&c[i+1]&&c[i+1].trim())s[k]=c[i+1].trim()});out.push([c[0].trim(),s])});
 }else L.forEach(l=>{
  const p=l.split('|').map(s=>s.trim()),s={};
  p.slice(1).forEach(x=>{const i=x.indexOf(':');if(i>0)s[x.slice(0,i).trim()]=x.slice(i+1).trim()});
  out.push([p[0],s]);
 });
 return out;
}
function findV(name){
 const n=norm(name);
 return DB.variants.filter(v=>norm(label(v))===n||norm(DB.models.find(x=>x.id===v.model_id).model)===n);
}
$('spPrev').onclick=()=>{
 spPlan=[];const bad=[];let n=0;
 parseSpecs($('spText').value).forEach(([name,s])=>{
  const vs=findV(name);
  if(vs.length&&Object.keys(s).length){spPlan.push([vs,s]);n+=vs.length}else bad.push(name);
 });
 $('spOut').textContent=`Will update: ${n} products\nNot matched: ${bad.length}`+(bad.length?'\n'+bad.join('\n'):'');
 $('spSave').hidden=!spPlan.length;
};
$('spSave').onclick=async()=>{
 let fail=0;
 for(const [vs,s] of spPlan)for(const v of vs){
  const r=await sb.from('variants').update({specs:{...(SPECS[v.id]||{}),...s}}).eq('id',v.id);
  if(r.error)fail++;
 }
 toast(fail?fail+' failed':'Specs saved');
 $('spSave').hidden=true;$('spText').value='';$('spOut').textContent='';await loadDash();
};
