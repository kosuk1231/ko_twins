
/* Word Garden 1.0.0. No framework, tracker, cloud TTS, or runtime dependency.
   Source content is embedded in index.html. Media stays in this browser's IndexedDB. */
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const el=document.getElementById("app");
const DATA=JSON.parse(document.getElementById("app-data").textContent);
const WORDS=DATA.words;
const WORD_MAP=new Map(WORDS.map(w=>[w.id,w]));
const CATS=DATA.categories;
const PROFILES={seol:{name:"고은설",short:"은설",call:"은설아"},chae:{name:"고은채",short:"은채",call:"은채야"},both:{name:"은설 · 은채",short:"함께",call:"은설아, 은채야"}};
const DEFAULTS={profile:"seol",mode:"cards",category:"animals",count:6,minutes:3,choices:2,rate:.88,picture:"mixed",autoRead:true,cues:true,showLabels:false,voiceURI:""};
let settings=loadSettings();
let media=new Map(),db=null,storageOK=true;
let session=null,screen="home",parentTab="settings",editId=null,libCat="animals",search="";
let coreReady=false,cacheState="checking",holdTimer=null,holdPassed=false;
let lastToast="",toastTimer=0,recording=null,recordTimer=null,pendingFileAction=null,recordPending=false;
const audioBuffers=new Map();
const SW_VERSION="word-garden-v1.0.0";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function icon(name,size=22){
 const paths={
 leaf:'<path d="M20 4C9 3 3 8 5 15c2 6 12 7 15-11Z"/><path d="m5 21 8-10"/>',
 gear:'<path d="m9 3-.6 2.2-2 .9-2-.5-2 3.5 1.5 1.6v2.5l-1.5 1.6 2 3.5 2-.5 2 .9L9 21h4l.6-2.2 2-.9 2 .5 2-3.5-1.5-1.6v-2.5l1.5-1.6-2-3.5-2 .5-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/>',
 speaker:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 back:'<path d="m14 6-6 6 6 6"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 home:'<path d="m3 11 9-8 9 8v9H3v-9Z"/><path d="M9 20v-7h6v7"/>',
 cards:'<rect x="6" y="4" width="14" height="17" rx="3"/><path d="M3 17V5a3 3 0 0 1 3-3m4 8h6m-6 5h4"/>',
 find:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 phrase:'<path d="M20 14a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-2-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8Z"/><path d="M7 8h8M7 12h5"/>',
 pair:'<rect x="2" y="3" width="9" height="14" rx="2"/><rect x="13" y="7" width="9" height="14" rx="2"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 swap:'<path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/>',
 heart:'<path d="M20 4a5 5 0 0 0-8 2 5 5 0 0 0-8-2C-2 10 8 18 12 21c4-3 14-11 8-17Z"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 mic:'<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10a7 7 0 0 0 14 0m-7 7v5m-4 0h8"/>',
 photo:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>'
 };
 return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.leaf}</svg>`;
}
function loadSettings(){try{return validateSettings(JSON.parse(localStorage.getItem("word-garden-settings")||"{}"))}catch{return {...DEFAULTS}}}
function validateSettings(s){
 const v={...DEFAULTS}; if(!s||typeof s!=="object")return v;
 for(const [k,allowed] of Object.entries({profile:Object.keys(PROFILES),mode:["cards","find","phrase","pair"],category:CATS.map(c=>c.id),count:[4,6,8],minutes:[1,3,5],choices:[2,3],picture:["mixed","drawing","photo"]})){if(allowed.includes(s[k]))v[k]=s[k]}
 for(const k of ["autoRead","cues","showLabels"])if(typeof s[k]==="boolean")v[k]=s[k];
 if(typeof s.rate==="number"&&s.rate>=.65&&s.rate<=1.1)v.rate=s.rate;
 if(typeof s.voiceURI==="string"&&s.voiceURI.length<300)v.voiceURI=s.voiceURI;
 return v;
}
function saveSettings(){try{localStorage.setItem("word-garden-settings",JSON.stringify(settings))}catch{toast("이 브라우저에서는 설정이 영구 저장되지 않아요.")}}
function toast(message){lastToast=message;const t=$("#toast");t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3800)}
function shuffled(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function profile(){return PROFILES[settings.profile]}
function readyWords(category){return WORDS.filter(w=>(!category||w.category===category)&&(!w.template||media.has("photo:"+w.id)))}
function photoFor(w){return media.get("photo:"+w.id)||DATA.embeddedPhotos[w.id]||null}
function shouldPhoto(w,force=null){if(!photoFor(w))return false;if(w.template)return true;if(force!==null)return force;if(settings.picture==="drawing")return false;return true}
function picture(w,force=null){const photo=shouldPhoto(w,force);return photo?`<span class="picture"><img src="${photoFor(w)}" alt="${esc(w.label)}" draggable="false"></span>`:`<span class="picture"><span class="emoji" role="img" aria-label="${esc(w.label)}">${w.emoji||"🖼️"}</span></span>`}
function parentButton(){return `<button class="icon-btn parent-btn" id="parents" aria-label="부모 설정. 1.2초 길게 누르세요." title="1.2초 길게 누르기">${icon("gear",19)}<span class="parent-label">부모</span></button>`}
function cacheLabel(){if(window.WORD_GARDEN_PREVIEW)return "미리보기";if(coreReady)return "화면 저장됨";if(location.protocol==="file:")return "설치 전";if(cacheState==="failed")return "저장 확인 필요";return "화면 저장 중"}
function renderHome(){
 screen="home";
 el.innerHTML=`<div class="app"><header class="topbar">
 <div class="brand"><span class="brand-mark">${icon("leaf",27)}</span><div><div class="brand-name">말랑말랑 낱말정원</div><div class="brand-sub">은설 · 은채의 작은 말놀이</div></div></div>
 <div class="header-actions"><span class="status-chip ${coreReady?"":"pending"}" id="cache-chip">${cacheLabel()}</span>${parentButton()}</div></header>
 <section class="intro-row"><div><div class="eyebrow">작은 낱말 하나, 다정한 대화 하나</div><h1>${profile().call}, 오늘은 뭐 하고 놀까?</h1><p>함께 보고, 듣고, 말해요. 정답보다 즐거운 대화가 먼저예요.</p></div>
 <div class="profile-switch" role="group" aria-label="함께 놀 아이">${Object.entries(PROFILES).map(([id,p])=>`<button data-profile="${id}" class="${settings.profile===id?"selected":""}" aria-pressed="${settings.profile===id}"><i class="profile-dot ${id}"></i>${p.short}</button>`).join("")}</div></section>
 <section class="hero"><div class="hero-copy"><span class="pill">${settings.minutes}분 정도 · 카드 ${Math.min(settings.count,readyWords(settings.category).length)||settings.count}장</span>
 <h2>오늘도 말이<br>한 뼘 자라요</h2><p id="start-summary">${CATS.find(c=>c.id===settings.category).label} 친구들과 ${modeName(settings.mode)}</p>
 <button class="primary" id="start">함께 놀이 시작 ${icon("arrow",21)}</button></div>
 <div class="hero-art" aria-hidden="true"><span class="art-flower">✳</span><div class="preview-card first"><span>🐰</span><b>토끼</b></div><div class="preview-card second"><span>🍎</span><b>사과</b></div><span class="art-dots">· · ·</span></div></section>
 <section><div class="section-head"><h2>어떻게 놀까요?</h2><small>처음에는 ‘낱말 보기’부터</small></div>
 <div class="modes" role="group" aria-label="놀이 선택">
 ${[["cards","cards","낱말 보기","큰 그림을 톡!"],["find","find","듣고 찾기","두 장 중 골라요"],["phrase","phrase","두 낱말 말하기","밥 + 먹어요"],["pair","pair","같은 그림 찾기","똑같은 친구 찾기"]].map(([id,ic,label,hint])=>`<button class="mode ${settings.mode===id?"selected":""}" data-mode="${id}" aria-pressed="${settings.mode===id}"><span class="mode-icon">${icon(ic,25)}</span><span><strong>${label}</strong><small>${hint}</small></span></button>`).join("")}</div></section>
 <section><div class="section-head"><h2>좋아하는 낱말을 골라요</h2><small>${readyWords().length}장의 놀이 카드</small></div>
 <div class="categories" role="group" aria-label="주제 선택">${CATS.map(c=>`<button class="category ${settings.category===c.id?"selected":""}" data-category="${c.id}" aria-pressed="${settings.category===c.id}" style="--tile:${c.color}"><span class="emoji" aria-hidden="true">${c.emoji}</span><strong>${c.label}</strong><small>${c.id==="characters"?(readyWords(c.id).length?readyWords(c.id).length+"장 준비됨":"사진을 넣어 시작"):c.hint}</small></button>`).join("")}</div></section>
 ${!AudioEngine.voice&&!media.size?`<div class="home-notice"><p>소리가 안 들리면 부모 설정에서 한국어 음성을 확인해 주세요.</p><button id="test-voice">소리 확인</button></div>`:""}
 <footer class="home-footer"><span>광고 없이 · 경쟁 없이 · 부모와 함께</span><button class="text-btn" id="installation">설치 · 오프라인 안내</button></footer>
 </div>`;
 bindParentButton();
 $$("[data-profile]").forEach(b=>b.onclick=()=>{settings.profile=b.dataset.profile;saveSettings();AudioEngine.unlock();AudioEngine.say(`${profile().call}, 같이 놀자.`,"name:"+settings.profile);renderHome()});
 $$("[data-mode]").forEach(b=>b.onclick=()=>{settings.mode=b.dataset.mode;saveSettings();renderHome()});
 $$("[data-category]").forEach(b=>b.onclick=()=>{settings.category=b.dataset.category;saveSettings();renderHome();if(b.dataset.category==="characters"&&!readyWords("characters").length)toast("캐릭터 사진은 부모 설정 → 카드 꾸미기에서 넣어주세요.")});
 $("#start").onclick=startSession;
 $("#installation").onclick=()=>showHelp();
 if($("#test-voice"))$("#test-voice").onclick=()=>{AudioEngine.unlock();AudioEngine.say("안녕. 사과. 바나나.","system:test")};
}
function modeName(m){return {cards:"낱말 보기",find:"듣고 찾기",phrase:"두 낱말 말하기",pair:"같은 그림 찾기"}[m]}
function bindParentButton(){
 const b=$("#parents");if(!b)return;
 const start=(e)=>{if(e.type==="pointerdown"&&e.button!==0)return;holdPassed=false;clearTimeout(holdTimer);b.classList.add("holding");holdTimer=setTimeout(()=>{holdPassed=true;b.classList.remove("holding");showParents()},1200)};
 const cancel=()=>{clearTimeout(holdTimer);b.classList.remove("holding")};
 b.onpointerdown=start;b.onpointerup=cancel;b.onpointercancel=cancel;b.onpointerleave=cancel;
 b.onclick=()=>{if(!holdPassed)toast("부모 버튼을 1.2초 동안 길게 눌러주세요.")};
 b.oncontextmenu=e=>e.preventDefault();
 b.onkeydown=e=>{if((e.key==="Enter"||e.key===" ")&&!e.repeat){e.preventDefault();start(e)}};
 b.onkeyup=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();cancel()}};
}
const AudioEngine={
 ctx:null,source:null,voice:null,seq:0,active:null,voices:[],audioElement:null,
 initVoices(){
  if(!("speechSynthesis"in window))return;
  this.voices=speechSynthesis.getVoices().filter(v=>/^ko(?:[-_]|$)/i.test(v.lang)&&v.localService===true);
  this.voice=this.voices.find(v=>v.voiceURI===settings.voiceURI)||this.voices.find(v=>v.default)||this.voices[0]||null;
 },
 unlock(){
  this.initVoices();
  try{
   if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(A)this.ctx=new A({latencyHint:"interactive"})}
   if(this.ctx&&this.ctx.state!=="running")this.ctx.resume().catch(()=>{});
  }catch{}
 },
 stop(){
  this.seq++;
  if(this.source){try{this.source.stop()}catch{}this.source=null}
  if(this.audioElement){this.audioElement.pause();this.audioElement=null}
  if("speechSynthesis"in window)speechSynthesis.cancel();this.active=null;
 },
 async decode(key,uri){
  if(audioBuffers.has(key))return audioBuffers.get(key);
  if(!this.ctx)return null;
  try{const encoded=uri.split(",")[1];const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));const buffer=await this.ctx.decodeAudioData(bytes.buffer.slice(0));audioBuffers.set(key,buffer);return buffer}catch{return null}
 },
 async say(text,key){
  this.unlock();this.stop();const seq=this.seq;const uri=media.get(key);
  if(uri){
   const buffer=await this.decode(key,uri);
   if(seq!==this.seq)return;
   if(buffer&&this.ctx){
    try{if(this.ctx.state!=="running")await this.ctx.resume();if(seq!==this.seq)return;
      const src=this.ctx.createBufferSource();src.buffer=buffer;src.connect(this.ctx.destination);this.source=src;src.start();return;
    }catch{}
   }
   try{this.audioElement=new Audio(uri);await this.audioElement.play();return}catch{toast("녹음 소리를 재생하지 못했어요. 음량과 기기 소리를 확인해 주세요.");return}
  }
  if(!this.voice){toast("기기 안의 한국어 음성이 없어요. 부모 설정에서 확인하거나 목소리를 녹음해 주세요.");return}
  const utter=new SpeechSynthesisUtterance(text);utter.lang="ko-KR";utter.voice=this.voice;utter.rate=settings.rate;utter.pitch=1;utter.volume=1;
  utter.onerror=e=>{if(seq===this.seq&&!["canceled","interrupted"].includes(e.error))toast("음성을 재생하지 못했어요. 부모 설정에서 소리를 확인해 주세요.")};
  utter.onend=()=>{if(seq===this.seq)this.active=null};this.active=utter;
  speechSynthesis.speak(utter);
 },
 async warm(keys=[]){
  if(!this.ctx)return;
  for(const key of keys){const uri=media.get(key);if(uri)await this.decode(key,uri)}
 }
};
function sessionAudio(){
 const w=session.deck[session.index];
 if(session.mode==="find")return AudioEngine.say(`${profile().call}, ${w.label} 어디 있을까?`,"ask:"+w.id+":"+settings.profile);
 if(session.mode==="pair")return AudioEngine.say("같은 그림을 찾아볼까?","system:pair");
 if(session.mode==="phrase")return AudioEngine.say(w.phrase,"phrase:"+w.id);
 return AudioEngine.say(w.label,"word:"+w.id);
}
function startSession(){
 const pool=readyWords(settings.category);
 if(!pool.length){toast("이 주제에는 아직 사진이 없어요. 부모 설정에서 캐릭터 사진을 넣어주세요.");return}
 if(["find","pair"].includes(settings.mode)&&pool.length<2){toast("찾기 놀이는 사진 카드가 두 장 이상 있어야 해요. 먼저 낱말 보기로 놀아주세요.");return}
 AudioEngine.unlock();AudioEngine.stop();
 const deck=shuffled(pool).slice(0,settings.count);
 session={deck,pool,index:0,mode:settings.mode,elapsed:0,lastTick:performance.now(),paused:false,seen:new Set(),choices:[],answer:false,pictureOverride:null,finished:false,endedByTimer:false};
 prepareRound();renderPlay();
 AudioEngine.warm(["name:"+settings.profile,"system:pair","system:again",...deck.flatMap(w=>["word:"+w.id,"phrase:"+w.id,"ask:"+w.id+":"+settings.profile])]);
 if(settings.mode==="find"||settings.mode==="pair"){if(settings.autoRead)sessionAudio()}
 else AudioEngine.say(`${profile().call}, 같이 놀자.`,"name:"+settings.profile);
}
function prepareRound(){
 const w=session.deck[session.index];session.seen.add(w.id);session.answer=false;session.pictureOverride=null;
 const alternatives=shuffled(session.pool.filter(c=>c.id!==w.id)).slice(0,settings.choices-1);
 session.choices=shuffled([w,...alternatives]);session.feedback="";
}
function renderPlay(){
 if(!session||session.finished)return;screen="play";const w=session.deck[session.index],find=["find","pair"].includes(session.mode);
 const title=session.mode==="find"?`${w.label} 어디 있을까?`:session.mode==="pair"?"같은 그림을 찾아볼까?":session.mode==="phrase"?"두 낱말을 함께 말해요":"톡 누르면 낱말이 들려요";
 el.innerHTML=`<div class="play-app"><header class="play-top"><button class="icon-btn" id="pause-home" aria-label="놀이 잠깐 멈추기">${icon("home",21)}</button><div class="play-title">${profile().short==="함께"?"은설 · 은채":profile().short}의 ${modeName(session.mode)}<small>${CATS.find(c=>c.id===w.category).label} · 부모와 함께 천천히</small></div>${parentButton()}</header>
 <div class="progress-dots" role="img" aria-label="${session.deck.length}장 중 ${session.index+1}번째 카드">${session.deck.map((_,i)=>`<span class="${i<session.index?"done":i===session.index?"current":""}"></span>`).join("")}</div>
 <section class="play-body"><h1 class="play-heading">${title}</h1>
 ${find?`${session.mode==="pair"?`<div class="match-target" aria-label="이 그림과 같은 것을 찾아요">${picture(w,session.pictureOverride)}</div>`:""}<div class="choice-grid ${session.choices.length===3?"three":""}">${session.choices.map(c=>`<button class="choice ${session.answer&&c.id===w.id?"correct":""}" data-answer="${c.id}" aria-label="${esc(c.label)} 선택">${picture(c,session.pictureOverride)}${settings.showLabels?`<span class="word-label">${c.label}</span>`:""}</button>`).join("")}</div><div class="feedback" id="feedback" role="status">${session.feedback||"&nbsp;"}</div>`:
 `<button class="word-card" id="big-card" aria-label="${esc(session.mode==="phrase"?w.phrase:w.label)} 다시 듣기"><span class="picture-tag">${shouldPhoto(w,session.pictureOverride)?"사진":"그림"}</span><span class="sound-circle">${icon("speaker",20)}</span>${picture(w,session.pictureOverride)}${session.mode==="phrase"?`<span class="phrase-label">${w.phrase.split(" ").map(p=>`<span>${p}</span>`).join("")}</span>`:`<span class="word-label">${w.label}</span>`}</button><p class="card-hint">아이의 말을 기다려 주세요. 따라 말하지 않아도 괜찮아요.</p>`}
 ${settings.cues?`<aside class="parent-cue"><span class="cue-icon" aria-hidden="true">💬</span><div><small>부모님, 이렇게 말해 보세요</small><p>${find?"먼저 충분히 살펴보게 해주세요. 어려우면 손으로 함께 짚어주세요.":w.prompt}</p></div></aside>`:""}
 <div class="play-controls"><button class="icon-btn" id="previous" aria-label="이전 카드" ${session.index===0?"disabled":""}>${icon("back",23)}</button><button class="primary" id="next">${session.index===session.deck.length-1?"놀이 마무리":"다음 카드"} ${icon("arrow",22)}</button><button class="icon-btn" id="repeat" aria-label="다시 듣기">${icon("speaker",23)}</button></div>
 <div class="play-subcontrols">${photoFor(w)&&w.emoji&&!find?`<button class="text-btn" id="picture-swap">${icon("swap",15)} ${shouldPhoto(w,session.pictureOverride)?"그림으로 보기":"사진으로 보기"}</button>`:""}<button class="text-btn" id="pause">${icon("pause",14)} 잠깐 쉬기</button></div>
 </section></div>`;
 bindParentButton();$("#repeat").onclick=sessionAudio;
 if($("#big-card"))$("#big-card").onclick=sessionAudio;
 $("#next").onclick=()=>nextRound(1);$("#previous").onclick=()=>nextRound(-1);
 $("#pause").onclick=()=>pauseSession();$("#pause-home").onclick=()=>pauseSession();
 if($("#picture-swap"))$("#picture-swap").onclick=()=>{session.pictureOverride=!shouldPhoto(w,session.pictureOverride);renderPlay()};
 $$("[data-answer]").forEach(b=>b.onclick=()=>answer(b.dataset.answer,b));
}
function answer(id,button){
 if(!session||session.answer)return;
 const w=session.deck[session.index];AudioEngine.unlock();
 if(id===w.id){
  session.answer=true;session.feedback=`${w.label}, 여기 있네!`;
  button.classList.add("correct");$("#feedback").textContent=session.feedback;
  AudioEngine.say(w.label,"word:"+w.id);
 }else{
  button.classList.add("soft");setTimeout(()=>button.classList.remove("soft"),450);
  $("#feedback").textContent="같이 한 번 더 살펴볼까?";
  AudioEngine.say("같이 한 번 더 살펴볼까?","system:again");
 }
}
function nextRound(direction){
 if(!session)return;AudioEngine.unlock();AudioEngine.stop();
 if(direction<0&&session.index===0)return;
 if(direction>0&&session.index>=session.deck.length-1){finishSession();return}
 session.index+=direction;prepareRound();renderPlay();if(settings.autoRead)sessionAudio();
}
function pauseSession(){
 if(!session||session.finished)return;session.paused=true;AudioEngine.stop();
 const d=$("#pause-dialog");d.innerHTML=`<div class="pause-dialog"><div class="ending-symbol">🌿</div><h2>잠깐 쉬어갈까요?</h2><p>서두르지 않아도 괜찮아요.<br>아이와 눈을 맞추고 이야기해 주세요.</p><div class="btn-row"><button class="primary" id="resume-play">계속 놀기</button><button class="secondary" id="end-play">이제 마무리</button></div></div>`;
 d.showModal();$("#resume-play").onclick=()=>{d.close();session.paused=false;session.lastTick=performance.now();AudioEngine.unlock()};
 $("#end-play").onclick=()=>{d.close();finishSession()};
}
function finishSession(byTimer=false){
 if(!session||session.finished)return;session.finished=true;session.paused=true;session.endedByTimer=byTimer;AudioEngine.stop();
 const encountered=[...session.seen].map(id=>WORD_MAP.get(id));const last=session.deck[session.index];
 try{
  const raw=JSON.parse(localStorage.getItem("word-garden-history")||"{}");const old=raw[settings.profile]||{};
  raw[settings.profile]={words:[...new Set([...(old.words||[]),...session.seen])],lastWords:[...session.seen],date:new Date().toISOString().slice(0,10),sessions:(old.sessions||0)+1};
  localStorage.setItem("word-garden-history",JSON.stringify(raw));
 }catch{}
 screen="end";el.innerHTML=`<div class="app"><header class="topbar"><div class="brand"><span class="brand-mark">${icon("leaf",26)}</span><b class="brand-name">말랑말랑 낱말정원</b></div>${parentButton()}</header><section class="ending"><div class="ending-symbol">🌱</div><h1>오늘의 말놀이,<br>여기까지 잘 놀았어요</h1><p>${byTimer?"약속한 시간이 지났어요. ":""}이제 화면을 내려놓고 함께 움직여볼까요?</p><div class="encountered">${encountered.map(w=>`<span>${w.emoji||"♡"} ${w.label}</span>`).join("")}</div><div class="offline-idea"><small>화면 밖으로 이어지는 놀이</small><p>${last.real}</p></div><button class="primary" id="finish-home">처음 화면으로 ${icon("home",21)}</button><p><small>본 카드는 부모 기록에만 남아요. 점수나 순위는 없어요.</small></p></section></div>`;
 bindParentButton();$("#finish-home").onclick=()=>{session=null;renderHome()};
}
setInterval(()=>{
 if(!session||session.finished||session.paused||document.hidden||screen!=="play")return;
 const now=performance.now();session.elapsed+=Math.min(now-session.lastTick,1500);session.lastTick=now;
 if(session.elapsed>=settings.minutes*60000)finishSession(true);
},500);
document.addEventListener("visibilitychange",()=>{
 AudioEngine.stop();
 if(recording)stopRecording();
 if(document.hidden&&session&&!session.finished&&screen==="play"&&!$("dialog[open]"))pauseSession();
 if(!document.hidden&&session)session.lastTick=performance.now();
});
function showParents(tab="settings"){
 if(session&&!session.finished){session.paused=true;AudioEngine.stop()}
 AudioEngine.initVoices();parentTab=tab;editId=null;
 renderParents();const d=$("#parents-dialog");if(!d.open)d.showModal();
}
function closeParents(){
 if(recording)stopRecording();
 $("#parents-dialog").close();
 if(session&&!session.finished){session.paused=false;session.lastTick=performance.now()}
 if(screen==="home")renderHome();else if(screen==="play")renderPlay();
}
function renderParents(){
 const d=$("#parents-dialog");
 d.innerHTML=`<header class="dialog-head"><div><h2>부모님 공간</h2><p>설정은 단순하게, 놀이는 다정하게</p></div><button class="icon-btn" id="close-parents" aria-label="부모 설정 닫기">${icon("close",20)}</button></header><div class="dialog-body"><nav class="tabs">${[["settings","놀이 설정"],["library","카드 꾸미기"],["offline","오프라인"],["guide","사용 안내"]].map(([id,label])=>`<button class="${parentTab===id?"active":""}" data-tab="${id}">${label}</button>`).join("")}</nav><div id="parent-content"></div></div>`;
 $("#close-parents").onclick=closeParents;
 $$("[data-tab]",d).forEach(b=>b.onclick=()=>{if(recording){toast("녹음을 먼저 멈춰주세요.");return}parentTab=b.dataset.tab;editId=null;renderParents()});
 if(parentTab==="settings")renderSettings();
 else if(parentTab==="library")editId?renderEditor():renderLibrary();
 else if(parentTab==="offline")renderOffline();
 else renderGuide();
}
function selectField(label,key,options){return `<label class="field"><span>${label}</span><select data-setting="${key}">${options.map(([v,t])=>`<option value="${v}" ${String(settings[key])===String(v)?"selected":""}>${t}</option>`).join("")}</select></label>`}
function toggleField(label,key){return `<label class="field"><span>${label}</span><input class="toggle" type="checkbox" data-setting="${key}" ${settings[key]?"checked":""}></label>`}
function renderSettings(){
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>짧고 편안한 한 번의 놀이</h3>
 ${selectField("카드 수","count",[[4,"4장"],[6,"6장 · 추천"],[8,"8장"]])}
 ${selectField("마무리 안내","minutes",[[1,"1분"],[3,"3분 · 추천"],[5,"5분"]])}
 ${selectField("찾기 선택지","choices",[[2,"2장 · 추천"],[3,"3장"]])}
 ${selectField("그림 표시","picture",[["mixed","사진 + 그림 · 추천"],["drawing","그림 우선"],["photo","사진 우선"]])}
 <p>사진이 없는 카드는 그림으로 보여요. 캐릭터 카드는 등록한 사진으로만 보여요.</p>
 ${toggleField("다음 카드에서 자동으로 읽기","autoRead")}
 ${toggleField("부모 대화 문구 표시","cues")}
 ${toggleField("찾기 놀이에 낱말 글자 표시","showLabels")}</section>
 <section class="setting-block"><h3>한국어 목소리</h3>
 ${selectField("말하는 속도","rate",[[.75,"조금 천천히"],[.88,"편안하게 · 추천"],[1,"보통"]])}
 <label class="field"><span>기기 안의 음성</span><select id="voice-select">${AudioEngine.voices.length?AudioEngine.voices.map(v=>`<option value="${esc(v.voiceURI)}" ${AudioEngine.voice?.voiceURI===v.voiceURI?"selected":""}>${esc(v.name)}</option>`).join(""):`<option value="">한국어 음성을 찾지 못했어요</option>`}</select></label>
 <div class="btn-row"><button class="secondary" id="voice-test">${icon("speaker",17)} 소리 확인</button><button class="secondary" id="refresh-voices">음성 다시 찾기</button></div>
 <p>서버 음성은 쓰지 않아요. 기기에 한국어 음성이 없으면 아래 안내에 따라 설치한 뒤 실제 비행기 모드에서 확인해 주세요.</p></section>
 <section class="setting-block"><h3>아이 이름 불러주기</h3><p>기본은 기기 음성입니다. 부모 목소리로 녹음하면 그 소리를 먼저 사용해요.</p>
 ${recordRow("name:seol","은설아, 같이 놀자.")}
 ${recordRow("name:chae","은채야, 같이 놀자.")}
 ${recordRow("name:both","은설아, 은채야, 같이 놀자.")}
 <div id="record-live"></div></section>
 <section class="setting-block"><h3>아이별 놀이 기록</h3><p>맞고 틀림이나 발달 수준을 평가하지 않아요. 함께 본 낱말만 기록해요.</p>${historyHTML()}</section>`;
 $$("[data-setting]").forEach(x=>x.onchange=()=>{const key=x.dataset.setting;settings[key]=x.type==="checkbox"?x.checked:["count","minutes","choices","rate"].includes(key)?Number(x.value):x.value;settings=validateSettings(settings);saveSettings()});
 $("#voice-select").onchange=e=>{settings.voiceURI=e.target.value;saveSettings();AudioEngine.initVoices()};
 $("#voice-test").onclick=()=>{AudioEngine.unlock();AudioEngine.say("안녕. 사과. 바나나.","system:test")};
 $("#refresh-voices").onclick=()=>{AudioEngine.initVoices();renderSettings();toast(AudioEngine.voice?"기기 한국어 음성을 찾았어요.":"음성을 아직 찾지 못했어요. 앱을 완전히 닫았다 다시 열어보세요.")};
 bindRecordRows();
}
function historyHTML(){
 let h={};try{h=JSON.parse(localStorage.getItem("word-garden-history")||"{}")}catch{}
 return Object.entries(PROFILES).map(([id,p])=>`<div class="health-row"><span>${p.name}</span><strong>${h[id]?.words?.length||0}개 낱말을 함께 봤어요</strong></div>`).join("");
}
function recordRow(key,text){
 const recorded=media.has(key);
 return `<div class="record-row"><div class="record-row-title"><strong>${esc(text)}</strong><small>${recorded?"녹음 저장됨":"기기 음성"}</small></div><div class="btn-row"><button class="secondary" data-record="${key}" data-text="${esc(text)}">${icon("mic",15)} ${recorded?"다시 녹음":"직접 녹음"}</button><button class="secondary" data-listen="${key}" data-text="${esc(text)}">듣기</button>${recorded?`<button class="secondary" data-delete-audio="${key}">녹음 지우기</button>`:""}</div></div>`;
}
function bindRecordRows(){
 $$("[data-record]").forEach(b=>b.onclick=()=>recording?stopRecording():startRecording(b.dataset.record,b.dataset.text));
 $$("[data-listen]").forEach(b=>b.onclick=()=>{AudioEngine.unlock();AudioEngine.say(b.dataset.text,b.dataset.listen)});
 $$("[data-delete-audio]").forEach(b=>b.onclick=async()=>{if(recording)return toast("녹음을 먼저 멈춰주세요.");try{await removeMedia(b.dataset.deleteAudio);audioBuffers.delete(b.dataset.deleteAudio);refreshParentContent();toast("녹음을 지웠어요. 다시 기기 음성을 사용해요.")}catch{toast("녹음을 지우지 못했어요. 저장 공간을 확인해 주세요.")}});
}
function renderLibrary(){
 const list=WORDS.filter(w=>w.category===libCat&&w.label.includes(search));
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>익숙한 얼굴과 물건으로</h3><p>카드를 누르면 사진을 바꾸거나 부모 목소리를 녹음할 수 있어요. 사진과 녹음은 이 기기에만 저장돼요.</p><div class="library-top"><select id="lib-category" aria-label="꾸밀 주제">${CATS.map(c=>`<option value="${c.id}" ${libCat===c.id?"selected":""}>${c.label}</option>`).join("")}</select><input id="lib-search" value="${esc(search)}" placeholder="낱말 찾기" aria-label="낱말 검색"></div>
 ${libCat==="characters"?`<div class="notice">뽀로로·크롱·루피 등 8개 이름을 준비했어요. <b>캐릭터 원본 이미지는 포함하지 않았어요.</b> 사용할 수 있는 캐릭터 그림이나 장난감 사진을 등록하면 놀이에 나타나요. 서로 다른 캐릭터 사진을 넣어주세요.</div>`:""}
 <div class="library-list">${list.map(w=>`<button class="lib-item" data-edit="${w.id}"><span class="lib-thumb">${photoFor(w)?`<img src="${photoFor(w)}" alt="">`:w.emoji||icon("photo",24)}</span><span><strong>${w.label}</strong><small>${w.template&&!photoFor(w)?"사진 등록 필요":photoFor(w)?"사진 준비됨":"그림 준비됨"}${media.has("word:"+w.id)?" · 녹음":" "}</small></span></button>`).join("")||"<p>해당하는 낱말이 없어요.</p>"}</div></section>
 <section class="setting-block"><h3>과일 사진 2장 더하기</h3><p>기본 고양이 사진에 사과·바나나 실물 사진을 추가할 수 있어요. 처음 받을 때만 인터넷이 필요해요. 저장한 뒤에는 인터넷 없이 보여요.</p><button class="secondary" id="get-photos">사과 · 바나나 사진 받기</button><p id="photo-progress" role="status"></p></section>`;
 $("#lib-category").onchange=e=>{libCat=e.target.value;search="";renderLibrary()};
 $("#lib-search").oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;renderLibrary();const i=$("#lib-search");i.focus();i.setSelectionRange(pos,pos)};
 $$("[data-edit]").forEach(b=>b.onclick=()=>{editId=b.dataset.edit;renderEditor()});
 $("#get-photos").onclick=downloadPhotos;
}
function renderEditor(){
 const w=WORD_MAP.get(editId);
 $("#parent-content").innerHTML=`<button class="back-editor" id="back-library">${icon("back",16)} 카드 목록</button><section class="setting-block"><h3>${w.label} 카드</h3>
 <div class="editor-picture">${photoFor(w)?`<img src="${photoFor(w)}" alt="${w.label}">`:`<span class="emoji">${w.emoji||"🖼️"}</span>`}</div>
 <div class="editor-actions"><button class="secondary" id="add-photo">${icon("photo",16)} 사진 선택</button>${media.has("photo:"+w.id)?`<button class="secondary" id="delete-photo">내 사진 지우기</button>`:""}</div>
 <p class="soft-note">${w.category==="people"?"엄마·아빠·가족의 실제 사진을 넣으면 더 익숙하게 놀 수 있어요.":w.template?"사용할 수 있는 해당 캐릭터의 그림 또는 장난감 사진을 선택해 주세요.":"사물이 잘 보이는 사진 한 장을 골라주세요."} 사진은 긴 변 720픽셀로 줄여 기기에 저장해요.</p></section>
 <section class="setting-block"><h3>이 카드의 목소리</h3>${recordRow("word:"+w.id,w.label)}${recordRow("phrase:"+w.id,w.phrase)}
 <details><summary class="text-btn">찾기 놀이 질문도 녹음하기</summary>${Object.entries(PROFILES).map(([id,p])=>recordRow("ask:"+w.id+":"+id,`${p.call}, ${w.label} 어디 있을까?`)).join("")}</details><div id="record-live"></div>
 <p>녹음하지 않은 부분은 기기의 한국어 음성으로 읽어요. 안내 문장까지 오프라인에서 들으려면 한국어 기기 음성이 필요해요.</p></section>`;
 $("#back-library").onclick=()=>{if(recording)return toast("녹음을 먼저 멈춰주세요.");editId=null;renderLibrary()};
 $("#add-photo").onclick=()=>{pendingFileAction={type:"photo",id:w.id};const f=$("#image-input");f.value="";f.click()};
 if($("#delete-photo"))$("#delete-photo").onclick=async()=>{try{await removeMedia("photo:"+w.id);renderEditor();toast("등록한 사진을 지웠어요.")}catch{toast("사진을 지우지 못했어요.")}};
 bindRecordRows();
}
function refreshParentContent(){
 if(parentTab==="settings")renderSettings();
 else if(parentTab==="library"){if(editId)renderEditor();else renderLibrary()}
 else if(parentTab==="offline")renderOffline();
}
async function startRecording(key,text){
 if(!storageOK)return toast("이 브라우저에서는 저장할 수 없어요. Safari의 설치된 앱에서 다시 해주세요.");
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast("녹음은 HTTPS 주소 또는 컴퓨터 localhost에서 지원돼요.");
 if(recording||recordPending)return;
 recordPending=true;
 AudioEngine.unlock();AudioEngine.stop();
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  recordPending=false;
  if(!$("#parents-dialog").open||document.hidden){stream.getTracks().forEach(t=>t.stop());return}
  const type=["audio/mp4","audio/webm;codecs=opus","audio/webm"].find(t=>MediaRecorder.isTypeSupported(t));
  const recorder=new MediaRecorder(stream,type?{mimeType:type}:undefined);
  const chunks=[];recording={key,text,recorder,stream,start:performance.now()};
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onerror=()=>{stream.getTracks().forEach(t=>t.stop());recording=null;clearInterval(recordTimer);toast("녹음 중 오류가 났어요. 다시 시도해 주세요.");refreshParentContent()};
  recorder.onstop=async()=>{
   stream.getTracks().forEach(t=>t.stop());clearInterval(recordTimer);recording=null;
   try{
    const blob=new Blob(chunks,{type:recorder.mimeType||"audio/mp4"});
    if(blob.size<150)throw Error("empty");
    const uri=await blobToDataURL(blob);await putMedia(key,uri);audioBuffers.delete(key);await AudioEngine.decode(key,uri);
    refreshParentContent();toast("목소리를 이 기기에 저장했어요.");
   }catch{toast("녹음을 저장하지 못했어요. 저장 공간과 권한을 확인해 주세요.");refreshParentContent()}
  };
  recorder.start();const b=$(`[data-record="${key}"]`);if(b){b.textContent="■ 녹음 멈추기";b.classList.add("recording")}
  $$("[data-record]").forEach(x=>{if(x!==b)x.disabled=true});
  recordTimer=setInterval(()=>{const sec=Math.floor((performance.now()-recording.start)/1000);const line=$("#record-live");if(line)line.innerHTML=`<div class="record-live"><span class="recording-dot"></span>녹음 중 ${sec}초 / 8초 · “${esc(text)}”</div>`;if(sec>=8)stopRecording()},150);
 }catch(e){recordPending=false;toast(e.name==="NotAllowedError"?"마이크 권한이 필요해요. 녹음하지 않아도 기기 음성으로 놀 수 있어요.":"마이크를 사용할 수 없어요. 다른 녹음 앱을 닫고 다시 해주세요.")}
}
function stopRecording(){if(recording?.recorder.state==="recording")recording.recorder.stop();clearInterval(recordTimer)}
function blobToDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
async function resizePhoto(blob){
 if(blob.size>20*1024*1024)throw Error("too-big");
 const url=URL.createObjectURL(blob);
 try{
  const img=new Image();img.src=url;await img.decode();if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>60e6)throw Error("too-big");
  const scale=Math.min(1,720/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=c.getContext("2d");ctx.fillStyle="#ffffff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.87);
 }finally{URL.revokeObjectURL(url)}
}
$("#image-input").onchange=async e=>{
 const f=e.target.files?.[0],action=pendingFileAction;if(!f||!action)return;
 try{const uri=await resizePhoto(f);await putMedia("photo:"+action.id,uri);if(editId===action.id)renderEditor();toast("사진을 저장했어요. 인터넷 없이도 볼 수 있어요.")}
 catch(err){toast(err.message==="too-big"?"사진은 20MB 이하로 골라주세요.":"사진을 저장하지 못했어요. JPG 또는 PNG 사진으로 다시 선택해 주세요.")}
 pendingFileAction=null;
};
async function downloadPhotos(){
 const b=$("#get-photos"),p=$("#photo-progress");b.disabled=true;b.textContent="사진 받는 중…";
 let n=0;
 for(const item of DATA.photoPacks){
  if(media.has("photo:"+item.id)){n++;continue}
  try{
   const c=new AbortController(),timer=setTimeout(()=>c.abort(),10000);
   let res;try{res=await fetch(item.url,{mode:"cors",credentials:"omit",referrerPolicy:"no-referrer",signal:c.signal})}finally{clearTimeout(timer)}
   if(!res.ok)throw Error("http");const blob=await res.blob();const uri=await resizePhoto(blob);await putMedia("photo:"+item.id,uri);n++;
  }catch{}
  if(p?.isConnected)p.textContent=`${n} / ${DATA.photoPacks.length}장 저장됨`;
 }
 if(b?.isConnected){b.disabled=false;b.textContent="사과 · 바나나 사진 받기"}
 if(p?.isConnected)p.textContent=n===DATA.photoPacks.length?"사진을 모두 저장했어요. 이후에는 인터넷이 필요 없어요.":"일부 사진을 받지 못했어요. 인터넷 연결을 확인하거나 직접 사진을 넣어주세요.";
}
function renderOffline(){
 const recorded=[...media.keys()].filter(k=>!k.startsWith("photo:")).length;
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>오프라인 준비 확인</h3>
 <div class="health-row"><span>앱 화면 · 기본 카드</span><strong class="${coreReady?"":"warn"}">${coreReady?"기기에 저장됨":location.protocol==="file:"?"HTTPS 설치 주소 필요":"저장 확인 필요"}</strong></div>
 <div class="health-row"><span>기기 한국어 음성</span><strong class="${AudioEngine.voice?"":"warn"}">${AudioEngine.voice?esc(AudioEngine.voice.name):"찾지 못했어요"}</strong></div>
 <div class="health-row"><span>추가 사진 · 녹음</span><strong>${[...media.keys()].filter(k=>k.startsWith("photo:")).length}장 · ${recorded}개</strong></div>
 <div class="health-row"><span>사진 · 녹음 저장소</span><strong class="${storageOK?"":"warn"}">${storageOK?"사용 가능":"영구 저장 불가"}</strong></div>
 <div class="notice"><b>‘화면 저장됨’은 음성 확인과 달라요.</b><br>홈 화면에 추가한 앱을 온라인에서 한 번 연 뒤, 비행기 모드를 켜고 앱을 닫았다 다시 열어 카드와 소리가 모두 나오는지 확인해 주세요. 기기 음성이 없으면 먼저 한국어 음성을 설치해야 해요.</div>
 <div class="btn-row"><button class="secondary" id="check-offline">저장 상태 다시 확인</button><button class="secondary" id="offline-voice">${icon("speaker",16)} 지금 소리 확인</button><button class="secondary" id="persist-storage">저장 유지 요청</button></div><p id="persistence-status" role="status"></p></section>
 <section class="setting-block"><h3>아이폰 · 아이패드에서 설치</h3><p>Safari에서 <b>배포된 HTTPS 주소</b> 열기 → 공유 → 홈 화면에 추가 → 웹 앱으로 열기(표시되는 경우) → 추가. 홈 화면 아이콘으로 다시 열어주세요.</p>
 <p>파일 앱의 HTML 미리보기는 설치된 앱이 아니에요. 컴퓨터 미리보기와 실제 설치를 구분해 주세요.</p>
 <p>한국어 음성: 설정 → 손쉬운 사용에서 ‘콘텐츠 말하기’ 또는 ‘읽기 및 말하기’의 음성 메뉴를 찾아 한국어 음성을 받으세요. iOS 버전에 따라 메뉴 이름과 웹앱에 제공되는 음성이 다를 수 있어요. 다운로드 뒤 앱을 완전히 닫았다 다시 열어 확인하세요. VoiceOver 자체를 켤 필요는 없어요.</p></section>
 <section class="setting-block"><h3>사진 · 목소리 백업</h3><p>아이폰과 아이패드는 자동 동기화되지 않아요. 백업 파일을 다른 기기로 옮겨 불러오세요. 백업에는 가족 사진과 목소리가 포함될 수 있으니 안전하게 보관해 주세요.</p><div class="btn-row"><button class="secondary" id="export-backup">백업 파일 저장</button><button class="secondary" id="import-backup">백업 불러오기</button></div><p>Safari 데이터 삭제, 앱 제거, 저장 공간 정리 등으로 자료가 사라질 수 있어요. 정기적으로 백업해 주세요.</p></section>`;
 $("#check-offline").onclick=async()=>{await checkCache();AudioEngine.initVoices();renderOffline()};
 $("#offline-voice").onclick=()=>{AudioEngine.unlock();AudioEngine.say(`${profile().call}, 같이 놀자.`,"name:"+settings.profile)};
 $("#persist-storage").onclick=async()=>{let ok=false;try{ok=await navigator.storage?.persist?.()}catch{}$("#persistence-status").textContent=ok?"브라우저가 저장 유지 요청을 허용했어요. 직접 데이터 삭제까지 막을 수는 없어요.":"저장 유지를 보장할 수 없어요. 홈 화면 앱으로 사용하고 백업을 보관해 주세요."};
 $("#export-backup").onclick=exportBackup;
 $("#import-backup").onclick=()=>{const f=$("#backup-input");f.value="";f.click()};
}
function renderGuide(){
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>이렇게 시작해 보세요</h3><ol class="usage-list"><li><strong>1. 이름 → 주제 → 놀이 시작</strong>은설·은채·함께 중 고르고, 처음에는 동물 6장과 낱말 보기를 추천해요.</li><li><strong>2. 아이가 카드를 톡 눌러요</strong>낱말이 들리면 부모가 한 마디를 덧붙여 주세요. “고양이네. 야옹!”처럼요. 대답을 재촉하지 않아요.</li><li><strong>3. 익숙해지면 두 장 중 찾기</strong>어려워하면 부모가 함께 가리켜 주세요. 틀렸다는 소리나 감점은 없어요.</li><li><strong>4. 두 낱말을 연결해요</strong>“밥 먹어요”, “아빠 안녕”을 듣고 일상에서도 이어 말해보세요. 녹음이나 발음 채점을 요구하지 않아요.</li><li><strong>5. 3분 정도 뒤에는 화면 밖으로</strong>마무리 카드의 제안을 따라 인형 안기, 물건 찾기, 인사하기로 이어가세요. 3분은 앱 기본값이며 의학적 기준이 아니에요.</li></ol></section>
 <section class="setting-block"><h3>무엇을 저장하나요?</h3><p>기본 설정, 함께 본 낱말, 부모가 직접 넣은 사진·녹음만 이 브라우저에 저장해요. 회원가입, 광고, 분석 도구, 서버 업로드, 아이 음성 인식은 없어요. 사진팩 받기를 누를 때만 Wikimedia 이미지 서버에 요청해요. 이름이나 녹음을 그 요청에 보내지 않아요.</p><p>‘두뇌 활성화’나 지능 향상을 보장하는 앱이 아니에요. 부모와 그림을 보고 이야기하는 놀이 도구예요.</p></section>
 <section class="setting-block"><h3>소리와 빠른 반응에 관해</h3><p>기기 안의 한국어 음성과 저장된 녹음만 사용해요. 카드 전환에는 네트워크를 사용하지 않고 녹음은 메모리에 미리 풀어 준비해요. 기기 상태, 첫 음성 초기화, 블루투스 출력 때문에 완전한 0ms 지연을 보장하지는 못해요.</p><p>녹음한 낱말도 질문과 안내문까지 대체하지는 않아요. 오프라인에서 모든 문장을 들으려면 기기 한국어 음성을 확인해 주세요. 무음 모드, 음량, 연결된 블루투스 기기도 확인해 주세요.</p></section>
 <section class="setting-block copyright"><h3>그림과 사진 출처</h3><p>기본 그림은 기기의 이모지로 표시되며 기기마다 모양이 다를 수 있어요. 고양이 사진: Stefan van der Walt, Chelsea, CC0. scikit-image 데이터에서 크기 및 파일 형식을 조정했습니다.</p><p>추가 사과 사진: Abhijit Tembhekar · CC BY 2.0. 추가 바나나 사진: Evan-Amos · CC BY-SA 3.0. 받은 사진은 720px 이하 JPEG로 줄입니다. 바나나 사진의 변환본에도 동일 라이선스가 적용됩니다.</p>
 ${DATA.photoPacks.map(p=>`<p><a href="${p.source}" target="_blank" rel="noopener noreferrer">${esc(WORD_MAP.get(p.id).label)} 원본</a> · <a href="${p.license}" target="_blank" rel="noopener noreferrer">라이선스</a></p>`).join("")}
 <p>캐릭터 원본 이미지는 포함하지 않았습니다. 직접 등록하는 사진·그림·녹음은 사용할 권한이 있는 자료를 골라주세요. 이 앱은 뽀로로 공식 앱이 아닙니다.</p><p>말랑말랑 낱말정원 · 1.0.0 · 가족용 시제품</p></section>`;
}
function showHelp(){
 const d=$("#help-dialog");d.innerHTML=`<header class="dialog-head"><h2>설치와 첫 사용</h2><button class="icon-btn" id="close-help" aria-label="안내 닫기">${icon("close",20)}</button></header><div class="dialog-body"><section class="setting-block"><h3>아이폰 · 아이패드는 Safari에서</h3><p>배포된 HTTPS 주소를 열고 공유 → 홈 화면에 추가를 눌러주세요. 새 아이콘으로 온라인에서 한 번 열어 ‘화면 저장됨’을 확인한 뒤 비행기 모드로 시험해 보세요.</p><div class="notice">현재 전달된 HTML 파일은 컴퓨터 미리보기용이에요. ZIP 안의 파일을 HTTPS 웹호스팅에 올려야 아이폰 설치 주소가 생겨요.</div></section><section class="setting-block"><h3>소리는 기기에서 읽어요</h3><p>기기 한국어 음성이 있어야 인터넷 없이 모든 문장을 읽을 수 있어요. 없으면 손쉬운 사용의 음성 설정에서 한국어를 받은 뒤 앱을 다시 여세요. 부모 설정을 1.2초 눌러 ‘오프라인’ 탭에서 확인해 주세요.</p><p>첫 실행이나 오디오 기기에 따라 소리가 시작될 때 짧은 지연이 생길 수 있어요. 실제 아이폰·아이패드에서 마지막 확인이 필요합니다.</p></section></div>`;d.showModal();$("#close-help").onclick=()=>d.close();
}
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error("no-indexeddb"));return}
  let req;try{req=indexedDB.open("word-garden",1)}catch(e){reject(e);return}
  req.onupgradeneeded=()=>req.result.createObjectStore("media",{keyPath:"id"});
  req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error("blocked"));
  req.onsuccess=()=>{db=req.result;db.onversionchange=()=>db.close();const tx=db.transaction("media");const r=tx.objectStore("media").getAll();r.onsuccess=()=>{media=new Map(r.result.map(x=>[x.id,x.value]));resolve()};r.onerror=()=>reject(r.error)};
 });
}
async function putMedia(id,value){
 if(!db)throw Error("storage-unavailable");
 await new Promise((resolve,reject)=>{const tx=db.transaction("media","readwrite");tx.objectStore("media").put({id,value});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error)});
 media.set(id,value);
}
async function removeMedia(id){
 if(!db)throw Error("storage-unavailable");
 await new Promise((resolve,reject)=>{const tx=db.transaction("media","readwrite");tx.objectStore("media").delete(id);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error)});
 media.delete(id);
}
function exportBackup(){
 const payload={schema:1,app:"word-garden",exportedAt:new Date().toISOString(),settings,media:[...media].map(([id,value])=>({id,value}))};
 const blob=new Blob([JSON.stringify(payload)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="word-garden-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 toast("백업에는 가족 사진과 목소리가 포함될 수 있어요. 안전하게 보관해 주세요.");
}
const knownKeys=new Set(["name:seol","name:chae","name:both","system:pair","system:again","system:test",...WORDS.flatMap(w=>["photo:"+w.id,"word:"+w.id,"phrase:"+w.id,...Object.keys(PROFILES).map(p=>"ask:"+w.id+":"+p)])]);
function validateBackup(raw){
 if(!raw||raw.app!=="word-garden"||raw.schema!==1||!Array.isArray(raw.media)||raw.media.length>knownKeys.size)throw Error("invalid");
 const ids=new Set();
 for(const m of raw.media){
  if(!m||!knownKeys.has(m.id)||ids.has(m.id)||typeof m.value!=="string"||m.value.length>8e6)throw Error("invalid");
  ids.add(m.id);
  if(m.id.startsWith("photo:")){if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(m.value))throw Error("invalid")}
  else if(!/^data:audio\/(mp4|webm|ogg|wav|mpeg|x-wav)(;codecs=[A-Za-z0-9.,_-]+)?;base64,[A-Za-z0-9+/=\r\n]+$/.test(m.value))throw Error("invalid");
 }
 return {settings:validateSettings(raw.settings),media:raw.media};
}
$("#backup-input").onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>45*1024*1024)return toast("백업 파일은 45MB 이하로 선택해 주세요.");
 try{
  const parsed=validateBackup(JSON.parse(await f.text()));
  if(!confirm("백업의 설정과 같은 이름의 사진·녹음으로 덮어쓸까요? 다른 카드는 유지돼요."))return;
  if(!db)throw Error("db");
  await new Promise((resolve,reject)=>{const tx=db.transaction("media","readwrite");for(const m of parsed.media)tx.objectStore("media").put(m);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error)});
  for(const m of parsed.media)media.set(m.id,m.value);
  settings=parsed.settings;saveSettings();audioBuffers.clear();AudioEngine.initVoices();renderOffline();toast("백업을 불러왔어요. 다른 기기에서도 소리를 확인해 주세요.");
 }catch{toast("백업을 읽지 못했어요. 이 앱에서 저장한 JSON 파일인지 확인해 주세요.")}
};
async function checkCache(){
 if(window.WORD_GARDEN_PREVIEW){coreReady=false;cacheState="failed";return}
 if(!("caches"in window)){cacheState="failed";coreReady=false;return}
 try{
  const cache=await caches.open(SW_VERSION);const needed=["./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
  const results=await Promise.all(needed.map(u=>cache.match(new URL(u,location.href).href)));
  coreReady=results.every(Boolean)&&!!navigator.serviceWorker?.controller;cacheState=coreReady?"ready":"failed";
 }catch{coreReady=false;cacheState="failed"}
 const c=$("#cache-chip");if(c){c.textContent=cacheLabel();c.classList.toggle("pending",!coreReady)}
}
async function installWorker(){
 if(window.WORD_GARDEN_PREVIEW||location.protocol==="file:"||!window.isSecureContext||!("serviceWorker"in navigator)){cacheState="failed";const c=$("#cache-chip");if(c)c.textContent=cacheLabel();return}
 try{
  await navigator.serviceWorker.register("./sw.js",{scope:"./"});
  navigator.serviceWorker.addEventListener("controllerchange",()=>{checkCache()});
  await navigator.serviceWorker.ready;await checkCache();
 }catch{cacheState="failed";await checkCache()}
}
$("#parents-dialog").addEventListener("cancel",e=>{e.preventDefault();closeParents()});
$("#pause-dialog").addEventListener("cancel",e=>{e.preventDefault();if(session){$("#pause-dialog").close();session.paused=false;session.lastTick=performance.now()}});
window.addEventListener("pagehide",()=>{AudioEngine.stop();if(recording){recording.stream.getTracks().forEach(t=>t.stop());stopRecording()}});
window.addEventListener("online",()=>checkCache());
window.addEventListener("offline",()=>checkCache());
if("speechSynthesis"in window){speechSynthesis.addEventListener("voiceschanged",()=>{AudioEngine.initVoices()})}
window.addEventListener("keydown",e=>{
 if($("dialog[open]")||screen!=="play")return;
 if(e.key==="ArrowRight"){e.preventDefault();nextRound(1)}
 if(e.key==="ArrowLeft"){e.preventDefault();nextRound(-1)}
 if(e.code==="Space"){e.preventDefault();sessionAudio()}
 if(e.key==="Escape")pauseSession();
});
(async()=>{
 AudioEngine.initVoices();
 try{await openDB()}catch{storageOK=false}
 renderHome();installWorker();
})();
// Exposed read-only diagnostics for testing and troubleshooting; no private data is sent.
window.wordGardenDiagnostics=()=>({screen,readyCards:readyWords().length,localVoices:AudioEngine.voices.length,coreReady,storageOK,version:DATA.version,mediaCount:media.size});
