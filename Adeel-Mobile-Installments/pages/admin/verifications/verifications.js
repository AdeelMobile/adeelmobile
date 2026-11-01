import { getAdminP5Applications } from "../../../js/services/phase5-verification-service.js";
const list=document.querySelector("[data-list]"), alertBox=document.querySelector("[data-alert]");
const tabs=[...document.querySelectorAll("[data-status]")];
const pageLabel=document.querySelector("[data-page]");
const prev=document.querySelector("[data-prev]"),next=document.querySelector("[data-next]");
let status="pending",page=0,lastCount=0;
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fail(e){alertBox.hidden=false;alertBox.textContent=e.message||"Data load nahi ho saka.";alertBox.classList.add("error");}
async function load(){
 alertBox.hidden=true;list.innerHTML='<p class="p5-empty">Loading…</p>';
 tabs.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.status===status)));
 try{
  const result=await getAdminP5Applications(status,page);lastCount=result.count;
  if(!result.rows.length)list.innerHTML='<p class="p5-empty">Is tab mein koi application nahi.</p>';
  else list.innerHTML=result.rows.map(a=>'<article class="p5-row"><div><strong>#'+a.id+' · '+esc(a.customer_name)+'</strong><div>'+esc(a.customer_phone)+' · '+esc(a.product_name)+' '+esc(a.variant_name)+'</div><small class="p5-muted">'+a.plan_months+' months · '+new Date(a.submitted_at).toLocaleString()+'</small></div><div class="p5-actions"><span class="p5-status '+a.status+'">'+a.status+'</span><a class="p5-button" href="/pages/admin/verifications/detail/?id='+a.id+'">Review</a></div></article>').join("");
  pageLabel.textContent="Page "+(page+1)+" · "+lastCount+" total";
  prev.disabled=page===0;next.disabled=(page+1)*result.pageSize>=lastCount;
 }catch(e){fail(e);}
}
tabs.forEach(b=>b.addEventListener("click",()=>{status=b.dataset.status;page=0;load();}));
prev.addEventListener("click",()=>{if(page>0){page--;load();}});
next.addEventListener("click",()=>{if((page+1)*20<lastCount){page++;load();}});
load();
