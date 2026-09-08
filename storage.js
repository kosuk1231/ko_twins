
/* IndexedDB v1 is kept for in-place upgrades from 1.0/1.1. */
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(Error("no-indexeddb"));
  let settled=false,req;
  const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve()};
  const timer=setTimeout(()=>finish(Error("storage-open-timeout")),10000);
  try{req=indexedDB.open("word-garden",1)}catch(e){finish(e);return}
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("media"))req.result.createObjectStore("media",{keyPath:"id"})};
  req.onerror=()=>finish(req.error||Error("storage-open"));
  req.onblocked=()=>finish(Error("storage-blocked"));
  req.onsuccess=()=>{
   if(settled){req.result.close();return}
   db=req.result;
   db.onversionchange=()=>{db.close();db=null;storageOK=false;toast("다른 창에서 저장소를 갱신했어요. 이 앱을 다시 열어주세요.")};
   db.onclose=()=>{db=null;storageOK=false};
   try{
    const tx=db.transaction("media","readonly"),request=tx.objectStore("media").getAll();let rows=[];
    request.onsuccess=()=>{rows=request.result};
    tx.oncomplete=()=>{
     media=new Map();mediaMeta=new Map();
     for(const row of rows)if(row&&typeof row.id==="string"&&typeof row.value==="string"){media.set(row.id,row.value);mediaMeta.set(row.id,row)}
     storageOK=true;finish();
    };
    tx.onabort=()=>finish(tx.error||Error("storage-load"));
    tx.onerror=()=>finish(tx.error||Error("storage-load"));
   }catch(e){finish(e)}
  };
 });
}
function dbTransaction(mode="readonly"){
 if(!db)throw Error("storage-unavailable");
 if(mode==="readwrite"){try{return db.transaction("media",mode,{durability:"strict"})}catch(e){if(e.name!=="TypeError"&&e.name!=="NotSupportedError")throw e}}
 return db.transaction("media",mode);
}
function readMediaRecord(id){
 return new Promise((resolve,reject)=>{
  let tx;try{tx=dbTransaction()}catch(e){reject(e);return}
  let value;const req=tx.objectStore("media").get(id);
  req.onsuccess=()=>value=req.result;
  tx.oncomplete=()=>resolve(value);
  tx.onabort=()=>reject(tx.error||Error("read-aborted"));
  tx.onerror=()=>reject(tx.error||Error("read-failed"));
 });
}
function commitRecords(rows){
 return new Promise((resolve,reject)=>{
  let tx;try{tx=dbTransaction("readwrite");for(const row of rows)tx.objectStore("media").put(row)}catch(e){try{tx?.abort()}catch{}reject(e);return}
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(tx.error||Error("write-aborted"));
  tx.onerror=()=>reject(tx.error||Error("write-failed"));
 });
}
function putMedia(id,value,meta={}){
 const task=storageWrite.catch(()=>{}).then(async()=>{
  if(typeof value!=="string"||!value.startsWith("data:"))throw Error("invalid-media");
  const old=await readMediaRecord(id);
  const updatedAt=new Date().toISOString();
  const row={id,value,updatedAt,verifiedAt:updatedAt,source:meta.source||"local",duration:meta.duration||0,mime:meta.mime||value.slice(5).split(";")[0],bytes:meta.bytes||Math.floor(value.length*.75)};
  // One previous parent take, never a recursively expanding history.
  if(meta.source==="parent"&&old?.value&&old.value!==value){row.previous=old.value;row.previousDuration=old.duration||0}
  await commitRecords([row]);
  const check=await readMediaRecord(id);
  if(!check||check.value!==value||check.updatedAt!==updatedAt)throw Error("readback-mismatch");
  media.set(id,check.value);mediaMeta.set(id,check);audioBuffers.delete(id);
  return check;
 });
 storageWrite=task;return task;
}
function removeMedia(id){
 const task=storageWrite.catch(()=>{}).then(async()=>{
  await new Promise((resolve,reject)=>{
   let tx;try{tx=dbTransaction("readwrite");tx.objectStore("media").delete(id)}catch(e){reject(e);return}
   tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error("delete-aborted"));tx.onerror=()=>reject(tx.error||Error("delete-failed"));
  });
  if(await readMediaRecord(id))throw Error("delete-readback");
  media.delete(id);mediaMeta.delete(id);audioBuffers.delete(id);
 });
 storageWrite=task;return task;
}
function exportBackup(){
 if(recordBusy())return toast("녹음 저장이 끝난 뒤 백업해 주세요.");
 const payload={schema:2,app:"word-garden",version:DATA.version,exportedAt:new Date().toISOString(),settings,
  media:[...media].map(([id,value])=>({id,value,source:mediaMeta.get(id)?.source||"legacy",duration:mediaMeta.get(id)?.duration||0,updatedAt:mediaMeta.get(id)?.updatedAt||null}))};
 downloadBlob(new Blob([JSON.stringify(payload)],{type:"application/json"}),"word-garden-backup-"+new Date().toISOString().slice(0,10)+".json");
 toast("백업 파일에는 사진·목소리가 포함됩니다. 다운로드된 파일을 안전하게 보관하세요.");
}
const legacyIds=DATA.legacyWordIds||[];
const baseAudioKeys=["name:seol","name:chae","name:both","system:pair","system:again","system:test",...WORDS.flatMap(w=>["word:"+w.id,"phrase:"+w.id,...Object.keys(PROFILES).map(p=>"ask:"+w.id+":"+p)])];
const knownKeys=new Set([...baseAudioKeys,...WORDS.map(w=>"photo:"+w.id),...legacyIds.flatMap(id=>["photo:"+id,"word:"+id,"phrase:"+id,...Object.keys(PROFILES).map(p=>"ask:"+id+":"+p)]),
 ...DATA.aiVoices.flatMap(v=>baseAudioKeys.map(k=>"ai:"+v.id+":"+k))]);
function validateBackup(raw){
 if(!raw||raw.app!=="word-garden"||![1,2].includes(raw.schema)||!Array.isArray(raw.media)||raw.media.length>knownKeys.size)throw Error("invalid-backup");
 const ids=new Set(),rows=[];
 for(const m of raw.media){
  if(!m||!knownKeys.has(m.id)||ids.has(m.id)||typeof m.value!=="string"||m.value.length>8e6)throw Error("invalid-media");
  ids.add(m.id);
  if(m.id.startsWith("photo:")){
   if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(m.value))throw Error("invalid-photo");
  }else if(!/^data:audio\/(mp4|webm|ogg|wav|mpeg|x-wav|aac)(;codecs=[A-Za-z0-9.,_-]+)?;base64,[A-Za-z0-9+/=\r\n]+$/.test(m.value))throw Error("invalid-audio");
  const source=m.id.startsWith("ai:")?"ai":m.id.startsWith("photo:")?"photo":m.source==="parent"?"parent":"legacy";
  rows.push({id:m.id,value:m.value,source,duration:typeof m.duration==="number"&&m.duration>=0&&m.duration<120?m.duration:0,
    updatedAt:typeof m.updatedAt==="string"&&Number.isFinite(Date.parse(m.updatedAt))?m.updatedAt:new Date().toISOString(),verifiedAt:new Date().toISOString()});
 }
 return {settings:validateSettings(raw.settings),media:rows};
}
async function importBackupFile(f){
 if(recordBusy()||pendingRecording||aiJob)throw Error("busy");
 if(f.size>180*1024*1024)throw Error("too-large");
 const parsed=validateBackup(JSON.parse(await f.text()));
 if(!confirm(`백업의 ${parsed.media.length}개 사진·목소리와 설정을 불러올까요? 같은 항목은 교체하고 나머지는 유지합니다.`))return false;
 if(!db)await openDB();
 const task=storageWrite.catch(()=>{}).then(async()=>{
  await commitRecords(parsed.media);
  for(const row of parsed.media){
   const check=await readMediaRecord(row.id);if(!check||check.value!==row.value)throw Error("backup-readback");
  }
  for(const row of parsed.media){media.set(row.id,row.value);mediaMeta.set(row.id,row)}
 });
 storageWrite=task;await task;
 settings=parsed.settings;saveSettings();audioBuffers.clear();AudioEngine.initVoices();
 return true;
}
