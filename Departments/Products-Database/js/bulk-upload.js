$('runBulk').onclick=async()=>{
 const files=[...$('bulkFiles').files].sort((a,b)=>a.name.localeCompare(b.name));
 if(!files.length){$('bulkOut').textContent='Select images first.';return}
 const res={uploaded:0,skipped:0,bad:[]};
 for(let i=0;i<files.length;i++){
  const f=files[i];
  try{
   const p=parseName(f.name);
   if(!p){res.bad.push(f.name+' (name pattern not found)');continue}
   const vs=matchVariants(p.slug);
   if(!vs.length){res.bad.push(f.name+' (model not found in database)');continue}
   res[await addImage(f,p.code,vs)]++;
  }catch(e){res.bad.push(f.name+' ('+(e.message||e)+')')}
  finally{
   $('bar').value=(i+1)/files.length*100;
   $('bulkOut').textContent=`${i+1}/${files.length}  Uploaded: ${res.uploaded}  Skipped: ${res.skipped}  Failed: ${res.bad.length}`;
  }
 }
 $('bulkOut').textContent+=res.bad.length?'\n\nNot done:\n'+res.bad.join('\n'):'\n\nAll done.';
 loadMissing();
};
