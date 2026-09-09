
/* Deliberately simulated IndexedDB transport. The app's open/commit/readback
   code remains unchanged. This is not a device-persistence test. */
(()=>{
 const rows=new Map((window.__SEED_ROWS__||[]).map(r=>[r.id,r]));
 window.__testRows=rows;window.__failWrite=false;window.__readCorrupt=false;
 const database={
  objectStoreNames:{contains:()=>true},close(){},
  transaction(name,mode,options){
   let ops=[],aborted=false;const tx={error:null};
   const store={
    get(id){const r={};setTimeout(()=>{r.result=window.__readCorrupt?undefined:rows.get(id);r.onsuccess?.()},0);return r},
    getAll(){const r={};setTimeout(()=>{r.result=[...rows.values()];r.onsuccess?.()},0);return r},
    put(row){const r={};ops.push(()=>rows.set(row.id,structuredClone(row)));setTimeout(()=>r.onsuccess?.(),0);return r},
    delete(id){ops.push(()=>rows.delete(id));return{}}
   };
   tx.objectStore=()=>store;
   tx.abort=()=>{aborted=true;tx.error=new DOMException("Aborted","AbortError");setTimeout(()=>tx.onabort?.(),0)};
   setTimeout(()=>{
    if(aborted)return;
    if(mode==="readwrite"&&window.__failWrite){tx.error=new DOMException("Full","QuotaExceededError");tx.onabort?.();return}
    ops.forEach(f=>f());tx.oncomplete?.();
   },50);
   return tx;
  }
 };
 const api={open(){const req={};setTimeout(()=>{req.result=database;req.onsuccess?.()},0);return req}};
 Object.defineProperty(window,"indexedDB",{value:api,configurable:true});
 const saved=new Map(Object.entries(window.__SEED_SETTINGS__||{}));
 Object.defineProperty(window,"localStorage",{value:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)}});
 window.__spoken=[];
 window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 const synth={getVoices:()=>[
  {name:"Korean Local A",voiceURI:"ko-local-a",lang:"ko-KR",localService:true},
  {name:"Korean Local B",voiceURI:"ko-local-b",lang:"ko-KR",localService:true},
  {name:"Korean Remote",voiceURI:"ko-remote",lang:"ko-KR",localService:false},
  {name:"English",voiceURI:"en-local",lang:"en-US",localService:true}],
  addEventListener(){},cancel(){},speak(u){window.__spoken.push({text:u.text,voice:u.voice?.name,rate:u.rate,pitch:u.pitch});setTimeout(()=>u.onend?.(),100)}
 };
 Object.defineProperty(window,"speechSynthesis",{value:synth,configurable:true});
 Object.defineProperty(navigator,"mediaDevices",{value:{
  async getUserMedia(){
   const ctx=new AudioContext();await ctx.resume();
   const osc=ctx.createOscillator(),gain=ctx.createGain(),dest=ctx.createMediaStreamDestination();
   osc.frequency.value=235;gain.gain.value=.06;osc.connect(gain);gain.connect(dest);osc.start();
   window.__micContext=ctx;window.__micOsc=osc;return dest.stream;
  }
 },configurable:true});
 window.confirm=()=>true;
 window.__networkCalls=[];
})();
