const SW=[['show_inst_website','Installment Website'],['show_cash_website','Cash Website'],['show_poster','Poster'],['show_catalog','Catalogue'],['show_price_list','Price List'],['show_comparison','Comparisons']];
let F={},BRF=[];
const varRow=(v={})=>`<div class="vr"><input class="vv" placeholder="Variant 4/128" value="${v.variant||''}"><input class="vp" type="number" placeholder="Price" value="${v.price||''}"><input class="vd" type="number" placeholder="Discount price" value="${v.discount_price||''}"></div>`;
const renderSw=m=>{$('fSw').innerHTML=SW.map(([k,t])=>`<label class="sw">${t}<input type="checkbox" id="sw_${k}" ${m[k]?'checked':''}><i></i></label>`).join('')};
async function fillBrands(sel){
 const r=await sb.from('brands').select('id,brand,show_inst_website,show_cash_website').order('brand');
 BRF=r.data||[];
 $('fBrand').innerHTML=BRF.map(b=>`<option value="${b.id}">${b.brand}</option>`).join('');
 if(sel)$('fBrand').value=sel;
}
$('fBrand').onchange=()=>{
 if(F.mode!=='add')return;
 const b=BRF.find(x=>x.id==$('fBrand').value);
 if(b){$('sw_show_inst_website').checked=!!b.show_inst_website;$('sw_show_cash_website').checked=!!b.show_cash_website}
};
async function openAdd(){
 show('pnlForm');F={mode:'add'};
 await fillBrands();
 $('fTitle').textContent='Add Product';$('fName').value='';$('fSpecs').value='';
 $('fVars').innerHTML=varRow();$('fAddVar').hidden=false;$('fDel').hidden=$('fRm').hidden=true;
 $('fImgs').innerHTML='<p>Choose images below. They upload when you tap Save.</p>';
 renderSw({show_inst_website:1,show_cash_website:1,show_poster:1,show_catalog:1,show_price_list:1,show_comparison:1});
 $('fBrand').onchange();
}
async function openForm(id){
 show('pnlForm');
 const v=DB.variants.find(x=>x.id===id);F={mode:'edit',vid:id,mid:v.model_id};
 const a=await sb.from('variants').select('*').eq('id',id).single();
 const b=await sb.from('models').select('*').eq('id',v.model_id).single();
 await fillBrands(b.data.brand_id);
 $('fTitle').textContent='Edit Product';$('fName').value=b.data.model;
 $('fVars').innerHTML=varRow(a.data);$('fAddVar').hidden=true;$('fDel').hidden=$('fRm').hidden=false;
 $('fSpecs').value=Object.entries(a.data.specs||{}).map(([k,x])=>k+': '+x).join('\n');
 renderSw(b.data);showImgs();
}
$('fAddVar').onclick=()=>$('fVars').insertAdjacentHTML('beforeend',varRow());
async function showImgs(){
 const {data,error}=await sb.from('product_images').select('*').eq('variant_id',F.vid).order('sort_order');
 if(error)return;
 $('fImgs').innerHTML=data.length?data.map((r,i)=>`<figure class="${r.is_cover?'cover':''}"><img src="${r.image_url}"><figcaption><button data-a="c" data-i="${i}">${r.is_cover?'Cover':'Set cover'}</button><button data-a="l" data-i="${i}">◀</button><button data-a="r" data-i="${i}">▶</button><button class="del" data-a="d" data-i="${i}">✕</button></figcaption></figure>`).join(''):'<p>No images yet.</p>';
 $('fImgs').onclick=async e=>{
  const a=e.target.dataset.a,i=+e.target.dataset.i;if(!a)return;
  const r=data[i];
  if(a==='c')await setCover(r);
  else if(a==='d'){if(!confirm('Delete this image?'))return;await deleteImage(r)}
  else{const o=data[a==='l'?i-1:i+1];if(!o)return;
   await sb.from('product_images').update({sort_order:o.sort_order}).eq('id',r.id);
   await sb.from('product_images').update({sort_order:r.sort_order}).eq('id',o.id)}
  showImgs();loadMissing();
 };
}
async function uploadFiles(ids){
 const fs=[...$('fFiles').files];
 for(let i=0;i<fs.length;i++){const p=parseName(fs[i].name);await addImage(fs[i],p?p.code:'m'+Date.now().toString(36)+i,ids.map(id=>({id})))}
 $('fFiles').value='';
}
$('fFiles').onchange=async()=>{if(F.mode==='edit'){try{await uploadFiles([F.vid]);showImgs();loadMissing()}catch(e){toast(e.message)}}};
$('fSave').onclick=async()=>{
 try{
  const brand_id=+$('fBrand').value,name=$('fName').value.trim();
  if(!name)throw new Error('Product name required');
  const sw={};SW.forEach(([k])=>sw[k]=$('sw_'+k).checked);
  const specs={};$('fSpecs').value.split('\n').forEach(l=>{const i=l.indexOf(':');if(i>0)specs[l.slice(0,i).trim()]=l.slice(i+1).trim()});
  const rows=[...document.querySelectorAll('.vr')].map(r=>({variant:r.querySelector('.vv').value.trim(),price:+r.querySelector('.vp').value||0,discount_price:+r.querySelector('.vd').value||null}));
  let ids=[];
  if(F.mode==='edit'){
   let r=await sb.from('models').update({brand_id,model:name,...sw}).eq('id',F.mid);if(r.error)throw r.error;
   r=await sb.from('variants').update({...rows[0],specs}).eq('id',F.vid);if(r.error)throw r.error;
   ids=[F.vid];
  }else for(const row of rows){
   if(!row.variant)throw new Error('Variant required, e.g. 4/128');
   const m=await sb.from('models').insert({brand_id,model:name+' '+row.variant,status:'active',...sw}).select('id').single();if(m.error)throw m.error;
   const v=await sb.from('variants').insert({model_id:m.data.id,...row,specs}).select('id').single();if(v.error)throw v.error;
   ids.push(v.data.id);
  }
  await uploadFiles(ids);await loadDB();renderList();await loadDash();
  toast('Saved');openForm(ids[0]);
 }catch(e){toast(e.message||String(e))}
};
$('fDel').onclick=async()=>{
 const r=await sb.from('models').update({show_inst_website:false,show_cash_website:false}).eq('id',F.mid);
 toast(r.error?r.error.message:'Hidden from both websites');loadDash();openForm(F.vid);
};
$('fRm').onclick=async()=>{
 if(!confirm('Delete this product permanently?'))return;
 const c=await sb.from('verifications').select('id',{count:'exact',head:true}).eq('variant_id',F.vid);
 if(c.count)return toast('Customer verifications exist. Use Hide instead.');
 const im=await sb.from('product_images').select('*').eq('variant_id',F.vid);
 for(const r of im.data||[])await deleteImage(r);
 const r=await sb.from('variants').delete().eq('id',F.vid);if(r.error)return toast(r.error.message);
 await sb.from('models').delete().eq('id',F.mid);
 await loadDB();renderList();loadDash();show('home');toast('Deleted');
};
