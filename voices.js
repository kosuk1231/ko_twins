
const VOICE_STYLES={
 gentle:{label:"다정하게",rate:.88,pitch:1.02},
 bright:{label:"밝게",rate:.97,pitch:1.15},
 calm:{label:"차분하게",rate:.82,pitch:.9},
 clear:{label:"또박또박",rate:.76,pitch:1},
 story:{label:"이야기하듯",rate:.91,pitch:1.06}
};
let aiCategory="animals";
function speechEntries(category=null,kind="all"){
 const out=[
  ["name:seol","은설아, 같이 놀자."],["name:chae","은채야, 같이 놀자."],["name:both","은설아, 은채야, 같이 놀자."],
  ["system:test","안녕. 사과. 바나나."],["system:pair","같은 그림을 찾아볼까?"],["system:again","같이 한 번 더 살펴볼까?"]
 ];
 for(const w of WORDS.filter(w=>!category||w.category===category)){
  out.push(["word:"+w.id,w.label]);
  if(kind!=="words"){
   out.push(["phrase:"+w.id,w.phrase]);
   for(const [id,p] of Object.entries(PROFILES))out.push(["ask:"+w.id+":"+id,`${p.call}, ${w.label} 어디 있을까?`]);
  }
 }
 return out;
}
function renderVoices(){
 const entries=speechEntries(aiCategory),v=settings.aiVoice;
 const prepared=entries.filter(([key])=>media.has("ai:"+v+":"+key)).length;
 $("#parent-content").innerHTML=`<section class="setting-block"><h3>녹음이 없을 때 사용할 목소리</h3>
 <p class="soft-note"><b>부모 녹음이 항상 먼저입니다.</b> 아래 선택은 녹음하지 않은 항목에만 적용됩니다. AI 목소리는 실제 사람의 녹음이 아닌 합성음성입니다.</p>
 ${selectField("기본 소리","voiceSource",[["device","이 기기의 한국어 음성"],["ai","미리 저장한 AI 음성팩"]])}</section>
 <section class="setting-block"><h3>기기 음성 · 별도 API 비용 없음</h3>
 <p>Safari가 제공하는 한국어 로컬 음성만 표시합니다. 종류·음질은 기기에 따라 다르며, 기기에 설치한 모든 음성이 보이는 것은 아닙니다.</p>
 <label class="field"><span>한국어 목소리 ${AudioEngine.voices.length}종</span><select id="device-voice" ${AudioEngine.voices.length?"":"disabled"}>${AudioEngine.voices.length?AudioEngine.voices.map(v=>`<option value="${esc(v.voiceURI)}" ${AudioEngine.voice?.voiceURI===v.voiceURI?"selected":""}>${esc(v.name)}</option>`).join(""):"<option>감지된 로컬 음성 없음</option>"}</select></label>
 <div class="voice-styles">${Object.entries(VOICE_STYLES).map(([id,s])=>`<button class="voice-style ${settings.voiceStyle===id?"selected":""}" data-style="${id}">${s.label}</button>`).join("")}</div>
 <p class="soft-note">위 5가지는 서로 다른 화자가 아니라 같은 목소리의 속도·높낮이 설정입니다. AI 음성팩에는 이 설정이 적용되지 않습니다.</p>
 <div class="btn-row"><button class="secondary" id="preview-device">기기 음성 들어보기</button><button class="secondary" id="refresh-voices">목소리 목록 새로고침</button></div></section>
 <section class="setting-block"><h3>AI 음성팩 · 서로 다른 목소리 6종</h3>
 <div class="voice-grid">${DATA.aiVoices.map(voice=>`<button data-ai-voice="${voice.id}" class="voice-option ${voice.id===v?"selected":""}" aria-pressed="${voice.id===v}"><strong>${voice.label}</strong><small>${[...media.keys()].filter(k=>k.startsWith("ai:"+voice.id+":")).length||"미준비 · 0"}개 저장</small></button>`).join("")}</div>
 <p>처음에는 음성 파일이 들어 있지 않습니다. 아래에서 준비한 파일만 오프라인으로 재생합니다. 준비하지 않은 항목은 기기 음성으로 대신 읽습니다.</p>
 <label class="field"><span>준비할 주제</span><select id="ai-category">${CATS.map(c=>`<option value="${c.id}" ${aiCategory===c.id?"selected":""}>${c.label}</option>`).join("")}</select></label>
 <div class="pack-status" id="ai-pack-status">${DATA.aiVoices.find(x=>x.id===v).label} · 이 주제 ${prepared}/${entries.length}개 준비됨</div>
 <div class="btn-row"><button class="secondary" id="preview-ai" ${media.has("ai:"+v+":system:test")?"":"disabled"}>저장된 샘플 듣기</button></div>
 <details class="ai-setup" ${aiToken||aiJob?"open":""}><summary>AI 음성 만들기 설정 · 최초 1회</summary>
 <p>Vercel 환경변수에 <code>OPENAI_API_KEY</code>와 <code>WORD_GARDEN_PARENT_TOKEN</code>을 설정하고 재배포해야 합니다. API 키는 이 화면에 입력하지 마세요.</p>
 <label class="field stack"><span>부모 전용 생성 암호 (위 TOKEN 값)</span><input id="ai-token" type="password" autocomplete="off" value="${esc(aiToken)}" placeholder="32자 이상의 임의 문자" spellcheck="false"></label>
 <p class="soft-note">이 암호는 앱을 닫으면 잊습니다. 생성할 낱말·문장과 아이 이름이 Vercel 서버를 거쳐 OpenAI에 전달됩니다. 부모 녹음·사진은 전송하지 않습니다. <b>생성 시 API 사용료가 발생하며 자동 생성하지 않습니다.</b></p>
 <div class="btn-row"><button class="secondary" id="make-ai-sample">샘플 1개 만들기</button><button class="primary" id="make-ai-pack">이 주제의 부족한 음성 준비</button></div></details>
 <div id="ai-progress" class="ai-progress" role="status">${esc(aiMessage)}</div>
 <button class="secondary" id="stop-ai" ${aiJob?"":"hidden"}>현재 항목 저장 후 멈추기</button>
 <p class="soft-note">준비를 마친 음성은 이 기기에 저장됩니다. 아이가 놀이하는 동안에는 음성 생성 API를 호출하지 않습니다. 기기 간 이동은 ‘저장·백업’의 백업 파일을 사용하세요.</p></section>`;
 bindSettings();
 $("#device-voice").onchange=e=>{settings.voiceURI=e.target.value;saveSettings();AudioEngine.initVoices()};
 $$("[data-style]").forEach(b=>b.onclick=()=>{if(aiJob)return;settings.voiceStyle=b.dataset.style;Object.assign(settings,{rate:VOICE_STYLES[b.dataset.style].rate,pitch:VOICE_STYLES[b.dataset.style].pitch});saveSettings();renderVoices()});
 $("#preview-device").onclick=()=>AudioEngine.say("안녕. 사과. 바나나.","system:test",{deviceOnly:true});
 $("#refresh-voices").onclick=()=>{AudioEngine.initVoices();renderVoices()};
 $$("[data-ai-voice]").forEach(b=>b.onclick=()=>{if(aiJob)return;settings.aiVoice=b.dataset.aiVoice;settings.voiceSource="ai";saveSettings();renderVoices()});
 $("#ai-category").onchange=e=>{aiCategory=e.target.value;renderVoices()};
 $("#preview-ai").onclick=()=>AudioEngine.playSavedOnly("ai:"+settings.aiVoice+":system:test");
 $("#ai-token").oninput=e=>{aiToken=e.target.value};
 $("#make-ai-sample").onclick=()=>prepareAIPack([["system:test","안녕. 사과. 바나나."]]);
 $("#make-ai-pack").onclick=()=>prepareAIPack(speechEntries(aiCategory));
 $("#stop-ai").onclick=()=>{aiCancel=true;$("#stop-ai").disabled=true;$("#ai-progress").textContent="현재 음성이 저장된 뒤 멈춥니다. 이미 생성 요청한 항목은 비용이 발생할 수 있습니다."};
 if(aiJob)disableAIControls();
}
function disableAIControls(){
 $$("[data-setting],#device-voice,[data-style],#refresh-voices,[data-ai-voice],#ai-category,#ai-token,#make-ai-pack,#make-ai-sample,[data-tab],#close-parents").forEach(b=>b.disabled=!!aiJob);
}
async function prepareAIPack(entries){
 if(aiJob||recordBusy()||pendingRecording)return;
 if(!storageOK||!db)return toast("먼저 기기 저장소를 연결해 주세요.");
 if(!navigator.onLine)return toast("AI 음성을 처음 준비할 때에는 인터넷이 필요합니다.");
 if(aiToken.length<32)return toast("Vercel에 설정한 32자 이상의 부모 생성 암호를 입력해 주세요.");
 const voice=settings.aiVoice;
 const missing=entries.filter(([key])=>!media.has("ai:"+voice+":"+key));
 if(!missing.length){toast("선택한 음성은 모두 준비되어 있어요.");return}
 const msg=`${voice} 목소리 ${missing.length}개를 생성하고 이 기기에 저장할까요?\n\n낱말·문장(이름 인사와 질문을 포함하는 경우 아이 이름)이 OpenAI로 전달되고 API 사용료가 발생합니다.\n부모 녹음은 보내거나 덮어쓰지 않습니다.`;
 if(!confirm(msg))return;
 aiJob={voice,total:missing.length,done:0};aiCancel=false;aiMessage="음성 준비를 시작합니다…";renderVoices();
 try{
  for(const [key,text] of missing){
   if(aiCancel)break;
   $("#ai-progress").textContent=`${aiJob.done}/${aiJob.total}개 저장됨 · “${text}” 준비 중`;
   const response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json","X-Parent-Token":aiToken},body:JSON.stringify({voice,key}),cache:"no-store",signal:AbortSignal.timeout?AbortSignal.timeout(45000):undefined});
   if(!response.ok){
    const details=await response.json().catch(()=>({}));
    const errors={401:"부모 생성 암호가 맞지 않습니다.",403:"이 주소에서 음성을 만들 수 없습니다.",404:"AI 생성 서버를 찾지 못했어요. api 폴더도 배포했는지 확인하세요.",429:"요청 또는 API 한도를 확인한 뒤 다시 시도하세요.",503:"Vercel의 두 환경변수를 설정하고 재배포해 주세요."};
    throw new Error(errors[response.status]||details.error||"음성을 생성하지 못했습니다.");
   }
   const blob=await response.blob();
   if(!blob.type.startsWith("audio/")||blob.size<100||blob.size>3000000)throw Error("올바른 음성 파일을 받지 못했어요.");
   const uri=await blobToDataURL(blob);
   await putMedia("ai:"+voice+":"+key,uri,{source:"ai",bytes:blob.size,mime:blob.type});
   aiJob.done++;
  }
  aiMessage=aiCancel?`${aiJob.done}개 저장 후 멈췄습니다. 다시 누르면 부족한 음성만 준비합니다.`:`${aiJob.done}개 음성을 저장하고 다시 읽어 확인했습니다.`;
 }catch(e){aiMessage=`${aiJob.done}개 저장됨 · ${e.name==="TimeoutError"?"서버 응답 시간이 초과됐어요.":e.message} 저장된 파일은 유지되며 다시 시도할 수 있습니다.`}
 finally{aiJob=null;renderVoices()}
}
