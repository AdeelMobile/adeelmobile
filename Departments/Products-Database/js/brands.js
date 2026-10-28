async function loadBrands(){
 const {data,error}=await sb.from('brands').select('id,brand,logo_url,show_inst_website,show_cash_website').order('brand');
 if(error)return toast(error.message);
 const sw=(b,c,t)=>`<label class="sw">${t}<input type="checkbox" data-b="${b.id}" data-c="${c}" ${b[c]?'checked':''}><i></i></label>`;
 const lg=b=>`<label class="up">${b.logo_url?`<img class="lg" src="${b.logo_url}">`:'<span class="muted">No logo</span>'}<span class="ghost">Upload Logo</span><input type="file" accept="image/*" data-lg="${b.id}"></label>`;
 $('bList').innerHTML=data.map(b=>`<li class="bl"><b>${b.brand}</b>${lg(b)}${sw(b,'show_inst_website','Installment Website')}${sw(b,'show_cash_website','Cash Website')}</li>`).join('');
}
async function logoBlob(f){
 const b=await createImageBitmap(f),k=Math.min(1,400/Math.max(b.width,b.height)),c=document.createElement('canvas');
 c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext('2d').drawImage(b,0,0,c.width,c.height);
 return new Promise(r=>c.toBlob(r,'image/png'));
}
$('bList').onchange=async e=>{
 const t=e.target;
 if(t.dataset.lg){
  try{
   const id=t.dataset.lg,path=`brands/${id}-${Date.now()}.png`;
   const u=await sb.storage.from('logos').upload(path,await logoBlob(t.files[0]),{contentType:'image/png'});
   if(u.error)throw u.error;
   const url=sb.storage.from('logos').getPublicUrl(path).data.publicUrl;
   const r=await sb.from('brands').update({logo_url:url,logo_path:path}).eq('id',id);
   if(r.error)throw r.error;
   toast('Logo saved');loadBrands();
  }catch(x){toast('Error: '+(x.message||x))}
  return;
 }
 const b=t.dataset.b;if(!b)return;
 const c=t.dataset.c,v=t.checked;
 const r1=await sb.from('brands').update({[c]:v}).eq('id',b);
 const r2=await sb.from('models').update({[c]:v}).eq('brand_id',b);
 toast(r1.error||r2.error?'Error: not saved':'Saved (all models of this brand updated)');
 loadDash();
};
$('nbAdd').onclick=async()=>{
 const n=$('nb').value.trim();if(!n)return;
 const r=await sb.from('brands').insert({brand:n,show_inst_website:false,show_cash_website:false});
 if(r.error)return toast(r.error.message);
 $('nb').value='';await loadDB();loadBrands();loadDash();toast('Brand added (switches are off)');
};
