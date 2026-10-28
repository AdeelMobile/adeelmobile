let SPECS={};
const hasSpecs=id=>{const s=SPECS[id];return !!s&&typeof s==='object'&&Object.keys(s).length>0};
async function cnt(col){const r=await sb.from('models').select('id',{count:'exact',head:true}).eq(col,true);return r.count}
async function loadDash(){
 $('nTotal').textContent=DB.variants.length;
 $('nBrand').textContent=DB.brands.length;
 $('nInst').textContent=await cnt('show_inst_website');
 $('nCash').textContent=await cnt('show_cash_website');
 const r=await sb.from('variants').select('id,specs').limit(2000);
 if(r.error)throw r.error;
 SPECS={};r.data.forEach(x=>SPECS[x.id]=x.specs);
 $('nSpec').textContent=DB.variants.filter(v=>!hasSpecs(v.id)).length;
 await loadMissing();
}
