"use strict";
const crypto=require("node:crypto");
const PREFIX="word-garden/family-backups/";
function json(res,status,data){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(data))}
function same(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function sameOrigin(req){
 const origin=req.headers.origin;if(!origin)return true;
 try{return new URL(origin).host===req.headers.host}catch{return false}
}
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","no-store, max-age=0");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return json(res,405,{error:"POST required"})}
 if(!sameOrigin(req))return json(res,403,{error:"Origin not allowed."});
 const secret=process.env.WORD_GARDEN_PARENT_TOKEN||"";
 if(secret.length<32)return json(res,503,{error:"Cloud backup is not configured."});
 const token=String(req.headers["x-parent-token"]||"");
 if(!same(secret,token))return json(res,401,{error:"Unauthorized."});
 if(!String(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))return json(res,415,{error:"JSON required."});
 if(Number(req.headers["content-length"]||0)>512)return json(res,413,{error:"Request too large."});
 let body=req.body;
 if(typeof body==="string"){try{body=JSON.parse(body)}catch{return json(res,400,{error:"Invalid JSON."})}}
 const action=body?.action;if(!["put","get"].includes(action))return json(res,400,{error:"Unknown action."});
 try{
  const {issueSignedToken,presignUrl,list}=await import("@vercel/blob");
  const validUntil=Date.now()+10*60*1000;
  if(action==="put"){
   const pathname=PREFIX+new Date().toISOString().replace(/[:.]/g,"-")+"-"+crypto.randomBytes(4).toString("hex")+".json";
   const delegation=await issueSignedToken({pathname,operations:["put"],validUntil});
   const {presignedUrl}=await presignUrl(delegation,{pathname,operation:"put",validUntil});
   return json(res,200,{presignedUrl,pathname,expiresAt:new Date(validUntil).toISOString()});
  }
  const result=await list({prefix:PREFIX,limit:100});
  const blobs=(result?.blobs||[]).filter(b=>String(b.pathname||"").endsWith(".json"));
  if(!blobs.length)return json(res,404,{error:"No cloud backup yet."});
  blobs.sort((a,b)=>new Date(b.uploadedAt||0)-new Date(a.uploadedAt||0));
  const latest=blobs[0],pathname=latest.pathname;
  const delegation=await issueSignedToken({pathname,operations:["get"],validUntil});
  const {presignedUrl}=await presignUrl(delegation,{pathname,operation:"get",validUntil,useCache:false});
  return json(res,200,{presignedUrl,pathname,uploadedAt:latest.uploadedAt||null,size:latest.size||null,expiresAt:new Date(validUntil).toISOString()});
 }catch(e){
  console.error("cloud-backup",e?.name,e?.message);
  return json(res,503,{error:"Vercel Private Blob is not connected or unavailable."});
 }
};
