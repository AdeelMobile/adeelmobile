import { getMyP5Applications } from "../../../js/services/phase5-verification-service.js";
const root=document.querySelector("[data-applications]");
const message=document.querySelector("[data-message]");
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
try{
 const rows=await getMyP5Applications();
 if(!rows.length){root.innerHTML='<p class="p5-empty">Abhi koi application nahi. Nayi application submit kar sakte hain.</p>'; }
 else root.innerHTML=rows.map(a=>'<article class="p5-row"><div><strong>Application #'+a.id+' · '+escapeHtml(a.customer_name)+'</strong><div>'+escapeHtml(a.product_name)+' '+escapeHtml(a.variant_name)+' · '+a.plan_months+' months</div><small class="p5-muted">'+new Date(a.submitted_at).toLocaleString()+'</small>'+
 (a.rejection_reason?'<p class="p5-alert error">Rejection reason: '+escapeHtml(a.rejection_reason)+'</p>':'')+
 '</div><span class="p5-status '+a.status+'">'+a.status+'</span></article>').join("");
}catch(e){message.hidden=false;message.classList.add("error");message.textContent="Applications load nahi ho sakin: "+e.message;}
