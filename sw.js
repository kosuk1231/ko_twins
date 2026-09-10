/* Atomic app cache. Never touches IndexedDB or parent recordings. */
const CACHE="word-garden-v1.6.0";
const CORE=["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./assets/sheets/animals.webp", "./assets/sheets/fruit.webp", "./assets/sheets/vegetables.webp", "./assets/sheets/vehicles.webp", "./assets/sheets/objects.webp", "./assets/sheets/clothes.webp", "./assets/sheets/food.webp", "./assets/sheets/insects.webp", "./assets/sheets/body.webp", "./assets/sheets/people.webp", "./assets/sheets/nature.webp", "./assets/characters/pororo.webp", "./assets/characters/crong.webp", "./assets/characters/loopy.webp", "./assets/characters/eddy.webp", "./assets/characters/poby.webp", "./assets/characters/petty.webp", "./assets/characters/harry.webp", "./assets/characters/rody.webp", "./assets/characters/tongtong.webp", "./assets/characters/pipi-popo.webp", "./assets/characters/babyshark.webp", "./assets/characters/daddyshark.webp", "./assets/characters/mommyshark.webp", "./assets/characters/grandpashark.webp", "./assets/characters/grandmashark.webp", "./assets/characters/william.webp", "./assets/characters/tayo.webp", "./assets/characters/rogi.webp", "./assets/characters/lani.webp", "./assets/characters/gani.webp", "./assets/characters/citu.webp", "./assets/characters/peanut.webp", "./assets/characters/heart.webp", "./assets/characters/hana.webp", "./assets/cards/character-needed.svg"];
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

// Recovery page can verify the active application cache without reading any private data.
self.addEventListener("message",event=>{
 if(event.data?.type==="WORD_GARDEN_VERSION"&&event.ports?.[0]){
  event.ports[0].postMessage({cache:CACHE,version:"1.6.0"});
 }
});
