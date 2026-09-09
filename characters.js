/* Original artwork is saved separately from user photos and audio. */
let characterJob=null,characterCancel=false,characterMessage='',characterFilter='all';
const characterSourceMap=new Map(DATA.characterSources.map(s=>[s.id,s]));
function characterURI(w){return photoFor(w)||media.get('character:'+w.id)||null;}
function characterCount(series='all'){return WORDS.filter(w=>w.category==='characters'&&(series==='all'||w.series===series)&&!!characterURI(w)).length;}
function characterImageLabel(w){return photoFor(w)?'\ub0b4\uac00 \ub123\uc740 \uc774\ubbf8\uc9c0':media.has('character:'+w.id)?'\uc6d0\ubcf8 \uce90\ub9ad\ud130':'\uc6d0\ubcf8 \ubc1b\uae30 \ud544\uc694';}
function showCharacterParents(){showParents('characters');}
function renderCharacters(){
 $$('[data-tab],#close-parents').forEach(b=>b.disabled=!!characterJob);
 const all=WORDS.filter(w=>w.category==='characters');
 const list=all.filter(w=>characterFilter==='all'||w.series===characterFilter);
 const total=all.length,ready=characterCount();
 $('#parent-content').innerHTML=`<section class="setting-block character-panel"><span class="character-eyebrow">\uadf8\ub9bc\uc744 \ub2e4\uc2dc \uadf8\ub9ac\uc9c0 \uc54a\uc544\uc694</span><h3>\uc6d0\ubcf8 \uce90\ub9ad\ud130 \uce74\ub4dc</h3>
 <p>\ubf40\ub85c\ub85c 9\uba85\uacfc \uc544\uae30\uc0c1\uc5b4 11\uba85. \uc6d0\ubcf8\uc744 \ucc98\uc74c \ud55c \ubc88 \ubc1b\uc73c\uba74 \uc774 \uae30\uae30\uc5d0 \uc800\uc7a5\ub3fc\uc694. \uc900\ube44\ub41c \uadf8\ub9bc\ub9cc \ub180\uc774\uc5d0 \ub098\uc640\uc694.</p>
 <div class="character-summary"><strong id="character-ready-count">${ready} / ${total}</strong><span>\uba85\uc758 \uc774\ubbf8\uc9c0 \uc800\uc7a5\ub428</span></div>
 <div class="btn-row"><button class="primary" id="get-all-characters">\uc6d0\ubcf8 20\uc7a5 \ubc1b\uae30</button><button class="secondary" id="stop-characters" ${characterJob?'':'hidden'}>\uc9c0\uae08 \ud56d\ubaa9 \uc800\uc7a5 \ud6c4 \uba48\ucd94\uae30</button></div>
 <p class="soft-note">\uc720\ub8cc AI\ub098 API \ud0a4\uac00 \ud544\uc694 \uc5c6\uc2b5\ub2c8\ub2e4. \uae30\uc874 \ubd80\ubaa8 \ub179\uc74c\uacfc \uc9c1\uc811 \ub4f1\ub85d\ud55c \uc774\ubbf8\uc9c0\ub294 \ub36e\uc5b4\uc4f0\uc9c0 \uc54a\uc544\uc694.</p>
 <div id="character-progress" class="character-progress" role="status" aria-live="polite">${esc(characterMessage)}</div>
 <div class="series-filters" role="group" aria-label="\uce90\ub9ad\ud130 \uc791\ud488">${DATA.characterSeries.map(g=>`<button class="secondary ${characterFilter===g.id?'selected':''}" data-character-filter="${g.id}">${g.label}</button>`).join('')}</div>
 <div class="character-grid">${list.map(w=>`<article class="character-tile"><div class="character-thumb">${picture(w)}</div><h4>${esc(w.label)}</h4><small class="${characterURI(w)?'saved-state':''}">${characterImageLabel(w)}</small><button class="secondary" data-character-get="${w.id}" ${media.has('character:'+w.id)?'disabled':''}>${media.has('character:'+w.id)?'\uc6d0\ubcf8 \uc800\uc7a5\ub428':'\uc6d0\ubcf8 \ubc1b\uae30'}</button><button class="text-btn" data-character-edit="${w.id}">\ub0b4 \uadf8\ub9bc\ub3c4 \ub123\uae30 / \ub179\uc74c</button></article>`).join('')}</div>
 </section><section class="setting-block"><h3>\uc774\ubbf8\uc9c0 \uc801\uc6a9 \ubc29\uc2dd</h3><p><b>\uce90\ub9ad\ud130\ub294 \ub0b4\uac00 \ub123\uc740 \uc774\ubbf8\uc9c0 \u2192 \uc800\uc7a5\ub41c \uc6d0\ubcf8 \uc21c\uc11c</b>\ub85c \ubcf4\uc5ec\uc694. \ub3d9\ubb3c\u00b7\uacfc\uc77c \ub4f1 \uc77c\ubc18 \uce74\ub4dc\uc758 \uadf8\ub9bc \uc124\uc815\uacfc\ub294 \ubcc4\uac1c\uc608\uc694.</p><p>\uc544\uc774\ud3f0\uacfc \uc544\uc774\ud328\ub4dc\uc5d0 \uac01\uac01 \ubc1b\uac70\ub098, \uc800\uc7a5\u00b7\ubc31\uc5c5\uc5d0\uc11c \ubc31\uc5c5 \ud30c\uc77c\ub85c \uc62e\uaca8\uc8fc\uc138\uc694.</p></section>
 <section class="setting-block source-notes"><h3>\ucd9c\ucc98\uc640 \ud655\uc778 \ubc94\uc704</h3><p>\ubf40\ub85c\ub85c: \uc694\uccad\ud558\uc2e0 \ubf40\ub85c\ub85c\ud30c\ud06c \ud398\uc774\uc9c0 \uc811\uc18d \uc2e4\ud328\ub85c <a href="https://www.iconix.co.kr/works/iconix-detail.php?idx=1" target="_blank" rel="noopener noreferrer">\uc544\uc774\ucf54\ub2c9\uc2a4 \uacf5\uc2dd \uce90\ub9ad\ud130 \uc18c\uac1c</a>\uc758 \uc6d0\ubcf8\uc744 \uc0ac\uc6a9\ud569\ub2c8\ub2e4.</p><p>\uc544\uae30\uc0c1\uc5b4: <a href="https://with-hs.tistory.com/184" target="_blank" rel="noopener noreferrer">With HS \uc18c\uac1c\uae00</a>\uc758 \uc774\ubbf8\uc9c0(\uae00\uc5d0 \ud45c\uc2dc\ub41c \ucd9c\ucc98 KBS)\ub97c \uc0ac\uc6a9\ud569\ub2c8\ub2e4. \uc124\uba85 \uae00\uc790\ub97c \uc81c\uc678\ud558\uace0 \uce90\ub9ad\ud130 \uc601\uc5ed\ub9cc \ud45c\uc2dc\ud569\ub2c8\ub2e4.</p><p><b>\ub124\uc774\ubc84 \ub9c1\ud06c\ub294 \ubcf8\ubb38 \ud655\uc778 \ubd88\uac00\ub85c \ubbf8\ubc18\uc601</b>\uc785\ub2c8\ub2e4. \uc784\uc758\uc758 \uce90\ub9ad\ud130\ub97c \ucd94\uac00\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.</p><small>\uac01 \uc774\ubbf8\uc9c0\uc758 \uad8c\ub9ac\ub294 \uc6d0\uad8c\ub9ac\uc790\uc5d0\uac8c \uc788\uc2b5\ub2c8\ub2e4. \ubcc4\ub3c4 \uc774\uc6a9\ud5c8\ub77d\uc744 \ud655\ubcf4\ud55c \uac83\uc740 \uc544\ub2d9\ub2c8\ub2e4.</small></section>`;
 $('#get-all-characters').onclick=()=>prepareCharacters(all);
 $('#stop-characters').onclick=()=>{characterCancel=true;$('#stop-characters').disabled=true;};
 $$('[data-character-get]').forEach(b=>b.onclick=()=>prepareCharacters([WORD_MAP.get(b.dataset.characterGet)]));
 $$('[data-character-filter]').forEach(b=>b.onclick=()=>{characterFilter=b.dataset.characterFilter;renderCharacters();});
 $$('[data-character-edit]').forEach(b=>b.onclick=()=>{parentTab='library';libCat='characters';editId=b.dataset.characterEdit;renderParents();});
 if(characterJob)disableCharacterControls();
}
function disableCharacterControls(){
 $$('[data-tab],#close-parents,#get-all-characters,[data-character-get],[data-character-edit],[data-character-filter]').forEach(b=>b.disabled=true);
}
async function normaliseCharacter(blob,source){
 if(blob.size>5*1024*1024||!/^image\/(png|jpeg|webp)$/.test(blob.type))throw Error('invalid-image');
 const uri=URL.createObjectURL(blob);
 try {
  const img=new Image();img.src=uri;await img.decode();
  const nw=img.naturalWidth,nh=img.naturalHeight;
  if(!nw||nw*nh>30e6)throw Error('invalid-image-dimensions');
  let x=0,y=0,w=nw,h=nh;
  if(source.crop){
   const [sx,sy,sw,sh,bw,bh]=source.crop;
   if(Math.abs(nw/nh-bw/bh)>.025)throw Error('source-layout-changed');
   x=sx*nw/bw;y=sy*nh/bh;w=sw*nw/bw;h=sh*nh/bh;
   if(x<0||y<0||x+w>nw||y+h>nh)throw Error('source-layout-changed');
  }
  const c=document.createElement('canvas');c.width=640;c.height=640;const ctx=c.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,640,640);
  const scale=Math.min(580/w,580/h);ctx.drawImage(img,x,y,w,h,(640-w*scale)/2,(640-h*scale)/2,w*scale,h*scale);
  return c.toDataURL('image/webp',.94);
 } finally {URL.revokeObjectURL(uri);}
}
async function prepareCharacters(words){
 if(characterJob||recordBusy()||pendingRecording||aiJob)return;
 if(!storageOK||!db)return toast('\uc800\uc7a5\u00b7\ubc31\uc5c5\uc5d0\uc11c \uae30\uae30 \uc800\uc7a5\uc18c\ub97c \uba3c\uc800 \uc5f0\uacb0\ud574\uc8fc\uc138\uc694.');
 const todo=words.filter(w=>!media.has('character:'+w.id));
 if(!todo.length)return toast('\uc120\ud0dd\ud55c \uc6d0\ubcf8\uc740 \ubaa8\ub450 \uc800\uc7a5\ub418\uc5b4 \uc788\uc5b4\uc694.');
 if(!navigator.onLine)return toast('\uc6d0\ubcf8\uc744 \ucc98\uc74c \ubc1b\uc744 \ub54c\uc5d0\ub9cc \uc778\ud130\ub137\uc744 \ucf1c\uc8fc\uc138\uc694.');
 characterJob={done:0,total:todo.length,failed:[]};characterCancel=false;characterMessage='\uc6d0\ubcf8 \uc900\ube44\ub97c \uc2dc\uc791\ud569\ub2c8\ub2e4.';AudioEngine.stop();renderCharacters();
 try {
  for(const w of todo){
   if(characterCancel)break;
   $('#character-progress').textContent=`${characterJob.done}/${characterJob.total}\uc7a5 \uc800\uc7a5\ub428 \u00b7 ${w.label} \ubc1b\ub294 \uc911`;
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);
   try{
    const r=await fetch('/api/character?id='+encodeURIComponent(w.id),{method:'GET',signal:controller.signal});
    if(!r.ok)throw Error(r.status===404?'api-missing':'source-unavailable');
    const blob=await r.blob();const image=await normaliseCharacter(blob,characterSourceMap.get(w.id));
    await putMedia('character:'+w.id,image,{source:'original',mime:image.slice(5).split(';')[0]});
    characterJob.done++;$('#character-ready-count').textContent=`${characterCount()} / ${DATA.characterSources.length}`;
   }catch(e){
    let why=e.message==='api-missing'?'api \ud3f4\ub354 \ubc30\ud3ec \ud655\uc778':e.message==='source-layout-changed'?'\uc6d0\ubcf8 \uad6c\uc131 \ubcc0\uacbd':e.name==='AbortError'?'\uc751\ub2f5 \uc2dc\uac04 \ucd08\uacfc':'\uc6d0\ubcf8 \ubc1b\uae30 \ub610\ub294 \uc800\uc7a5 \uc2e4\ud328';
    characterJob.failed.push(w.label+' ('+why+')');
    if(!navigator.onLine)break;
   }finally{clearTimeout(timer);}
  }
  characterMessage=`${characterJob.done}\uc7a5 \uc800\uc7a5\u00b7\uc7ac\ud655\uc778 \uc644\ub8cc. `+(characterCancel?'\ubc1b\uae30\ub97c \uba48\ucdc4\uc5b4\uc694. ':'')+(characterJob.failed.length?'\ubbf8\uc644\ub8cc: '+characterJob.failed.join(', ')+'. \ub2e4\uc2dc \ub204\ub974\uba74 \ube60\uc9c4 \uc6d0\ubcf8\ub9cc \ubc1b\uc2b5\ub2c8\ub2e4.':'\uc900\ube44\ub41c \uce90\ub9ad\ud130\ub294 \uc774\uc81c \uc624\ud504\ub77c\uc778\uc73c\ub85c \ub180 \uc218 \uc788\uc5b4\uc694.');
 }finally{characterJob=null;renderCharacters();}
}
