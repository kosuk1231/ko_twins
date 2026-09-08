
"""Build the offline app and server-side fixed speech allowlist. No dependencies."""
from pathlib import Path
import json
p=Path(__file__).resolve().parent
data=json.loads((p/"content.json").read_text(encoding="utf-8"))
css=(p/"styles.css").read_text(encoding="utf-8")
js=(p/"app.js").read_text(encoding="utf-8")
modules="\n\n".join((p/f).read_text(encoding="utf-8") for f in ["audio.js","storage.js","recording.js","voices.js"])
js=js.replace("/* AUDIO_MODULE */",modules)
template=(p/"template.html").read_text(encoding="utf-8")
html=template.replace("/* APP_STYLES */",css).replace("/* APP_SCRIPT */",js).replace('{"APP_DATA":true}',json.dumps(data,ensure_ascii=False).replace("</","<\\/"))
(p/"index.html").write_text(html,encoding="utf-8")
names={"seol":"\uc740\uc124\uc544","chae":"\uc740\ucc44\uc57c","both":"\uc740\uc124\uc544, \uc740\ucc44\uc57c"}
speech={"name:"+k:v+", \uac19\uc774 \ub180\uc790." for k,v in names.items()}
speech.update({"system:test":"\uc548\ub155. \uc0ac\uacfc. \ubc14\ub098\ub098.","system:pair":"\uac19\uc740 \uadf8\ub9bc\uc744 \ucc3e\uc544\ubcfc\uae4c?","system:again":"\uac19\uc774 \ud55c \ubc88 \ub354 \uc0b4\ud3b4\ubcfc\uae4c?"})
for w in data["words"]:
    speech["word:"+w["id"]]=w["label"]
    speech["phrase:"+w["id"]]=w["phrase"]
    for k,n in names.items():speech["ask:"+w["id"]+":"+k]=n+", "+w["label"]+" \uc5b4\ub514 \uc788\uc744\uae4c?"
(p/"speech-content.json").write_text(json.dumps(speech,ensure_ascii=False,indent=2),encoding="utf-8")
core=["./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"]+["./"+w["art"] for w in data["words"]]
sw="""/* Atomic app cache. Never touches IndexedDB or parent recordings. */
const CACHE=%s;
const CORE=%s;
self.addEventListener("install",event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{await cache.addAll(CORE.map(url=>new Request(url,{cache:"reload"})));}
 catch(error){await caches.delete(CACHE);throw error;}
 await self.skipWaiting();
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith("word-garden-v")&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;
 if(req.mode==="navigate"&&(url.pathname===new URL("./",self.location.href).pathname||url.pathname===new URL("./index.html",self.location.href).pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   return await cache.match(new URL("./index.html",self.location.href))||fetch(req);
  })());return;
 }
 if(!CORE.some(path=>new URL(path,self.location.href).href===url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(req);
  if(cached)return cached;
  return fetch(req);
 })());
});
"""%(json.dumps("word-garden-v"+data["version"]),json.dumps(core))
(p/"sw.js").write_text(sw,encoding="utf-8")
print("Built index.html, speech-content.json and sw.js:",len(data["words"]),"cards;",len(speech),"speech phrases")
