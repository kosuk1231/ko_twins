/* Atomic app cache. Never touches IndexedDB or parent recordings. */
const CACHE="word-garden-v1.2.0";
const CORE=["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./assets/cards/dog.svg", "./assets/cards/cat.svg", "./assets/cards/rabbit.svg", "./assets/cards/bear.svg", "./assets/cards/lion.svg", "./assets/cards/elephant.svg", "./assets/cards/giraffe.svg", "./assets/cards/monkey.svg", "./assets/cards/duck.svg", "./assets/cards/pig.svg", "./assets/cards/cow.svg", "./assets/cards/horse.svg", "./assets/cards/apple.svg", "./assets/cards/banana.svg", "./assets/cards/strawberry.svg", "./assets/cards/grape.svg", "./assets/cards/watermelon.svg", "./assets/cards/mandarin.svg", "./assets/cards/peach.svg", "./assets/cards/pear.svg", "./assets/cards/sweetpotato.svg", "./assets/cards/carrot.svg", "./assets/cards/corn.svg", "./assets/cards/potato.svg", "./assets/cards/broccoli.svg", "./assets/cards/cucumber.svg", "./assets/cards/tomato.svg", "./assets/cards/pumpkin.svg", "./assets/cards/cabbage.svg", "./assets/cards/eggplant.svg", "./assets/cards/car.svg", "./assets/cards/bus.svg", "./assets/cards/firetruck.svg", "./assets/cards/ambulance.svg", "./assets/cards/policecar.svg", "./assets/cards/taxi.svg", "./assets/cards/truck.svg", "./assets/cards/tractor.svg", "./assets/cards/train.svg", "./assets/cards/airplane.svg", "./assets/cards/boat.svg", "./assets/cards/bicycle.svg", "./assets/cards/rice.svg", "./assets/cards/bread.svg", "./assets/cards/milk.svg", "./assets/cards/water.svg", "./assets/cards/egg.svg", "./assets/cards/noodles.svg", "./assets/cards/cheese.svg", "./assets/cards/soup.svg", "./assets/cards/ricecake.svg", "./assets/cards/dumpling.svg", "./assets/cards/pororo.svg", "./assets/cards/crong.svg", "./assets/cards/loopy.svg", "./assets/cards/eddy.svg", "./assets/cards/poby.svg", "./assets/cards/petty.svg", "./assets/cards/harry.svg", "./assets/cards/rody.svg"];
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
