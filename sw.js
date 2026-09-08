"use strict";
const CACHE="word-garden-v1.0.0";
const CORE=["./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(CORE.map(url=>new Request(url,{cache:"reload"})));
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith("word-garden-v")&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return; // Photos are explicitly fetched and stored in IndexedDB by the parent.
 const scope=new URL("./",self.location.href);
 if(!url.pathname.startsWith(scope.pathname))return;
 if(req.mode==="navigate"&&(url.pathname===scope.pathname||url.pathname===scope.pathname+"index.html")){
  event.respondWith((async()=>{
   const cached=await (await caches.open(CACHE)).match(new URL("./index.html",self.location.href).href);
   if(cached)return cached;
   return fetch(req);
  })());return;
 }
 event.respondWith((async()=>{
  const cached=await (await caches.open(CACHE)).match(req);
  return cached||fetch(req);
 })());
});
