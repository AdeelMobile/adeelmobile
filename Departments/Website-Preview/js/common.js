const $=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search);
const MARKUP={3:.15,6:.30,9:.40};
const advPct=p=>p<60000?.2:.3;
function calcPlan(price,m){const adv=Math.round(price*advPct(price)),baqi=price-adv,mk=Math.round(baqi*(MARKUP[m]||.3));return{advance:adv,monthly:Math.round((baqi+mk)/m),total:adv+baqi+mk}}
const rs=n=>'Rs. '+Number(n||0).toLocaleString('en-US');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const effPrice=v=>v.discount_price&&v.discount_price<v.price?v.discount_price:v.price;
const fullName=(brand,model,variant)=>brand+' '+((variant&&!model.endsWith(variant))?model+' '+variant:model);
const PH='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f3f3f3"/><text x="100" y="105" font-size="16" text-anchor="middle" fill="#999">No image</text></svg>');
function imgTag(src,extra=''){return `<img src="${esc(src||PH)}" ${extra} onerror="this.onerror=null;this.src='${PH}'">`}
function shrink(file,max=1400){return new Promise(async r=>{try{const b=await createImageBitmap(file),k=Math.min(1,max/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*k;c.height=b.height*k;c.getContext('2d').drawImage(b,0,0,c.width,c.height);c.toBlob(x=>r(x||file),'image/jpeg',.8)}catch(e){r(file)}})}
if(typeof WHATSAPP_NUMBER!=='undefined'&&$('wa')&&WHATSAPP_NUMBER){$('wa').href='https://wa.me/'+WHATSAPP_NUMBER;$('wa').hidden=false}

const fmtVar=v=>{const m=String(v||'').match(/^(\d+)\s*\/\s*(\d+)$/);return m?`${m[1]}GB / ${m[2]}GB`:(v||'')};
function splitName(brand,model,variant){let m=model;if(variant&&m.endsWith(variant))m=m.slice(0,-variant.length).trim();return{title:brand+' '+m,spec:fmtVar(variant)}}
function toast(t){let e=$('toast');if(!e){e=document.createElement('div');e.id='toast';document.body.appendChild(e)}e.textContent=t;e.className='on';setTimeout(()=>e.className='',2200)}
async function copyText(t){try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}toast('Link copied')}
const shareText=(title,url)=>'Adeel Mobile Installments'+(title?' - '+title:'')+'\n'+url;
