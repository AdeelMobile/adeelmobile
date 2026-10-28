const nm=x=>Number(x).toLocaleString('en-US');
const rng=(a,b)=>a&&b?`Rs. ${nm(a)} to ${nm(b)}`:b?`Up to Rs. ${nm(b)}`:`Above Rs. ${nm(a)}`;
const siteBase=()=>(SITE_URL||location.origin+'/').replace(/\/?$/,'/')+'index.html';
async function loadShare(){
 const {data}=await sb.from('brands').select('brand').eq('show_inst_website',true).order('brand');
 $('shBrand').innerHTML=(data||[]).map(b=>`<option>${b.brand}</option>`).join('');
}
function shareFor(k){
 const p=new URLSearchParams({sort:'low'});let t='';
 if(k==='brand'){t=$('shBrand').value;p.set('brand',t)}
 if(k==='price'||k==='monthly'){
  const a=+$(k==='price'?'pMin':'mMin').value,b=+$(k==='price'?'pMax':'mMax').value;
  if(!a&&!b)return null;
  if(a)p.set(k==='price'?'min':'mmin',a);if(b)p.set(k==='price'?'max':'mmax',b);
  t=(k==='monthly'?'Monthly ':'')+rng(a,b);
 }
 return 'Adeel Mobile Installments'+(t?' - '+t:'')+'\n'+siteBase()+'?'+p.toString();
}
document.querySelectorAll('#pnlShare [data-c]').forEach(b=>b.onclick=async()=>{
 const s=shareFor(b.dataset.c);
 if(!s)return toast('Pehle From ya To amount likho');
 try{await navigator.clipboard.writeText(s)}catch(e){const a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}
 toast('Link copied');
});
