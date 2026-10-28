const label=v=>{const m=DB.models.find(x=>x.id===v.model_id),b=DB.brands.find(x=>x.id===m.brand_id);return b.brand+' '+m.model};
function renderList(){
 const q=$('pq').value.toLowerCase().trim();
 const rows=DB.variants.map(v=>[v.id,label(v)]).filter(a=>!q||a[1].toLowerCase().includes(q)).sort((a,b)=>a[1].localeCompare(b[1])).slice(0,60);
 $('pList').innerHTML=rows.map(a=>`<li data-v="${a[0]}">${a[1]}</li>`).join('')||'<li>No product found</li>';
}
$('pq').oninput=renderList;
$('pList').onclick=e=>{if(e.target.dataset.v)openForm(+e.target.dataset.v)};
