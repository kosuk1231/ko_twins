
/* Word Garden 1.2.0. Local-first; optional parent-triggered AI speech preparation.
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
const DEFAULTS={profile:"seol",mode:"cards",category:"animals",count:6,minutes:3,choices:2,rate:.88,picture:"diorama",autoRead:true,cues:true,showLabels:false,voiceURI:"",voiceSource:"device",aiVoice:"coral",voiceStyle:"gentle",pitch:1.02};
let settings=loadSettings();
let media=new Map(),mediaMeta=new Map(),db=null,storageOK=true;
let recordState="idle",pendingRecording=null,lastRecordingKey=null,recordError="",storageWrite=Promise.resolve();
let studioCat="animals",studioKind="word",studioIndex=0,studioProfile="seol";
let aiToken="",aiJob=null,aiCancel=false,aiMessage="";
let session=null,screen="home",parentTab="settings",editId=null,libCat="animals",search="";
let coreReady=false,cacheState="checking",holdTimer=null,holdPassed=false;
let lastToast="",toastTimer=0,recording=null,recordTimer=null,pendingFileAction=null,recordPending=false;
const audioBuffers=new Map();
const SW_VERSION="word-garden-v1.2.0";
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
 s={...s};if(s.category==="cars")s.category="vehicles";
 for(const [k,allowed] of Object.entries({profile:Object.keys(PROFILES),mode:["cards","find","phrase","pair"],category:CATS.map(c=>c.id),count:[4,6,8],minutes:[1,3,5],choices:[2,3],picture:["diorama","custom"],voiceSource:["device","ai"],aiVoice:DATA.aiVoices.map(v=>v.id),voiceStyle:["gentle","bright","calm","clear","story"]})){if(allowed.includes(s[k]))v[k]=s[k]}
 for(const k of ["autoRead","cues","showLabels"])if(typeof s[k]==="boolean")v[k]=s[k];
 if(typeof s.rate==="number"&&s.rate>=.65&&s.rate<=1.1)v.rate=s.rate;
 if(typeof s.pitch==="number"&&s.pitch>=.75&&s.pitch<=1.25)v.pitch=s.pitch;
 if(typeof s.voiceURI==="string"&&s.voiceURI.length<300)v.voiceURI=s.voiceURI;
 return v;
}
function saveSettings(){try{localStorage.setItem("word-garden-settings",JSON.stringify(settings))}catch{toast("이 브라우저에서는 설정이 영구 저장되지 않아요.")}}
function toast(message){lastToast=message;const t=$("#toast");t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3800)}
function shuffled(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function profile(){return PROFILES[settings.profile]}

function readyWords(category){return WORDS.filter(w=>!category||w.category===category)}
function photoFor(w){return media.get("photo:"+w.id)||null}
function artFor(w){return w.art}
function shouldPhoto(w,force=null){return !!photoFor(w)&&(force!==null?force:settings.picture==="custom")}
function picture(w,force=null){
 const custom=shouldPhoto(w,force);
 return `<span class="picture"><img class="${custom?"custom-picture":"diorama-picture"}" src="${custom?photoFor(w):artFor(w)}" alt="${esc(w.label)}" draggable="false" decoding="sync"></span>`;
}

function parentButton(){return `<button class="icon-btn parent-btn" id="parents" aria-label="부모 설정. 1.2초 길게 누르세요." title="1.2초 길게 누르기">${icon("gear",19)}<span class="parent-label">부모</span></button>`}
function cacheLabel(){if(window.WORD_GARDEN_PREVIEW)return "미리보기";if(coreReady)return "화면 저장됨";if(location.protocol==="file:")return "설치 전";if(cacheState==="failed")return "저장 확인 필요";return "화면 저장 중"}
function renderHome(){
 screen="home";
 el.innerHTML=`<div class="app"><header class="topbar">
 <div class="brand"><span class="brand-mark">${icon("leaf",27)}</span><div><div class="brand-name">말랑말랑 낱말정원</div><div class="brand-sub">은설 · 은채의 작은 말놀이 · v${DATA.version}</div></div></div>
 <div class="header-actions"><span class="status-chip ${coreReady?"":"pending"}" id="cache-chip">${cacheLabel()}</span>${parentButton()}</div></header>
 <section class="intro-row"><div><div class="eyebrow">작은 낱말 하나, 다정한 대화 하나</div><h1>${profile().call}, 오늘은 뭐 하고 놀까?</h1><p>함께 보고, 듣고, 말해요. 정답보다 즐거운 대화가 먼저예요.</p></div>
 <div class="profile-switch" role="group" aria-label="함께 놀 아이">${Object.entries(PROFILES).map(([id,p])=>`<button data-profile="${id}" class="${settings.profile===id?"selected":""}" aria-pressed="${settings.profile===id}"><i class="profile-dot ${id}"></i>${p.short}</button>`).join("")}</div></section>
 <section class="hero"><div class="hero-copy"><span class="pill">${settings.minutes}분 정도 · 카드 ${Math.min(settings.count,readyWords(settings.category).length)||settings.count}장</span>
 <h2>오늘도 말이<br>한 뼘 자라요</h2><p id="start-summary">${CATS.find(c=>c.id===settings.category).label} 친구들과 ${modeName(settings.mode)}</p>
 <button class="primary" id="start">함께 놀이 시작 ${icon("arrow",21)}</button></div>
 <div class="hero-art" aria-hidden="true"><span class="art-flower">✳</span><div class="preview-card first"><img src="${artFor(WORD_MAP.get("rabbit"))}" alt=""><b>토끼</b></div><div class="preview-card second"><img src="${artFor(WORD_MAP.get("apple"))}" alt=""><b>사과</b></div><span class="art-dots">· · ·</span></div></section>
 <section><div class="section-head"><h2>어떻게 놀까요?</h2><small>처음에는 ‘낱말 보기’부터</small></div>
 <div class="modes" role="group" aria-label="놀이 선택">
 ${[["cards","cards","낱말 보기","큰 그림을 톡!"],["find","find","듣고 찾기","두 장 중 골라요"],["phrase","phrase","두 낱말 말하기","밥 + 먹어요"],["pair","pair","같은 그림 찾기","똑같은 친구 찾기"]].map(([id,ic,label,hint])=>`<button class="mode ${settings.mode===id?"selected":""}" data-mode="${id}" aria-pressed="${settings.mode===id}"><span class="mode-icon">${icon(ic,25)}</span><span><strong>${label}</strong><small>${hint}</small></span></button>`).join("")}</div></section>
 <section><div class="section-head"><h2>좋아하는 낱말을 골라요</h2><small>${readyWords().length}장의 놀이 카드</small></div>
 <div class="categories" role="group" aria-label="주제 선택">${CATS.map(c=>`<button class="category ${settings.category===c.id?"selected":""}" data-category="${c.id}" aria-pressed="${settings.category===c.id}" style="--tile:${c.color}"><img class="category-art" src="${artFor(WORD_MAP.get(c.cover))}" alt=""><strong>${c.label}</strong><small>${readyWords(c.id).length}장 · ${c.hint}</small></button>`).join("")}</div></section>
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
/* AUDIO_MODULE */

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
 `<button class="word-card" id="big-card" aria-label="${esc(session.mode==="phrase"?w.phrase:w.label)} 다시 듣기"><span class="picture-tag">${shouldPhoto(w,session.pictureOverride)?"내 사진":"디오라마"}</span><span class="sound-circle">${icon("speaker",20)}</span>${picture(w,session.pictureOverride)}${session.mode==="phrase"?`<span class="phrase-label">${w.phrase.split(" ").map(p=>`<span>${p}</span>`).join("")}</span>`:`<span class="word-label">${w.label}</span>`}</button><p class="card-hint">아이의 말을 기다려 주세요. 따라 말하지 않아도 괜찮아요.</p>`}
 ${settings.cues?`<aside class="parent-cue"><span class="cue-icon" aria-hidden="true">💬</span><div><small>부모님, 이렇게 말해 보세요</small><p>${find?"먼저 충분히 살펴보게 해주세요. 어려우면 손으로 함께 짚어주세요.":w.prompt}</p></div></aside>`:""}
 <div class="play-controls"><button class="icon-btn" id="previous" aria-label="이전 카드" ${session.index===0?"disabled":""}>${icon("back",23)}</button><button class="primary" id="next">${session.index===session.deck.length-1?"놀이 마무리":"다음 카드"} ${icon("arrow",22)}</button><button class="icon-btn" id="repeat" aria-label="다시 듣기">${icon("speaker",23)}</button></div>
 <div class="audio-source" id="audio-source" role="status"></div><div class="play-subcontrols">${photoFor(w)&&!find?`<button class="text-btn" id="picture-swap">${icon("swap",15)} ${shouldPhoto(w,session.pictureOverride)?"그림으로 보기":"사진으로 보기"}</button>`:""}<button class="text-btn" id="pause">${icon("pause",14)} 잠깐 쉬기</button></div>
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
 screen="end";el.innerHTML=`<div class="app"><header class="topbar"><div class="brand"><span class="brand-mark">${icon("leaf",26)}</span><b class="brand-name">말랑말랑 낱말정원</b></div>${parentButton()}</header><section class="ending"><div class="ending-symbol">🌱</div><h1>오늘의 말놀이,<br>여기까지 잘 놀았어요</h1><p>${byTimer?"약속한 시간이 지났어요. ":""}이제 화면을 내려놓고 함께 움직여볼까요?</p><div class="encountered">${encountered.map(w=>`<span><img src="${artFor(w)}" alt=""> ${w.label}</span>`).join("")}</div><div class="offline-idea"><small>화면 밖으로 이어지는 놀이</small><p>${last.real}</p></div><button class="primary" id="finish-home">처음 화면으로 ${icon("home",21)}</button><p><small>본 카드는 부모 기록에만 남아요. 점수나 순위는 없어요.</small></p></section></div>`;
 bindParentButton();$("#finish-home").onclick=()=>{session=null;renderHome()};
}
setInterval(()=>{
 if(!session||session.finished||session.paused||document.hidden||screen!=="play")return;
 const now=performance.now();session.elapsed+=Math.min(now-session.lastTick,1500);session.lastTick=now;
 if(session.elapsed>=settings.minutes*60000)finishSession(true);
},500);
document.addEventListener("visibilitychange",()=>{
 AudioEngine.stop();
 if(document.hidden&&recording)stopRecording();
 if(document.hidden&&session&&!session.finished&&screen==="play"&&!$("dialog[open]"))pauseSession();
 if(!document.hidden&&session)session.lastTick=performance.now();
});
function showParents(tab="settings"){
 if(session&&!session.finished){session.paused=true;AudioEngine.stop()}
 AudioEngine.initVoices();parentTab=tab;editId=null;
 renderParents();const d=$("#parents-dialog");if(!d.open)d.showModal();
}
function closeParents(){
 if(recordBusy())return toast("녹음을 멈추고 저장이 끝난 뒤 닫아주세요.");
 if(pendingRecording)return toast("아직 저장되지 않은 녹음이 있어요. 다시 저장하거나 파일로 보관해 주세요.");
 if(aiJob)return toast("음성 준비를 멈추거나 완료한 뒤 닫아주세요.");
 aiToken="";AudioEngine.stop();$("#parents-dialog").close();
 if(session&&!session.finished){session.paused=false;session.lastTick=performance.now()}
 if(screen==="home")renderHome();else if(screen==="play")renderPlay();
}
function renderParents(){
 const d=$("#parents-dialog");
 d.innerHTML=`<header class="dialog-head"><div><h2>부모님 공간</h2><p>설정은 단순하게, 놀이는 다정하게</p></div><button class="icon-btn" id="close-parents" aria-label="부모 설정 닫기">${icon("close",20)}</button></header><div class="dialog-body"><nav class="tabs">${[["settings","놀이 설정"],["voices","음성 선택"],["studio","부모 녹음"],["library","카드 관리"],["offline","저장·백업"],["guide","사용 안내"]].map(([id,label])=>`<button class="${parentTab===id?"active":""}" data-tab="${id}">${label}</button>`).join("")}</nav><div id="parent-content"></div></div>`;
 $("#close-parents").onclick=closeParents;
 $$("[data-tab]",d).forEach(b=>b.onclick=()=>{if(recordBusy()||pendingRecording||aiJob){toast("진행 중인 녹음·저장을 먼저 마쳐주세요.");return}parentTab=b.dataset.tab;editId=null;renderParents()});
 if(parentTab==="settings")renderSettings();
 else if(parentTab==="voices")renderVoices();
 else if(parentTab==="studio")renderStudio();
 else if(parentTab==="library")editId?renderEditor():renderLibrary();
 else if(parentTab==="offline")renderOffline();
 else renderGuide();
}
function selectField(label,key,options){return `<label class="field"><span>${label}</span><select data-setting="${key}">${options.map(([v,t])=>`<option value="${v}" ${String(settings[key])===String(v)?"selected":""}>${t}</option>`).join("")}</select></label>`}
function toggleField(label,key){return `<label class="field"><span>${label}</span><input class="toggle" type="checkbox" data-setting="${key}" ${settings[key]?"checked":""}></label>`}

function bindSettings(){
 $$("[data-setting]").forEach(x=>x.onchange=()=>{
  if(recordBusy())return;
  const key=x.dataset.setting;
  settings[key]=x.type==="checkbox"?x.checked:["count","minutes","choices","rate","pitch"].includes(key)?Number(x.value):x.value;
  settings=validateSettings(settings);saveSettings();AudioEngine.initVoices();
 });
}
function renderSettings(){
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>짧고 편안한 한 번의 놀이</h3>
 ${selectField("카드 수","count",[[4,"4장"],[6,"6장 · 추천"],[8,"8장"]])}
 ${selectField("마무리 안내","minutes",[[1,"1분"],[3,"3분 · 추천"],[5,"5분"]])}
 ${selectField("찾기 선택지","choices",[[2,"2장 · 추천"],[3,"3장"]])}
 ${selectField("카드 그림","picture",[["diorama","디오라마 그림으로 통일 · 기본"],["custom","내가 등록한 사진 우선"]])}
 <p>60장의 기본 그림은 모두 같은 미니어처 일러스트입니다. 기존 사진은 삭제하지 않고 보관합니다.</p>
 ${toggleField("다음 카드에서 자동으로 읽기","autoRead")}
 ${toggleField("부모 대화 문구 표시","cues")}
 ${toggleField("찾기 놀이에 낱말 글자 표시","showLabels")}</section>
 <section class="setting-block"><h3>목소리는 어디에서 바꾸나요?</h3><div class="btn-row">
 <button class="secondary" id="goto-voices">${icon("speaker",17)} 합성음성 선택</button>
 <button class="secondary" id="goto-studio">${icon("mic",17)} 부모 목소리 녹음</button></div>
 <p>저장된 부모 녹음이 항상 우선입니다. 녹음하지 않은 항목만 선택한 합성음성으로 읽습니다.</p></section>
 <section class="setting-block"><h3>아이별 놀이 기록</h3><p>발달 평가가 아니라 함께 본 낱말만 기록합니다.</p>${historyHTML()}</section>`;
 bindSettings();
 $("#goto-voices").onclick=()=>{parentTab="voices";renderParents()};
 $("#goto-studio").onclick=()=>{parentTab="studio";renderParents()};
}

function historyHTML(){
 let h={};try{h=JSON.parse(localStorage.getItem("word-garden-history")||"{}")}catch{}
 return Object.entries(PROFILES).map(([id,p])=>`<div class="health-row"><span>${p.name}</span><strong>${h[id]?.words?.length||0}개 낱말을 함께 봤어요</strong></div>`).join("");
}

function recordingLabel(key){
 const m=mediaMeta.get(key);
 if(!media.has(key))return "아직 부모 녹음 없음";
 const when=m?.updatedAt?new Date(m.updatedAt).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):"이전 버전";
 return `${m?.verifiedAt?"저장·재확인 완료":"기존 녹음 보관됨"} · ${when}${m?.duration?" · "+m.duration.toFixed(1)+"초":""}`;
}
function recordRow(key,text){
 const recorded=media.has(key);
 return `<div class="record-row" data-row="${key}"><div class="record-row-title"><strong>${esc(text)}</strong><small data-record-status="${key}" class="${recorded?"saved-state":""}">${esc(recordingLabel(key))}</small></div><div class="btn-row">
 <button class="secondary" data-record="${key}" data-text="${esc(text)}">${icon("mic",15)} ${recorded?"다시 녹음":"녹음 시작"}</button>
 <button class="secondary" data-listen="${key}" data-text="${esc(text)}" ${recorded?"":"disabled"}>${icon("speaker",15)} 저장한 소리</button>
 ${recorded?`<button class="secondary" data-download-audio="${key}">파일 보관</button><button class="text-btn" data-delete-audio="${key}">지우기</button>`:""}
 </div></div>`;
}
function bindRecordRows(){
 $$("[data-record]").forEach(b=>b.onclick=()=>recordState==="recording"?stopRecording():startRecording(b.dataset.record,b.dataset.text));
 $$("[data-listen]").forEach(b=>b.onclick=()=>{if(recordBusy())return;AudioEngine.unlock();AudioEngine.playSavedOnly(b.dataset.listen)});
 $$("[data-download-audio]").forEach(b=>b.onclick=()=>downloadRecording(b.dataset.downloadAudio));
 $$("[data-delete-audio]").forEach(b=>b.onclick=async()=>{
  if(recordBusy()||pendingRecording)return toast("진행 중인 녹음을 먼저 저장해 주세요.");
  if(!confirm("이 항목의 부모 녹음을 지울까요?"))return;
  try{await removeMedia(b.dataset.deleteAudio);refreshParentContent();toast("녹음을 지웠어요.");}
  catch{toast("녹음을 지우지 못했어요. 기존 녹음은 유지합니다.");}
 });
 syncRecordControls();
}


function renderLibrary(){
 const list=WORDS.filter(w=>w.category===libCat&&w.label.includes(search));
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>60장의 작은 디오라마</h3><p>모든 기본 카드는 같은 배경·조명·입체감으로 통일했습니다. 카드에서 사진을 바꾸거나 목소리를 녹음할 수 있습니다.</p><div class="library-top"><select id="lib-category" aria-label="꾸밀 주제">${CATS.map(c=>`<option value="${c.id}" ${libCat===c.id?"selected":""}>${c.label}</option>`).join("")}</select><input id="lib-search" value="${esc(search)}" placeholder="낱말 찾기" aria-label="낱말 검색"></div>
 ${libCat==="characters"?`<p class="soft-note">캐릭터를 단순화해 새로 그린 미니어처풍 그림입니다. 공식 원화나 실제 3D 모델은 아닙니다.</p>`:""}
 <div class="library-list">${list.map(w=>`<button class="lib-item" data-edit="${w.id}"><span class="lib-thumb"><img src="${artFor(w)}" alt=""></span><span><strong>${w.label}</strong><small>디오라마${photoFor(w)?" · 내 사진 보관":""}${media.has("word:"+w.id)?" · 부모 녹음":""}</small></span></button>`).join("")||"<p>해당하는 낱말이 없어요.</p>"}</div></section>`;
 $("#lib-category").onchange=e=>{libCat=e.target.value;search="";renderLibrary()};
 $("#lib-search").oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;renderLibrary();const i=$("#lib-search");i.focus();i.setSelectionRange(pos,pos)};
 $$("[data-edit]").forEach(b=>b.onclick=()=>{editId=b.dataset.edit;renderEditor()});
}


function renderEditor(){
 const w=WORD_MAP.get(editId);if(!w)return renderLibrary();
 $("#parent-content").innerHTML=`<button class="back-editor" id="back-library">${icon("back",16)} 카드 목록</button><section class="setting-block"><h3>${w.label} 카드</h3>
 <div class="editor-picture">${picture(w)}</div>
 <div class="editor-actions"><button class="secondary" id="add-photo">${icon("photo",16)} 내 사진 등록</button>${media.has("photo:"+w.id)?`<button class="secondary" id="delete-photo">내 사진 지우기</button>`:""}</div>
 <p class="soft-note">기본은 디오라마 그림입니다. 등록한 사진은 ‘놀이 설정 → 내가 등록한 사진 우선’에서 표시합니다.</p></section>
 <section class="setting-block"><h3>이 카드의 부모 목소리</h3><p>낱말·두 낱말·찾기 질문은 서로 다른 녹음입니다. 각 항목의 ‘저장한 소리’로 확인하세요.</p>
 ${recordRow("word:"+w.id,w.label)}${recordRow("phrase:"+w.id,w.phrase)}
 <details><summary class="text-btn">아이별 찾기 질문 녹음</summary>${Object.entries(PROFILES).map(([id,p])=>recordRow("ask:"+w.id+":"+id,`${p.call}, ${w.label} 어디 있을까?`)).join("")}</details>
 <div id="record-live"></div><div id="record-review"></div>
 <p>이름 녹음은 ‘부모 녹음 → 아이 이름’에 있습니다.</p></section>`;
 $("#back-library").onclick=()=>{if(recordBusy()||pendingRecording)return toast("녹음을 먼저 저장해 주세요.");editId=null;renderLibrary()};
 $("#add-photo").onclick=()=>{if(recordBusy()||pendingRecording)return;pendingFileAction={type:"photo",id:w.id};const f=$("#image-input");f.value="";f.click()};
 if($("#delete-photo"))$("#delete-photo").onclick=async()=>{if(recordBusy())return;try{await removeMedia("photo:"+w.id);renderEditor();toast("사진을 지웠어요. 기본 그림은 유지합니다.")}catch{toast("사진을 지우지 못했어요.")}};
 bindRecordRows();renderRecordReview();
}

function refreshParentContent(){
 if(parentTab==="settings")renderSettings();
 else if(parentTab==="voices")renderVoices();
 else if(parentTab==="studio")renderStudio();
 else if(parentTab==="library"){if(editId)renderEditor();else renderLibrary()}
 else if(parentTab==="offline")renderOffline();
}
/* Recording implementation is included below. */
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


function renderOffline(){
 const n=[...media.keys()].filter(k=>!k.startsWith("photo:")&&!k.startsWith("ai:")).length;
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>저장·오프라인 상태 <small>v${DATA.version}</small></h3>
 <div class="health-row"><span>앱·60장 그림</span><strong class="${coreReady?"":"warn"}">${coreReady?"이 기기에 준비됨":"온라인에서 저장 확인 필요"}</strong></div>
 <div class="health-row"><span>기기 저장소</span><strong>${storageOK?"연결됨":"연결 확인 필요"}</strong></div>
 <div class="health-row"><span>부모·기존 녹음</span><strong>${n}개</strong></div>
 <div class="health-row"><span>AI 음성팩</span><strong>${[...media.keys()].filter(k=>k.startsWith("ai:")).length}개 저장됨</strong></div>
 <div class="health-row"><span>기기 한국어 음성</span><strong>${AudioEngine.voices.length}종 감지</strong></div>
 <p class="soft-note">그림 저장과 음성 준비는 별개입니다. 선택한 AI 음성팩은 음성 선택 화면에서 준비 상태를 확인하세요.</p>
 <div class="btn-row"><button class="secondary" id="check-offline">그림 저장 다시 확인</button><button class="secondary" id="reconnect-storage">저장소 다시 연결</button><button class="secondary" id="persist-storage">저장 유지 요청</button></div>
 <p id="persistence-status" role="status"></p></section>
 <section class="setting-block"><h3>목소리·사진 백업</h3><p><b>아이폰과 아이패드는 자동 동기화되지 않습니다.</b> 같은 주소라도 기기별 저장소입니다. 한 기기에서 만든 백업 파일을 다른 기기에서 불러오세요. 이전 버전의 ‘사람’ 카드 자료도 삭제하지 않고 백업합니다.</p>
 <div class="btn-row"><button class="primary" id="export-backup">백업 파일 저장</button><button class="secondary" id="import-backup">백업 불러오기</button></div>
 <p>웹사이트 데이터 삭제·앱 제거·저장 공간 정리로 자료가 사라질 수 있습니다. 앱 안의 저장 유지 요청만으로 영구 보존을 보장할 수 없습니다.</p></section>
 <section class="setting-block"><h3>업데이트와 실제 확인</h3><p>같은 운영 주소를 계속 사용하세요. 업데이트를 위해 Safari 데이터를 지우거나 앱을 삭제하지 마세요. 먼저 백업을 받으세요.</p>
 <div class="btn-row"><button class="secondary" id="check-update">새 버전 확인</button><button class="secondary" id="offline-voice">이름 소리 확인</button></div>
 <p>비행기 모드로 전환한 뒤 앱을 닫았다 다시 열어 그림과 소리를 확인하세요. 0ms 지연은 보장하지 않습니다.</p></section>`;
 $("#check-offline").onclick=async()=>{await checkCache();renderOffline();toast(coreReady?"앱과 그림 60장의 캐시를 확인했어요.":"온라인 상태로 다시 열어 저장을 기다려주세요.")};
 $("#reconnect-storage").onclick=async()=>{try{if(db)db.close();db=null;await openDB();renderOffline();toast("저장소를 다시 연결했습니다.")}catch{toast("저장소를 열지 못했어요. 일반 Safari 또는 홈 화면 앱에서 다시 확인해 주세요.")}};
 $("#persist-storage").onclick=async()=>{
  let ok=false;try{ok=await navigator.storage?.persist?.()}catch{}
  $("#persistence-status").textContent=ok?"저장 유지가 허용되었습니다. 직접 데이터 삭제는 막지 못하므로 백업도 보관하세요.":"저장 유지가 허용되지 않았거나 지원되지 않습니다. 백업 파일을 보관하세요.";
 };
 $("#export-backup").onclick=exportBackup;
 $("#import-backup").onclick=()=>{const f=$("#backup-input");f.value="";f.click()};
 $("#check-update").onclick=async()=>{
  try{const reg=await navigator.serviceWorker.getRegistration();await reg?.update();toast("업데이트를 확인했어요. 저장이 끝나면 앱을 완전히 닫았다 다시 열어주세요.")}catch{toast("온라인 상태에서 업데이트를 확인해 주세요.")}
 };
 $("#offline-voice").onclick=()=>AudioEngine.say(`${profile().call}, 같이 놀자.`,"name:"+settings.profile);
}


function renderGuide(){
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>함께 보고, 듣고, 말하기</h3><p>아이를 고르고 주제와 놀이를 선택하세요. 큰 그림을 누르면 낱말을 읽습니다. 정답·속도보다 함께 나누는 말이 먼저입니다.</p><p>아이의 발음을 자동 평가하거나 녹음·전송하지 않습니다. 부모님이 녹음 시작을 누른 동안만 마이크를 사용합니다.</p></section>
 <section class="setting-block"><h3>녹음은 항목별로 적용됩니다</h3><p>‘사과’ 녹음은 낱말 보기에, ‘빨간 사과’ 녹음은 두 낱말에, ‘은설아, 사과 어디 있을까?’ 녹음은 은설의 듣고 찾기에 적용됩니다. 이름 인사는 별도 녹음입니다.</p><p>저장 완료 후 직접 재생하고, 앱을 다시 열어 한 번 더 확인하세요.</p></section>
 <section class="setting-block"><h3>음성 선택</h3><p>부모 녹음 → 준비된 AI 음성팩 → 기기의 한국어 합성음성 순서입니다. AI 준비는 부모님이 명시적으로 실행한 경우에만 인터넷을 사용합니다. 아이의 놀이 중에 API를 호출하지 않습니다.</p></section>
 <section class="setting-block"><h3>기억해 주세요</h3><p>이 앱은 지능 향상·언어 발달 효과를 보장하거나 발달을 평가하지 않습니다. 3분은 앱의 기본 설정입니다. 화면에서 본 물건을 실제 생활에서 함께 찾아보세요.</p><p>캐릭터 그림은 원화를 제공받은 것이 아니라 특징을 단순화한 비공식 일러스트입니다.</p></section>`;
}

function showHelp(){
 const d=$("#help-dialog");d.innerHTML=`<header class="dialog-head"><h2>설치와 첫 사용</h2><button class="icon-btn" id="close-help" aria-label="안내 닫기">${icon("close",20)}</button></header><div class="dialog-body"><section class="setting-block"><h3>아이폰 · 아이패드는 Safari에서</h3><p>배포된 HTTPS 주소를 열고 공유 → 홈 화면에 추가를 눌러주세요. 새 아이콘으로 온라인에서 한 번 열어 ‘화면 저장됨’을 확인한 뒤 비행기 모드로 시험해 보세요.</p><div class="notice">현재 전달된 HTML 파일은 컴퓨터 미리보기용이에요. ZIP 안의 파일을 HTTPS 웹호스팅에 올려야 아이폰 설치 주소가 생겨요.</div></section><section class="setting-block"><h3>녹음과 합성음성은 따로 확인해요</h3><p>부모 녹음, 준비한 AI 음성팩, 기기에서 제공하는 한국어 음성을 사용합니다. AI 음성팩은 ‘음성 선택’에서 필요한 주제를 먼저 준비하세요. 부모 설정을 1.2초 눌러 ‘저장·백업’ 탭에서 확인해 주세요.</p><p>첫 실행이나 오디오 기기에 따라 소리가 시작될 때 짧은 지연이 생길 수 있어요. 실제 아이폰·아이패드에서 마지막 확인이 필요합니다.</p></section></div>`;d.showModal();$("#close-help").onclick=()=>d.close();
}

$("#backup-input").onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{if(await importBackupFile(f)){renderOffline();toast("백업을 저장소에서 다시 읽어 확인했습니다.")}}
 catch(e){toast(e.message==="too-large"?"백업 파일이 180MB를 넘어요.":"백업을 불러오지 못했어요. 앱에서 만든 파일인지, 저장 공간이 충분한지 확인해 주세요.")}
};

async function checkCache(){
 if(window.WORD_GARDEN_PREVIEW){coreReady=false;cacheState="failed";return}
 if(!("caches"in window)){cacheState="failed";coreReady=false;return}
 try{
  const cache=await caches.open(SW_VERSION);const needed=["./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png",...WORDS.map(w=>"./"+w.art)];
  const results=await Promise.all(needed.map(u=>cache.match(new URL(u,location.href).href)));
  coreReady=results.every(Boolean)&&!!navigator.serviceWorker?.controller;cacheState=coreReady?"ready":"failed";
 }catch{coreReady=false;cacheState="failed"}
 const c=$("#cache-chip");if(c){c.textContent=cacheLabel();c.classList.toggle("pending",!coreReady)}
}
async function installWorker(){
 if(window.WORD_GARDEN_PREVIEW||location.protocol==="file:"||!window.isSecureContext||!("serviceWorker"in navigator)){cacheState="failed";const c=$("#cache-chip");if(c)c.textContent=cacheLabel();return}
 try{
  await navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"});
  navigator.serviceWorker.addEventListener("controllerchange",()=>{checkCache()});
  await navigator.serviceWorker.ready;await checkCache();
 }catch{cacheState="failed";await checkCache()}
}
$("#parents-dialog").addEventListener("cancel",e=>{e.preventDefault();closeParents()});
$("#pause-dialog").addEventListener("cancel",e=>{e.preventDefault();if(session){$("#pause-dialog").close();session.paused=false;session.lastTick=performance.now()}});
window.addEventListener("pagehide",()=>{AudioEngine.stop();if(recording)stopRecording()});
window.addEventListener("beforeunload",e=>{if(recordBusy()||pendingRecording){e.preventDefault();e.returnValue=""}});
window.addEventListener("online",()=>checkCache());
window.addEventListener("offline",()=>checkCache());
if("speechSynthesis"in window){speechSynthesis.addEventListener("voiceschanged",()=>{AudioEngine.initVoices();if(parentTab==="voices"&&$("#parents-dialog").open&&!aiJob&&!recordBusy())renderVoices()})}
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
window.wordGardenDiagnostics=()=>({screen,readyCards:readyWords().length,localVoices:AudioEngine.voices.length,coreReady,storageOK,version:DATA.version,mediaCount:media.size,recordState,unsavedRecording:!!pendingRecording,lastAudioSource:AudioEngine.lastSource});
