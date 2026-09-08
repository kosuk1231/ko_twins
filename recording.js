
/* Reliable local recording: capture -> finish -> commit -> independent read-back.
   Existing database name, store and media keys are deliberately unchanged. */
function recordBusy(){return ["acquiring","recording","stopping","saving"].includes(recordState)}
function blobToDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error("file-read"));r.readAsDataURL(blob)})}
function uriToBlob(uri){
 const [head,b64]=uri.split(",");const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
 return new Blob([bytes],{type:head.slice(5).split(";")[0]});
}
function downloadBlob(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function audioExtension(type){return /mp4|aac/i.test(type)?"m4a":/mpeg|mp3/i.test(type)?"mp3":/wav/i.test(type)?"wav":/ogg/i.test(type)?"ogg":"webm"}
function downloadRecording(key){
 const uri=media.get(key);if(!uri)return;
 const blob=uriToBlob(uri);downloadBlob(blob,`word-garden-${key.replace(/:/g,"-")}.${audioExtension(blob.type)}`);
}
function syncRecordControls(){
 const busy=recordBusy();
 $$("[data-record]").forEach(b=>{
  const active=recording?.key===b.dataset.record;
  b.disabled=busy&&!(recordState==="recording"&&active)||!!pendingRecording;
  b.classList.toggle("recording",active&&recordState==="recording");
  if(active&&recordState==="recording")b.textContent="■ 멈추고 저장";
 });
 $$("[data-listen],[data-download-audio],[data-delete-audio]").forEach(b=>{
  const key=b.dataset.listen||b.dataset.downloadAudio||b.dataset.deleteAudio;b.disabled=busy||!media.has(key);
 });
 $$("[data-tab],#back-library,#studio-prev,#studio-next,#studio-category,#studio-kind,#studio-profile,#close-parents").forEach(b=>{b.disabled=busy||!!pendingRecording});
}
function renderRecordingState(){
 const live=$("#record-live");if(!live)return;
 const labels={acquiring:"마이크 권한을 확인하고 있어요…",stopping:"녹음을 마무리하고 있어요…",saving:"저장하고 다시 읽어 확인 중…",error:recordError};
 if(recordState==="recording"&&recording){
  const secs=Math.min(12,(performance.now()-recording.startedAt)/1000);
  let level=0;
  if(recording.analyser){
   const a=new Uint8Array(recording.analyser.fftSize);recording.analyser.getByteTimeDomainData(a);
   let sum=0;for(const n of a)sum+=((n-128)/128)**2;
   level=Math.sqrt(sum/a.length);recording.peak=Math.max(recording.peak,level);
  }
  live.innerHTML=`<div class="record-live"><span class="recording-dot"></span><strong>녹음 중 ${secs.toFixed(1)} / 12초</strong><p>“${esc(recording.text)}”</p>
  <meter min="0" max="0.2" value="${level}" aria-label="마이크 입력 크기"></meter><small>다 말한 뒤 ‘멈추고 저장’을 누르세요.</small></div>`;
 }else live.innerHTML=labels[recordState]?`<p class="record-live ${recordState==="error"?"error-state":""}" role="status">${esc(labels[recordState])}</p>`:"";
}
function renderRecordReview(){
 const box=$("#record-review");if(!box)return;
 if(pendingRecording){
  box.innerHTML=`<div class="notice error-state"><strong>아직 저장 완료가 아닙니다.</strong><p>${esc(recordError||"저장에 실패했어요. 녹음은 이 화면에 임시 보관 중입니다.")}</p>
  <div class="btn-row"><button class="secondary" id="retry-record-save">다시 저장</button><button class="secondary" id="rescue-record-file">녹음 파일 보관</button><button class="text-btn" id="discard-record">임시 녹음 버리기</button></div></div>`;
  $("#retry-record-save").onclick=()=>savePendingRecording();
  $("#rescue-record-file").onclick=()=>{const p=pendingRecording;downloadBlob(p.blob,`word-garden-unsaved-${p.key.replace(/:/g,"-")}.${audioExtension(p.blob.type)}`)};
  $("#discard-record").onclick=()=>{if(recordingSaveInFlight)return;if(confirm("저장하지 못한 이번 녹음만 버릴까요? 이전에 저장된 녹음은 그대로입니다.")){pendingRecording=null;recordState="idle";recordError="";refreshParentContent()}};
  return;
 }
 if(lastRecordingKey&&media.has(lastRecordingKey)){
  const m=mediaMeta.get(lastRecordingKey);
  box.innerHTML=`<div class="record-success"><strong>${esc(recordingLabel(lastRecordingKey))}</strong>
  <p>재생 버튼을 직접 눌러 목소리를 확인하세요. 자동 재생 여부와 저장 완료는 별개입니다.</p>
  <audio controls preload="metadata" playsinline src="${media.get(lastRecordingKey)}" aria-label="방금 저장한 부모 목소리"></audio>
  ${m?.previous?'<button class="text-btn" id="restore-previous">이 항목의 이전 녹음으로 되돌리기</button>':""}
  <button class="text-btn" id="backup-after-record">모든 목소리·사진 백업</button></div>`;
  $("#backup-after-record").onclick=exportBackup;
  if($("#restore-previous"))$("#restore-previous").onclick=async()=>{
   if(!confirm("이 항목의 이전 녹음을 다시 사용할까요?"))return;
   try{await putMedia(lastRecordingKey,m.previous,{source:"parent",duration:m.previousDuration||0});refreshParentContent();toast("이전 녹음으로 되돌렸어요.")}catch{toast("복원하지 못했어요. 현재 녹음은 유지합니다.")}
  };
 }else box.innerHTML="";
}
async function startRecording(key,text){
 if(recordBusy()||pendingRecording)return;
 if(!storageOK||!db)return toast("저장소가 준비되지 않았어요. 저장·백업에서 저장소 다시 연결을 눌러주세요.");
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast("녹음은 Safari의 HTTPS 주소나 설치한 홈 화면 앱에서 사용해 주세요.");
 recordState="acquiring";recordPending=true;recordError="";lastRecordingKey=null;
 AudioEngine.unlock();AudioEngine.stop();syncRecordControls();renderRecordingState();
 let stream;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  if(!$("#parents-dialog").open||document.hidden){stream.getTracks().forEach(t=>t.stop());recordState="idle";return}
  const supported=t=>typeof MediaRecorder.isTypeSupported==="function"&&MediaRecorder.isTypeSupported(t);
  const type=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"].find(supported);
  const recorder=new MediaRecorder(stream,type?{mimeType:type,audioBitsPerSecond:96000}:undefined);
  const rec={key,text,recorder,stream,startedAt:performance.now(),chunks:[],peak:0,failed:false};
  try{
   if(AudioEngine.ctx){rec.micSource=AudioEngine.ctx.createMediaStreamSource(stream);rec.analyser=AudioEngine.ctx.createAnalyser();rec.analyser.fftSize=256;rec.micSource.connect(rec.analyser)}
  }catch{}
  recording=rec;recordState="recording";
  recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)rec.chunks.push(e.data)};
  recorder.onerror=()=>{rec.failed=true;recordError="녹음 중 오류가 발생했어요.";try{if(recorder.state!=="inactive")recorder.stop()}catch{}};
  recorder.onstop=async()=>{
   clearInterval(recordTimer);rec.stream.getTracks().forEach(t=>t.stop());try{rec.micSource?.disconnect()}catch{}
   const duration=(performance.now()-rec.startedAt)/1000;
   recordState="saving";syncRecordControls();renderRecordingState();
   const blob=new Blob(rec.chunks,{type:recorder.mimeType||rec.chunks[0]?.type||"audio/mp4"});
   recording=null;
   if(rec.failed||blob.size<150||duration<.35){
    recordState="error";recordError=rec.failed?"녹음 중 오류가 발생했어요. 기존 녹음은 유지합니다.":"녹음이 너무 짧거나 비어 있어요. 1초 이상 다시 녹음해 주세요.";
    refreshParentContent();renderRecordingState();return;
   }
   pendingRecording={key:rec.key,text:rec.text,blob,duration,lowLevel:!!rec.analyser&&rec.peak<.002};
   await savePendingRecording();
  };
  recorder.start();renderRecordingState();syncRecordControls();
  recordTimer=setInterval(()=>{if(recordState!=="recording")return;renderRecordingState();if(performance.now()-rec.startedAt>=12000)stopRecording()},100);
 }catch(e){
  stream?.getTracks().forEach(t=>t.stop());recording=null;recordState="error";
  recordError=e.name==="NotAllowedError"?"마이크 사용이 허용되지 않았어요. Safari의 웹사이트 마이크 설정을 확인하세요.":e.name==="NotFoundError"?"마이크를 찾지 못했어요.":"마이크를 시작하지 못했어요. 다른 통화·녹음 앱을 종료하고 다시 시도해 주세요.";
  renderRecordingState();
 }finally{recordPending=false;syncRecordControls()}
}
function stopRecording(){
 if(!recording||recordState!=="recording")return;
 recordState="stopping";clearInterval(recordTimer);syncRecordControls();renderRecordingState();
 try{recording.recorder.stop()}catch(e){
  recording.stream.getTracks().forEach(t=>t.stop());recording=null;recordState="error";recordError="녹음을 마무리하지 못했어요. 기존 녹음은 유지됩니다.";refreshParentContent();
 }
}
let recordingSaveInFlight=false;
async function savePendingRecording(){
 if(recordingSaveInFlight)return;
 const pending=pendingRecording;if(!pending||recordState==="recording")return;
 recordingSaveInFlight=true;
 recordState="saving";syncRecordControls();renderRecordingState();
 try{
  if(!db)await openDB();
  const value=await blobToDataURL(pending.blob);
  await putMedia(pending.key,value,{source:"parent",duration:pending.duration,mime:pending.blob.type,bytes:pending.blob.size});
  lastRecordingKey=pending.key;pendingRecording=null;recordState="idle";recordError="";
  try{navigator.storage?.persist?.().catch(()=>{})}catch{}
  refreshParentContent();
  toast(pending.lowLevel?"저장은 확인했지만 소리가 작을 수 있어요. 재생해서 확인해 주세요.":"저장소에서 다시 읽어 확인했어요. ‘저장한 소리’를 눌러 들어보세요.");
 }catch(e){
  recordState="error";
  recordError=e?.name==="QuotaExceededError"?"저장 공간이 부족해요. 먼저 녹음 파일을 보관해 주세요.":"저장을 확인하지 못했어요. 다시 저장하거나 녹음 파일을 보관해 주세요.";
  refreshParentContent();renderRecordingState();renderRecordReview();syncRecordControls();
 }finally{recordingSaveInFlight=false}
}
function studioList(){return WORDS.filter(w=>w.category===studioCat)}
function studioEntry(w){
 if(studioKind==="phrase")return {key:"phrase:"+w.id,text:w.phrase};
 if(studioKind==="ask")return {key:"ask:"+w.id+":"+studioProfile,text:PROFILES[studioProfile].call+", "+w.label+" 어디 있을까?"};
 return {key:"word:"+w.id,text:w.label};
}
function renderStudio(){
 const list=studioList();studioIndex=Math.min(studioIndex,list.length-1);
 const w=list[studioIndex],entry=studioEntry(w);
 const saved=list.filter(w=>media.has(studioEntry(w).key)).length;
 $("#parent-content").innerHTML=`<section class="setting-block studio"><h3>부모 목소리를 차곡차곡</h3><p>녹음 시작 → 멈추고 저장 → 저장·재확인 완료 → 직접 듣기</p>
 <div class="studio-fields"><label>주제<select id="studio-category">${CATS.map(c=>`<option value="${c.id}" ${studioCat===c.id?"selected":""}>${c.label}</option>`).join("")}</select></label>
 <label>녹음할 항목<select id="studio-kind"><option value="word" ${studioKind==="word"?"selected":""}>낱말</option><option value="phrase" ${studioKind==="phrase"?"selected":""}>두 낱말</option><option value="ask" ${studioKind==="ask"?"selected":""}>찾기 질문</option></select></label>
 ${studioKind==="ask"?`<label>아이<select id="studio-profile">${Object.entries(PROFILES).map(([id,p])=>`<option value="${id}" ${studioProfile===id?"selected":""}>${p.short}</option>`).join("")}</select></label>`:""}</div>
 <div class="studio-progress">${saved} / ${list.length}개 저장됨 · ${studioIndex+1}번째 카드</div>
 <img class="studio-picture" src="${artFor(w)}" alt="${w.label}">
 ${recordRow(entry.key,entry.text)}<div class="studio-nav"><button class="secondary" id="studio-prev" ${studioIndex===0?"disabled":""}>이전 낱말</button><button class="primary" id="studio-next" ${studioIndex===list.length-1?"disabled":""}>다음 낱말 ${icon("arrow",16)}</button></div>
 <div id="record-live"></div><div id="record-review"></div></section>
 <section class="setting-block"><h3>아이 이름 · 놀이 시작 인사</h3><p>아이를 선택하거나 놀이를 시작할 때 적용됩니다.</p>
 ${recordRow("name:seol","은설아, 같이 놀자.")}${recordRow("name:chae","은채야, 같이 놀자.")}${recordRow("name:both","은설아, 은채야, 같이 놀자.")}</section>`;
 $("#studio-category").onchange=e=>{studioCat=e.target.value;studioIndex=0;lastRecordingKey=null;renderStudio()};
 $("#studio-kind").onchange=e=>{studioKind=e.target.value;lastRecordingKey=null;renderStudio()};
 if($("#studio-profile"))$("#studio-profile").onchange=e=>{studioProfile=e.target.value;renderStudio()};
 $("#studio-prev").onclick=()=>{if(!recordBusy()&&!pendingRecording&&studioIndex>0){studioIndex--;lastRecordingKey=null;renderStudio()}};
 $("#studio-next").onclick=()=>{if(!recordBusy()&&!pendingRecording&&studioIndex<list.length-1){studioIndex++;lastRecordingKey=null;renderStudio()}};
 bindRecordRows();renderRecordingState();renderRecordReview();
 // Disabled bounds must survive the generic record-control refresh.
 if(!recordBusy()&&!pendingRecording){$("#studio-prev").disabled=studioIndex===0;$("#studio-next").disabled=studioIndex===list.length-1}
}
