const W=1080,H=1920,DARK='#2a2a2a';
const loadImg=u=>new Promise(r=>{if(!u)return r(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function fit(c,img,x,y,w,h,a){if(!img)return;const k=Math.min(w/img.width,h/img.height),dw=img.width*k,dh=img.height*k;c.save();if(a!=null)c.globalAlpha=a;c.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);c.restore()}
function hr(c,y){c.strokeStyle='#e3e3e3';c.lineWidth=3;c.beginPath();c.moveTo(60,y);c.lineTo(W-60,y);c.stroke()}
function tx(c,t,x,y,s,w,col,al){c.font=`${w} ${s}px Roboto,Arial,sans-serif`;c.fillStyle=col||DARK;c.textAlign=al||'left';c.fillText(t,x,y)}
function wrap(c,t,maxW){const ws=t.split(' '),L=[];let cur='';for(const w of ws){const x=cur?cur+' '+w:w;if(c.measureText(x).width>maxW&&cur){L.push(cur);cur=w}else cur=x}L.push(cur);return L}
function icon(c,t,x,y,s){c.fillStyle=DARK;rr(c,x,y,s,s,s*.22);c.fill();c.strokeStyle='#fff';c.fillStyle='#fff';c.lineWidth=s*.07;const m=s/2;
 if(t==='f')tx(c,'f',x+m,y+s*.78,s*.7,700,'#fff','center');
 else if(t==='i'){rr(c,x+s*.22,y+s*.22,s*.56,s*.56,s*.16);c.stroke();c.beginPath();c.arc(x+m,y+m,s*.14,0,7);c.stroke();c.beginPath();c.arc(x+s*.66,y+s*.34,s*.03,0,7);c.fill()}
 else if(t==='y'){rr(c,x+s*.18,y+s*.3,s*.64,s*.4,s*.1);c.fill();c.fillStyle=DARK;c.beginPath();c.moveTo(x+s*.45,y+s*.4);c.lineTo(x+s*.45,y+s*.6);c.lineTo(x+s*.62,y+s*.5);c.fill()}
 else{c.beginPath();c.arc(x+s*.42,y+s*.68,s*.1,0,7);c.fill();c.beginPath();c.moveTo(x+s*.52,y+s*.68);c.lineTo(x+s*.52,y+s*.25);c.lineTo(x+s*.7,y+s*.34);c.stroke()}}
function qr(c,t,x,y,s){const q=qrcode(0,'M');q.addData(t);q.make();const n=q.getModuleCount(),k=s/n;c.fillStyle='#fff';c.fillRect(x-8,y-8,s+16,s+16);c.fillStyle=DARK;for(let r=0;r<n;r++)for(let j=0;j<n;j++)if(q.isDark(r,j))c.fillRect(x+j*k,y+r*k,Math.ceil(k),Math.ceil(k))}
async function serial(id){try{const r=await sb.from('poster_downloads').insert({variant_id:id}).select('id').single();if(r.error)throw r.error;return 'AM-'+String(r.data.id).padStart(6,'0')}catch(e){return 'AM-'+Date.now().toString().slice(-6)}}
async function makePoster(P,imgUrl){
 const btn=$('poster');btn.disabled=true;btn.textContent='Preparing poster...';
 try{
  try{const f=new FontFace('JameelNoori','url(fonts/JameelNooriNastaleeq.ttf)');await f.load();document.fonts.add(f)}catch(e){}
  await Promise.all([document.fonts.load('700 40px Roboto'),document.fonts.load('400 40px Roboto'),document.fonts.load('40px "Noto Nastaliq Urdu"','اگر')]).catch(()=>{});
  const [prod,brand,logo]=await Promise.all([loadImg(imgUrl),loadImg(P.brandLogo),loadImg(LOGO_URL)]);
  const sr=await serial(P.id),cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  c.fillStyle='#fff';c.fillRect(0,0,W,H);
  if(brand)fit(c,brand,60,60,300,140);else tx(c,P.brand,60,140,48,700);
  fit(c,logo,W-360,60,300,140);hr(c,230);
  fit(c,prod,80,260,W-160,600);
  if(logo){c.save();c.filter='blur(6px)';fit(c,logo,W/2-220,450,440,220,.14);c.restore()}
  tx(c,P.title,W/2,915,56,700,DARK,'center');tx(c,P.spec,W/2,965,36,400,'#777','center');
  tx(c,'Rs. '+P.price.toLocaleString('en-US'),W/2,1040,66,700,DARK,'center');
  const pl=[3,6,9].map(m=>[m,calcPlan(P.price,m)]);
  tx(c,'Advance Payment: Rs. '+pl[0][1].advance.toLocaleString('en-US'),W/2,1090,36,500,'#444','center');
  pl.forEach(([m,p],i)=>{const x=60+i*326,y=1125,w=308,n=v=>'Rs. '+v.toLocaleString('en-US');
   c.save();rr(c,x,y,w,200,16);c.clip();c.fillStyle='#3a3a3a';c.fillRect(x,y,w,54);c.restore();
   c.strokeStyle='#cfcfcf';c.lineWidth=3;rr(c,x,y,w,200,16);c.stroke();
   tx(c,m+' MONTHS',x+w/2,y+37,28,700,'#fff','center');tx(c,n(p.monthly),x+w/2,y+105,40,700,DARK,'center');
   tx(c,'per month',x+w/2,y+135,24,400,'#777','center');tx(c,'Total '+n(p.total),x+w/2,y+177,26,500,'#444','center')});
  hr(c,1355);
  const ur='اگر آپ بغیر کسی ضمانت اور گارنٹی کے یہ موبائل فون ماہانہ آسان اقساط پر خریدنا چاہتے ہیں تو اپنی تفصیلات نیچے دیے گئے نمبر پر واٹس ایپ کریں، شکریہ۔';
  c.direction='rtl';c.textAlign='center';c.fillStyle=DARK;c.font='38px "JameelNoori","Noto Nastaliq Urdu",serif';
  wrap(c,ur,W-160).forEach((l,i)=>c.fillText(l,W/2,1425+i*76));c.direction='ltr';
  tx(c,'WhatsApp: '+WHATSAPP_DISPLAY,W/2,1650,40,700,DARK,'center');
  hr(c,1680);
  ['f','t','y','i'].forEach((t,i)=>icon(c,t,60+i*100,1715,80));
  qr(c,location.origin+location.pathname+'?id='+P.id,W-60-150,1710,150);
  const d=new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});
  tx(c,'Downloaded: '+d,60,1895,26,400,'#777','left');tx(c,'Sr No. '+sr,W-60,1895,26,700,'#444','right');
  cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=sr+'-'+P.title.replace(/\s+/g,'-')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)},'image/png');
 }catch(e){toast('Poster error: '+(e.message||e))}
 btn.disabled=false;btn.textContent='Download Poster';
}
