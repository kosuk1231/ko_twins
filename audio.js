
/* Playback never contacts a speech service. Parent media always has priority. */
const AudioEngine={
 ctx:null,active:null,voice:null,voices:[],seq:0,lastSource:"",
 initVoices(){
  if(!("speechSynthesis" in window)){this.voices=[];this.voice=null;return}
  this.voices=speechSynthesis.getVoices().filter(v=>/^ko(?:[-_]|$)/i.test(v.lang)&&v.localService===true);
  this.voice=this.voices.find(v=>v.voiceURI===settings.voiceURI)||this.voices[0]||null;
 },
 unlock(){
  try{
   const C=window.AudioContext||window.webkitAudioContext;
   if(C&&!this.ctx)this.ctx=new C();
   if(this.ctx?.state==="suspended")this.ctx.resume().catch(()=>{});
  }catch{}
 },
 stop(){
  ++this.seq;
  if("speechSynthesis" in window)speechSynthesis.cancel();
  if(this.active){try{this.active.pause?.();this.active.stop?.()}catch{}}
  $$("audio").forEach(a=>a.pause());
  this.active=null;
 },
 badge(text){this.lastSource=text;const b=$("#audio-source");if(b)b.textContent=text},
 keyFor(key){
  if(media.has(key))return key;
  const a="ai:"+settings.aiVoice+":"+key;
  if(settings.voiceSource==="ai"&&media.has(a))return a;
  return null;
 },
 async decode(key,uri){
  if(audioBuffers.has(key))return audioBuffers.get(key);
  if(!this.ctx)return null;
  try{
   const bytes=await uriToBlob(uri).arrayBuffer();
   const buffer=await this.ctx.decodeAudioData(bytes);
   if(media.get(key)===uri)audioBuffers.set(key,buffer);
   return buffer;
  }catch{return null}
 },
 async playURI(key,uri,seq){
  /* Calling play synchronously from a user tap avoids losing iOS activation. */
  const ready=audioBuffers.get(key);
  if(ready&&this.ctx?.state==="running"){
   const node=this.ctx.createBufferSource();node.buffer=ready;node.connect(this.ctx.destination);
   this.active=node;node.onended=()=>{if(seq===this.seq)this.active=null};node.start();return true;
  }
  const a=new Audio(uri);a.preload="auto";a.setAttribute("playsinline","");this.active=a;
  a.onended=()=>{if(seq===this.seq)this.active=null};
  try{
   const play=a.play();
   if(play){let timer;try{await Promise.race([play,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error("audio-start-timeout")),2500)})])}finally{clearTimeout(timer)}}
   if(seq!==this.seq){a.pause();return false}
   return true;
  }catch{
   a.pause();
   if(seq!==this.seq)return false;
   const buffer=await this.decode(key,uri);
   if(seq!==this.seq)return false;
   if(buffer&&this.ctx?.state==="running"){
    const node=this.ctx.createBufferSource();node.buffer=buffer;node.connect(this.ctx.destination);
    this.active=node;node.onended=()=>{if(seq===this.seq)this.active=null};node.start();return true;
   }
   return false;
  }
 },
 async playSavedOnly(key){
  this.unlock();this.stop();const seq=this.seq,uri=media.get(key);
  if(!uri){toast("저장된 녹음이 없어요.");return false}
  this.badge(key.startsWith("ai:")?"AI 합성음성 · "+key.split(":")[1]:"저장된 부모·기존 녹음");
  const ok=await this.playURI(key,uri,seq);
  if(!ok&&seq===this.seq)toast("녹음은 저장되어 있지만 재생되지 않았어요. 아래 재생 버튼 또는 내보낸 파일로 확인해 주세요.");
  return ok;
 },
 async say(text,key,opts={}){
  this.unlock();this.stop();const seq=this.seq;
  const chosen=opts.deviceOnly?null:(opts.aiOnly?("ai:"+settings.aiVoice+":"+key):this.keyFor(key));
  if(chosen&&media.has(chosen)){
   const isAI=chosen.startsWith("ai:");
   this.badge(isAI?"AI 합성음성 · "+(DATA.aiVoices.find(v=>v.id===chosen.split(":")[1])?.label||chosen.split(":")[1]):"부모·기존 녹음");
   if(await this.playURI(chosen,media.get(chosen),seq))return;
   if(seq!==this.seq)return;
   toast("저장 음성 재생을 시작하지 못해 기기 음성으로 읽습니다.");
  }
  if(seq!==this.seq)return;
  this.initVoices();
  if(!this.voice){
   this.badge("소리 준비 필요 · 부모 설정 → 음성 선택");
   toast("사용 가능한 한국어 음성이 없어요. 부모 녹음 또는 저장된 AI 음성팩을 준비해 주세요.");return;
  }
  const u=new SpeechSynthesisUtterance(text);u.lang="ko-KR";u.voice=this.voice;u.rate=settings.rate;u.pitch=settings.pitch;u.volume=1;
  u.onend=()=>{if(seq===this.seq)this.active=null};
  u.onerror=e=>{if(seq===this.seq&&!["interrupted","canceled"].includes(e.error))toast("기기 음성 재생을 확인해 주세요. 저장된 녹음은 따로 재생할 수 있어요.")};
  this.badge("기기 합성음성 · "+this.voice.name+(settings.voiceSource==="ai"&&!opts.deviceOnly?" (이 항목의 AI 음성 미준비)":""));
  this.active=u;speechSynthesis.speak(u);
 },
 async warm(keys=[]){
  if(!this.ctx)return;
  for(const key of keys){const actual=this.keyFor(key);if(actual)await this.decode(actual,media.get(actual))}
 }
};
