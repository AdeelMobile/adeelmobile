import {getP5ApplicationDetails,approveP5Application,rejectP5Application,buildWhatsAppUrl} from "../../../../js/services/phase5-verification-service.js";
const root=document.querySelector("[data-detail]"),alertBox=document.querySelector("[data-alert]");
const id=new URLSearchParams(location.search).get("id");
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const money=v=>v==null?"Not set":"Rs. "+Number(v).toLocaleString("en-PK");
function notice(t,error=false){alertBox.hidden=false;alertBox.textContent=t;alertBox.classList.toggle("error",error);}
function doc(label,url,path){if(!url)return "<div><b>"+label+"</b><p>Missing</p></div>";return "<div><b>"+label+"</b><p><a target=_blank rel=noopener href='"+url+"'>Open / download</a></p>"+(path.toLowerCase().endsWith(".pdf")?"": "<a target=_blank rel=noopener href='"+url+"'><img alt='"+label+"' src='"+url+"'></a>")+"</div>";}
async function load(){
 if(!id||!/^[0-9]+$/.test(id)){root.textContent="Invalid application ID";return;}
 try{
 const {application:a,events,documents:d}=await getP5ApplicationDetails(id),editable=a.status==="pending";
 root.innerHTML="<section class=p5-card><header class=p5-head><div><h1>Application #"+a.id+"</h1><span class='p5-status "+a.status+"'>"+a.status+"</span></div><a class=p5-button href=/pages/admin/verifications/>Back</a></header>"+
 "<div class=p5-grid>"+[["Customer",a.customer_name],["Father",a.father_name],["CNIC",a.cnic_number],["Phone",a.customer_phone],["WhatsApp",a.whatsapp],["Address",a.address],["Product",a.product_name+" "+a.variant_name],["Price",money(a.product_price)],["Plan",a.plan_months+" months"],["Expected advance",money(a.expected_advance)],["Actual advance",money(a.actual_advance)],["Submitted",new Date(a.submitted_at).toLocaleString()],["Rejection reason",a.rejection_reason]].map(x=>"<div><b>"+x[0]+"</b><p>"+esc(x[1])+"</p></div>").join("")+"</div></section>"+
 "<section class=p5-card><h2>Private documents</h2><div class=p5-docs>"+doc("Front",d.front,a.document_front_path)+doc("Back",d.back,a.document_back_path)+"</div><small>Signed links expire after 60 minutes.</small></section>"+
 "<section class=p5-card><h2>Activity timeline</h2><ol class=p5-timeline>"+events.map(e=>"<li><b>"+esc(e.event_type.replaceAll("_"," "))+"</b><div>"+new Date(e.created_at).toLocaleString()+"</div></li>").join("")+"</ol></section>"+
 (editable?"<section class=p5-card><h2>Approve</h2><form id=approve><div class=p5-grid><label class=p5-field>Expected advance (Rs.)<input name=expected type=number min=0 step=.01></label><label class=p5-field>Actual advance received (Rs.)<input name=actual type=number min=0 step=.01 value=0 required></label></div><button class='p5-button primary'>Approve & create customer</button></form></section>"+
 "<section class=p5-card><h2>Reject</h2><form id=reject><div class=p5-grid><label class=p5-field>Reason<select name=reason><option value=invalid_id>Invalid ID</option><option value=duplicate_application>Duplicate application</option><option value=incomplete_info>Incomplete information</option><option value=other>Other</option></select></label><label class=p5-field data-other hidden>Details<input name=detail maxlength=300></label></div><button class='p5-button danger'>Reject application</button></form></section>":"")+
 "<section class=p5-card><h2>Manual WhatsApp</h2><p>Message review karke manually send karein.</p><a class=p5-button target=_blank rel=noopener href='"+buildWhatsAppUrl(a,a.status==="approved"?"approved":a.status==="rejected"?"rejected":"pending")+"'>Open prepared message</a></section>";
 if(editable){
 const af=document.querySelector("#approve");af.addEventListener("submit",async e=>{e.preventDefault();const b=af.querySelector("button");b.disabled=true;try{await approveP5Application(id,af.elements.expected.value,af.elements.actual.value);notice("Approved. Customer, contract aur advance record created.");await load();}catch(x){notice(x.message,true);b.disabled=false;}});
 const rf=document.querySelector("#reject"),other=rf.querySelector("[data-other]");rf.elements.reason.addEventListener("change",()=>{other.hidden=rf.elements.reason.value!=="other";rf.elements.detail.required=!other.hidden;});
 rf.addEventListener("submit",async e=>{e.preventDefault();const b=rf.querySelector("button");b.disabled=true;try{await rejectP5Application(id,rf.elements.reason.value,rf.elements.detail.value);notice("Application rejected and reason logged.");await load();}catch(x){notice(x.message,true);b.disabled=false;}});
 }
 }catch(e){notice(e.message||"Could not load application.",true);}
}
load();