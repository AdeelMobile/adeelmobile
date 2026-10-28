let MISS=[];
async function withImages(){
 const s=new Set();
 for(let p=0;;p++){
  const {data,error}=await sb.from('product_images').select('variant_id').range(p*1000,p*1000+999);
  if(error)throw error;
  data.forEach(r=>s.add(r.variant_id));
  if(data.length<1000)return s;
 }
}
async function loadMissing(){
 try{const has=await withImages();MISS=DB.variants.filter(v=>!has.has(v.id));$('nImg').textContent=MISS.length;renderMissing()}
 catch(e){$('nImg').textContent='!'}
}
function renderMissing(){
 const q=$('mq').value.toLowerCase();
 $('mList').innerHTML=MISS.map(v=>[v.id,label(v)]).filter(a=>a[1].toLowerCase().includes(q)).map(a=>`<li data-v="${a[0]}">${a[1]}</li>`).join('')||'<li>None</li>';
}
$('mq').oninput=renderMissing;
$('mList').onclick=e=>{if(e.target.dataset.v)openForm(+e.target.dataset.v)};
