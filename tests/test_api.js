
"use strict";
const assert=require("node:assert/strict"),handler=require("../api/speech.js");
const secret="test-".repeat(8),phrases=require("../speech-content.json");
process.env.OPENAI_API_KEY="not-a-real-key";process.env.WORD_GARDEN_PARENT_TOKEN=secret;
let called=0,payload,providerStatus=200;
global.fetch=async(url,options)=>{
 called++;assert.equal(url,"https://api.openai.com/v1/audio/speech");payload=JSON.parse(options.body);
 return new Response(providerStatus===200?Buffer.alloc(400,1):"secret provider error",{status:providerStatus,headers:{"content-type":providerStatus===200?"audio/mpeg":"application/json"}});
};
async function call(body={key:"word:dog",voice:"coral"},headers={},method="POST"){
 const req={method,body,headers:{"x-parent-token":secret,"content-type":"application/json",host:"app.example",origin:"https://app.example",...headers}};
 const res={headers:{},statusCode:0,setHeader(k,v){this.headers[k.toLowerCase()]=v},end(b){this.body=b}};
 await handler(req,res);return res;
}
(async()=>{
 let r=await call();assert.equal(r.statusCode,200);assert.equal(payload.input,phrases["word:dog"]);assert.equal(payload.model,"gpt-4o-mini-tts");
 assert.equal(r.headers["cache-control"],"no-store, max-age=0");assert(Buffer.isBuffer(r.body));
 console.log("PASS authenticated fixed phrase creates audio through mocked provider");
 const before=called;
 assert.equal((await call({},{},"GET")).statusCode,405);
 assert.equal((await call(undefined,{"x-parent-token":"wrong"})).statusCode,401);
 assert.equal((await call(undefined,{origin:"https://untrusted.example"})).statusCode,403);
 assert.equal((await call({voice:"coral",key:"word:dog",input:"arbitrary text"})).statusCode,400);
 assert.equal((await call({voice:"unknown",key:"word:dog"})).statusCode,400);
 assert.equal((await call({voice:"coral",key:"__proto__"})).statusCode,400);
 assert.equal((await call(undefined,{"content-length":"3000"})).statusCode,413);
 assert.equal(called,before);
 console.log("PASS method, authentication, origin, allowlist and size checks prevent provider calls");
 delete process.env.WORD_GARDEN_PARENT_TOKEN;
 assert.equal((await call()).statusCode,503);assert.equal(called,before);
 process.env.WORD_GARDEN_PARENT_TOKEN=secret;providerStatus=401;
 r=await call();assert.equal(r.statusCode,502);assert(!r.body.includes("secret provider"));
 console.log("PASS missing configuration disables AI; provider secrets are not exposed");
 assert.equal(Object.keys(phrases).length,306);
 console.log("PASS 306 allowed Korean phrases; no arbitrary speech proxy");
})().catch(e=>{console.error(e);process.exit(1)});
