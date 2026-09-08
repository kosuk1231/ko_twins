
"use strict";
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=process.argv[2]||path.resolve(__dirname,"..");
const base="https://example.invalid/kids/";
const handlers={}, stores=new Map(), fetched=[];
class Req {
 constructor(url,opt={}){this.url=new URL(typeof url==="string"?url:url.url,base).href;this.method="GET";this.mode=opt.mode||"same-origin";this.cache=opt.cache}
}
const storage={
 async keys(){return [...stores.keys()]},
 async delete(k){return stores.delete(k)},
 async open(k){
  if(!stores.has(k))stores.set(k,new Map());
  const map=stores.get(k);
  return {
   async addAll(rs){const values=rs.map(r=>{const file=path.join(root,new URL(r.url).pathname.replace("/kids/",""));return [r.url,{body:fs.readFileSync(file),url:r.url}]} );for(const [u,r]of values)map.set(u,r)},
   async match(req){return map.get(typeof req==="string"?req:req.url)}
  }
 }
};
const self={location:{href:base+"sw.js",origin:"https://example.invalid"},addEventListener:(t,f)=>handlers[t]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
const ctx={self,caches:storage,Request:Req,URL,fetch:async(req)=>{fetched.push(req.url);throw Error("offline")}};
vm.runInNewContext(fs.readFileSync(path.join(root,"sw.js"),"utf8"),ctx);
async function lifecycle(type){let promise;handlers[type]({waitUntil:p=>promise=p});await promise}
async function request(url,mode="same-origin"){let p;handlers.fetch({request:new Req(url,{mode}),respondWith:v=>p=v});return p?await p:undefined}
(async()=>{
 await lifecycle("install");assert.equal(stores.get("word-garden-v1.0.0").size,5);
 console.log("PASS: cache installs all five packaged core resources");
 stores.set("word-garden-v0",new Map());stores.set("other-app-v1",new Map());
 await lifecycle("activate");assert(!stores.has("word-garden-v0"));assert(stores.has("other-app-v1"));
 console.log("PASS: activation only removes this app's older cache");
 const response=await request(base,"navigate");assert(response.body.toString().includes("말랑말랑"));
 const asset=await request(base+"icon-192.png");assert(asset.body.length>100);
 assert.equal(fetched.length,0);
 console.log("PASS: simulated offline navigation and icon loads come from cache");
 assert.equal(await request("https://upload.wikimedia.org/image.jpg"),undefined);
 console.log("PASS: service worker does not intercept cross-origin requests");
 assert.equal(await request("https://example.invalid/other/index.html"),undefined);
 console.log("PASS: service worker respects deployment subdirectory");
 console.log("NOTE: This is a CacheStorage/worker simulation, not an installed browser PWA test.");
})().catch(e=>{console.error(e);process.exit(1)});
