/* Public character artwork relay: fixed allowlist only, no user URL input.
   Fetches existing artwork; no AI service, credentials, or personal media. */
'use strict';
const sources = require('../character-sources.json');
const sourceMap = new Map(sources.map(s => [s.id, s]));
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_HTML = 2 * 1024 * 1024;
let pageCache = null;
function allowURL(input, kind, source) {
  const u = new URL(input);
  if (u.protocol !== 'https:' || u.username || u.password || u.port) throw Error('unsafe-source');
  if (kind === 'page') {
    if (u.href !== 'https://with-hs.tistory.com/m/184') throw Error('unsafe-source');
  } else if (source.provider === 'iconix') {
    if (u.href !== source.url) throw Error('unsafe-source');
  } else {
    if (u.hostname !== 'blog.kakaocdn.net' || !/^\/(dna|dn)\//.test(u.pathname) || !u.pathname.split('/').includes(source.imageKey)) throw Error('unsafe-source');
  }
  return u.href;
}
async function fetchLimited(url, limit, kind, source) {
  let current = allowURL(url, kind, source);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
  try {
    for (let redirects = 0; redirects < 3; redirects++) {
      const r = await fetch(current, {redirect:'manual', signal:controller.signal, headers:{'Accept':kind === 'page' ? 'text/html' : 'image/png,image/jpeg,image/webp', 'User-Agent':'WordGarden/1.3 (family character card importer)'}});
      if ([301,302,303,307,308].includes(r.status)) {
        const loc = r.headers.get('location');
        if (!loc) throw Error('redirect-without-location');
        current = allowURL(new URL(loc, current).href, kind, source); continue;
      }
      if (!r.ok) throw Error('source-http-' + r.status);
      if (Number(r.headers.get('content-length')) > limit) throw Error('source-too-large');
      const type = (r.headers.get('content-type') || '').split(';')[0].toLowerCase();
      if (kind === 'page' ? !['text/html','application/xhtml+xml'].includes(type) : !['image/png','image/jpeg','image/webp'].includes(type)) throw Error('source-wrong-type');
      const reader=r.body.getReader(), chunks=[]; let size=0;
      try {for (;;) {const {done,value}=await reader.read(); if(done)break; size+=value.byteLength; if(size>limit)throw Error('source-too-large'); chunks.push(Buffer.from(value));}}
      catch (e) {await reader.cancel().catch(()=>{}); throw e;}
      return {bytes:Buffer.concat(chunks),type};
    }
    throw Error('too-many-redirects');
  } finally { clearTimeout(timer); }
}
function decodeEntities(text) {
  return text.replace(/&amp;/g,'&').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,dec)=>String.fromCodePoint(parseInt(hex||dec,hex?16:10))).replace(/\\u0026/gi,'&').replace(/\\\//g,'/');
}
function imageURLFromHTML(html, source) {
  const text=decodeEntities(html);
  const candidates=text.match(/https:\/\/blog\.kakaocdn\.net\/[^\s"'<>\\]+/g)||[];
  for (const candidate of candidates) {
    try {const valid=allowURL(candidate,'image',source); const u=new URL(valid); const expiry=Number(u.searchParams.get('expires'));
      if (!expiry || expiry*1000>Date.now()+60000) return valid;
    } catch {}
  }
  return null;
}
async function freshTistoryURL(source) {
  if(!pageCache || pageCache.until<Date.now()) {
    const promise=fetchLimited(source.refreshPage,MAX_HTML,'page',source).then(r=>r.bytes.toString('utf8'));
    pageCache={until:Date.now()+15*60000,promise};
    promise.catch(()=>{pageCache=null;});
  }
  const html=await pageCache.promise;
  return imageURLFromHTML(html,source);
}
function isImage(bytes, type) {
  if(type==='image/png')return bytes.length>32&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(type==='image/jpeg')return bytes.length>32&&bytes[0]===255&&bytes[1]===216;
  return type==='image/webp'&&bytes.length>32&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
}
async function handler(req,res) {
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'method-not-allowed'});}
  const id=req.query?.id;
  if(typeof id!=='string'||!sourceMap.has(id))return res.status(400).json({error:'unknown-character'});
  const source=sourceMap.get(id);
  try {
    let url=source.url;
    if(source.provider==='tistory') {
      const fresh=await freshTistoryURL(source).catch(()=>null);
      if(fresh)url=fresh;
      else if(Number(new URL(url).searchParams.get('expires'))*1000<Date.now())throw Error('source-link-expired');
    }
    const result=await fetchLimited(url,MAX_IMAGE,'image',source);
    if(!isImage(result.bytes,result.type))throw Error('source-invalid-image');
    res.setHeader('Content-Type',result.type);
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(result.bytes);
  } catch(e) {
    res.setHeader('Cache-Control','no-store');
    return res.status(502).json({error: e.name==='AbortError'?'source-timeout':'source-unavailable', detail:'Original image could not be downloaded. Already saved images are unchanged.'});
  }
}
module.exports=handler;
module.exports._test={allowURL,imageURLFromHTML,isImage,sourceMap};
