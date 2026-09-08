
"use strict";
const crypto=require("node:crypto");
const speech=require("../speech-content.json");
const VOICES=new Set(["coral","nova","shimmer","alloy","onyx","sage"]);
/* A per-instance backstop, NOT a distributed quota. Configure provider budgets
   and Vercel access/firewall rules for a publicly reachable deployment. */
let windowStarted=Date.now(),windowCount=0;
function json(res,status,error){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify({error}))}
function same(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","no-store, max-age=0");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return json(res,405,"POST required")}
 const secret=process.env.WORD_GARDEN_PARENT_TOKEN||"",key=process.env.OPENAI_API_KEY||"";
 if(secret.length<32||!key)return json(res,503,"AI preparation is not configured.");
 const token=String(req.headers["x-parent-token"]||"");
 if(!same(secret,token))return json(res,401,"Unauthorized.");
 const origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return json(res,403,"Origin not allowed.")}catch{return json(res,403,"Origin not allowed.")}}
 if(!String(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))return json(res,415,"JSON required.");
 if(Number(req.headers["content-length"]||0)>2048)return json(res,413,"Request too large.");
 let body=req.body;
 if(typeof body==="string"){if(Buffer.byteLength(body)>2048)return json(res,413,"Request too large.");try{body=JSON.parse(body)}catch{return json(res,400,"Invalid JSON.")}}
 if(!body||typeof body!=="object"||Array.isArray(body)||JSON.stringify(body).length>2048)return json(res,400,"Invalid request.");
 if(Object.keys(body).some(k=>!["key","voice"].includes(k))||!VOICES.has(body.voice)||typeof body.key!=="string"||!Object.hasOwn(speech,body.key))return json(res,400,"Unknown voice or phrase.");
 if(Date.now()-windowStarted>=60000){windowStarted=Date.now();windowCount=0}
 if(++windowCount>90){res.setHeader("Retry-After","60");return json(res,429,"Please retry later.")}
 try{
  const response=await fetch("https://api.openai.com/v1/audio/speech",{
   method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
   body:JSON.stringify({model:"gpt-4o-mini-tts",voice:body.voice,input:speech[body.key],response_format:"mp3",
    instructions:"Speak only the provided Korean text in clear, natural standard Korean. Warm, gentle and reassuring, like a parent naming a picture for a toddler. Slightly slower than ordinary conversation. Do not add introductions, background music, sound effects, or extra words."}),
   signal:AbortSignal.timeout(25000)
  });
  if(!response.ok)return json(res,response.status===429?429:502,"Speech provider request failed. Check the API project's billing and access.");
  const type=response.headers.get("content-type")||"";
  if(!type.startsWith("audio/"))return json(res,502,"Invalid speech response.");
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<100||bytes.length>3000000)return json(res,502,"Invalid audio size.");
  res.statusCode=200;res.setHeader("Content-Type","audio/mpeg");res.setHeader("Content-Length",bytes.length);res.end(bytes);
 }catch(e){return json(res,e.name==="TimeoutError"?504:502,"Speech service unavailable.")}
};
