
"use strict";
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),base="https://example.invalid/";
const handlers={},stores=new Map(),fetched=[];
let failAsset=false;
class Req{constructor(url,opt={}){this.url=new URL(typeof url==="string"?url:url.url,base).href;this.method=opt.method||"GET";this.mode=opt.mode||"same-origin"}}
function key(r){return typeof r==="string"?r:r.url||r.href}
const storage={
 async keys(){return [...stores.keys()]},async delete(k){return stores.delete(k)},
 async open(k){
  if(!stores.has(k))stores.set(k,new Map());const map=stores.get(k);
  return {async addAll(requests){
   for(const r of requests){if(failAsset&&r.url.endsWith("cat.svg"))throw Error("network");
    map.set(r.url,{body:fs.readFileSync(path.join(root,new URL(r.url).pathname)),url:r.url})}
  },async match(r){return map.get(key(r))}}
}};
let skip=0,claim=0;
const self={location:{href:base+"sw.js",origin:"https://example.invalid"},addEventListener:(t,f)=>handlers[t]=f,skipWaiting:async()=>skip++,clients:{claim:async()=>claim++}};
vm.runInNewContext(fs.readFileSync(path.join(root,"sw.js"),"utf8"),{self,caches:storage,Request:Req,URL,fetch:async(req)=>{fetched.push(req.url);throw Error("offline")}});
async function lifecycle(t){let p;handlers[t]({waitUntil:v=>p=v});await p}
async function request(url,mode="same-origin",method="GET"){let p;handlers.fetch({request:new Req(url,{mode,method}),respondWith:v=>p=v});return p?await p:undefined}
(async()=>{
 await lifecycle("install");assert.equal(stores.get("word-garden-v1.2.0").size,65);assert.equal(skip,1);
 console.log("PASS 65 core files cached: app, icons, manifest and 60 SVGs");
 stores.set("word-garden-v1.1.0",new Map());stores.set("unrelated",new Map());
 await lifecycle("activate");assert(!stores.has("word-garden-v1.1.0"));assert(stores.has("unrelated"));assert.equal(claim,1);
 console.log("PASS worker replaces only its own old caches");
 const page=await request(base,"navigate");assert(page.body.toString().includes("v1.2.0"));
 const art=await request(base+"assets/cards/pororo.svg");assert(art.body.toString().includes("<svg"));assert.equal(fetched.length,0);
 console.log("PASS simulated offline navigation and illustration from cache");
 assert.equal(await request(base+"api/speech","same-origin","POST"),undefined);
 assert.equal(await request(base+"INSTALL.html","navigate"),undefined);
 assert.equal(await request("https://other.example/a.png"),undefined);
 console.log("PASS API, separate documents and other origins are not cached");
 stores.set("word-garden-v1.1.0",new Map([["preserved",true]]));failAsset=true;
 await assert.rejects(lifecycle("install"));assert(!stores.has("word-garden-v1.2.0"));assert(stores.has("word-garden-v1.1.0"));
 console.log("PASS failed preparation discards partial new cache, retains old version");
 console.log("NOTE: worker/CacheStorage simulation; not a browser-installed PWA test.");
})().catch(e=>{console.error(e);process.exit(1)});
