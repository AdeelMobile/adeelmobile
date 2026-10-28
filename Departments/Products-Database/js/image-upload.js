const DB={brands:[],models:[],variants:[]};
const norm=s=>(s||'').toLowerCase().replace(/galaxy/g,'').replace(/[^a-z0-9]/g,'');
const baseModel=m=>m.replace(/\s*\d+\s*\/\s*\d+\s*$/,'');
async function loadDB(){
 const r=await Promise.all([sb.from('brands').select('id,brand'),sb.from('models').select('id,brand_id,model').limit(1000),sb.from('variants').select('id,model_id,variant').limit(1000)]);
 r.forEach(x=>{if(x.error)throw x.error});
 DB.brands=r[0].data;DB.models=r[1].data;DB.variants=r[2].data;
}
function parseName(fn){
 const x=fn.toLowerCase().match(/^(.+?)-pakistan-priceoye-([a-z0-9]+)-\d+x\d+/);
 return x?{slug:x[1],code:x[2]}:null;
}
function matchVariants(slug){
 const s=norm(slug),br=DB.brands.find(b=>s.startsWith(norm(b.brand)));
 if(!br)return [];
 const rest=s.slice(norm(br.brand).length);
 const ids=DB.models.filter(m=>m.brand_id===br.id&&norm(baseModel(m.model))===rest).map(m=>m.id);
 return DB.variants.filter(v=>ids.includes(v.model_id));
}
async function toWebp(file){
 const bm=await createImageBitmap(file),c=document.createElement('canvas');
 c.width=c.height=IMG_SIZE;
 const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,IMG_SIZE,IMG_SIZE);
 const k=Math.min(IMG_SIZE/bm.width,IMG_SIZE/bm.height),w=bm.width*k,h=bm.height*k;
 g.drawImage(bm,(IMG_SIZE-w)/2,(IMG_SIZE-h)/2,w,h);
 return new Promise(r=>c.toBlob(r,'image/webp',0.85));
}
async function addImage(file,code,variants){
 const ex=await sb.from('product_images').select('variant_id').eq('source_code',code).in('variant_id',variants.map(v=>v.id));
 if(ex.error)throw ex.error;
 const have=new Set(ex.data.map(r=>r.variant_id)),todo=variants.filter(v=>!have.has(v.id));
 if(!todo.length)return 'skipped';
 const path=code+'.webp',up=await sb.storage.from(BUCKET).upload(path,await toWebp(file),{contentType:'image/webp',upsert:true});
 if(up.error)throw up.error;
 const url=sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
 for(const v of todo){
  const {count}=await sb.from('product_images').select('id',{count:'exact',head:true}).eq('variant_id',v.id);
  const r=await sb.from('product_images').insert({variant_id:v.id,image_url:url,storage_path:path,source_code:code,color:'',sort_order:(count||0)+1,is_cover:!count});
  if(r.error&&r.error.code!=='23505')throw r.error;
 }
 return 'uploaded';
}
async function setCover(row){
 await sb.from('product_images').update({is_cover:false}).eq('variant_id',row.variant_id);
 await sb.from('product_images').update({is_cover:true}).eq('id',row.id);
}
async function deleteImage(row){
 await sb.from('product_images').delete().eq('id',row.id);
 if(!row.storage_path)return;
 const {count}=await sb.from('product_images').select('id',{count:'exact',head:true}).eq('storage_path',row.storage_path);
 if(!count)await sb.storage.from(BUCKET).remove([row.storage_path]);
}
