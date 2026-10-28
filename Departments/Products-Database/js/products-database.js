function show(id){document.querySelectorAll('.pnl').forEach(s=>s.hidden=s.id!==id);scrollTo(0,0)}
function toast(m){const t=$('toast');t.textContent=m;t.className='on';setTimeout(()=>t.className='',2800)}
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>{show('home');renderList()});
document.querySelectorAll('[data-go]').forEach(c=>c.onclick=()=>{show(c.dataset.go);if(c.dataset.go==='pnlBrand')loadBrands();if(c.dataset.go==='pnlShare')loadShare()});
$('addBtn').onclick=openAdd;
async function start(){
 try{await loadDB();renderList();await loadDash()}
 catch(e){toast('Error: '+(e.message||e))}
}
start();
