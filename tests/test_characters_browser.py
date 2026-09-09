"""Browser UI regression: simulated IndexedDB + remote images + device speech.
MediaRecorder and image decode/crop/encode run in real Chromium. Navigation is
administratively blocked here, so this is NOT an actual PWA/install/reload test.
Test images are arbitrary shapes, NOT replacement artwork shipped to users.
"""
from pathlib import Path
import json,io,base64,re
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
out=root/'test-output';out.mkdir(exist_ok=True)
results=[]
def passed(s):
    print('PASS',s,flush=True);results.append(s)
def png(width=600,height=600):
    im=Image.new('RGB',(width,height),'white');dr=ImageDraw.Draw(im);dr.ellipse((70,65,min(width-70,300),min(height-70,380)),fill=(38,132,171));b=io.BytesIO();im.save(b,format='PNG');return b.getvalue()
images={s['id']:'data:image/png;base64,'+base64.b64encode(png(*(s['crop'][4:] if s['crop'] else [600,600]))).decode() for s in json.loads((root/'character-sources.json').read_text())}
def fixture(seed=None,settings=None,online=True):
    html=(root/'index.html').read_text()
    html=re.sub(r'assets/cards/([a-z0-9_-]+)\.svg',lambda m:'data:image/svg+xml;base64,'+base64.b64encode((root/m.group(0)).read_bytes()).decode(),html)
    support='window.__SEED_ROWS__='+json.dumps(seed or [])+';window.__SEED_SETTINGS__='+json.dumps({'word-garden-settings':json.dumps(settings)} if settings else {})+';\n'+(root/'tests'/'fixture.js').read_text()
    support+='\nwindow.__imageFixtures='+json.dumps(images)+';window.__imageCalls=[];window.__imageFail=null;window.__online='+str(online).lower()+';'
    support+='''
    Object.defineProperty(navigator,'onLine',{get:()=>__online,configurable:true});
    const originalFetch=window.fetch;
    window.fetch=async (url,options)=>{
     if(String(url).startsWith('/api/character?')){
      const id=new URL(String(url),'https://fixture.invalid').searchParams.get('id');__imageCalls.push(id);
      if(!__online)throw new TypeError('offline');
      if(__imageFail===id)return new Response('{}',{status:502,headers:{'Content-Type':'application/json'}});
      const raw=atob(__imageFixtures[id].split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
      return new Response(bytes,{status:200,headers:{'Content-Type':'image/png'}});
     }
     return originalFetch(url,options);
    };'''
    return html.replace('<script type="application/json"','<script>'+support+'</script><script type="application/json"',1)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    context=browser.new_context(viewport={'width':820,'height':1180},accept_downloads=True)
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(10000)
    page.set_content(fixture());page.wait_for_selector('#start');page.wait_for_function('storageOK && !!db')
    assert page.evaluate('WORDS.length')==72
    assert page.evaluate('readyWords().length')==52
    assert page.evaluate('readyWords("characters").length')==0
    assert page.locator('.category').count()==6
    passed('72 catalogue entries; 52 ordinary cards ready; no invented/generated character active')
    uri='data:image/png;base64,'+base64.b64encode(png()).decode()
    page.evaluate('(uri)=>putMedia("photo:cat",uri)',uri)
    oldrows=page.evaluate('[...__testRows.values()]')
    page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(10000)
    page.set_content(fixture(oldrows,{'picture':'custom','category':'animals'}));page.wait_for_selector('#start')
    assert page.evaluate('media.has("photo:cat")')
    assert page.evaluate('settings.picture')=='diorama'
    assert not page.evaluate('shouldPhoto(WORD_MAP.get("cat"))')
    passed('Legacy photo preserved; new picture policy defaults ordinary cards to uniform art')
    page.evaluate('showParents("characters")')
    assert page.locator('.character-tile').count()==20
    page.screenshot(path=str(out/'ipad-characters-unprepared.png'),full_page=True)
    page.click('[data-character-get="pororo"]');page.wait_for_function('!characterJob && media.has("character:pororo")')
    assert page.evaluate('!!mediaMeta.get("character:pororo").verifiedAt')
    assert page.evaluate('readyWords("characters").length')==1
    assert page.locator('#close-parents').is_enabled()
    original=page.evaluate('media.get("character:pororo")');assert original.startswith('data:image/')
    passed('Import uses commit completion + independent read-back; controls re-enabled after save (simulated DB)')
    page.evaluate('__imageFail="crong"')
    page.click('[data-character-get="crong"]');page.wait_for_function('!characterJob')
    assert not page.evaluate('media.has("character:crong")')
    assert page.evaluate('media.get("character:pororo")')==original
    assert '\ubbf8\uc644\ub8cc' in page.evaluate('characterMessage')
    passed('Source failure clearly reports missing image; previously saved images preserved')
    page.evaluate('__imageFail=null;__failWrite=true')
    page.click('[data-character-get="crong"]');page.wait_for_function('!characterJob')
    assert not page.evaluate('media.has("character:crong")')
    assert '\ubbf8\uc644\ub8cc' in page.evaluate('characterMessage')
    page.evaluate('__failWrite=false')
    passed('Aborted image write does not create false success or activate missing card')
    page.click('#get-all-characters');page.wait_for_function('!characterJob && characterCount()===20',timeout=30000)
    assert page.evaluate('__imageCalls.filter(x=>x==="pororo").length')==1
    assert page.evaluate('readyWords().length')==72
    assert page.evaluate('media.has("photo:cat")')
    passed('Batch downloads missing entries only; all 20 generated test fixtures saved')
    page.evaluate('Promise.all(WORDS.filter(w=>w.category==="characters").map(w=>new Promise((yes,no)=>{let i=new Image();i.onload=()=>yes(true);i.onerror=no;i.src=characterURI(w)})))')
    assert page.evaluate('Array.from(document.querySelectorAll("[data-tab]")).every(b=>!b.disabled)')
    page.evaluate('closeParents();settings.category="characters";settings.characterSeries="babyshark";saveSettings();renderHome();startSession()')
    assert page.evaluate('session.pool.length')==11
    assert page.evaluate('session.deck.every(w=>w.series==="babyshark")')
    assert page.locator('#picture-swap').count()==0
    assert '\uc6d0\ubcf8' in page.locator('.picture-tag').inner_text()
    passed('Series filter selects 11 sharks; only prepared cards; image label and photo-toggle separation')
    page.evaluate('AudioEngine.stop();session=null;renderHome();showParents("characters")')
    page.click('[data-character-edit="pororo"]')
    page.evaluate('pendingFileAction={type:"photo",id:"pororo"}')
    page.set_input_files('#image-input',{'name':'custom.png','mimeType':'image/png','buffer':png()})
    page.wait_for_function('media.has("photo:pororo")')
    assert page.evaluate('characterURI(WORD_MAP.get("pororo"))===media.get("photo:pororo")')
    assert page.evaluate('settings.picture')=='diorama'
    assert not page.evaluate('shouldPhoto(WORD_MAP.get("cat"))')
    passed('Custom character overrides original independently; ordinary cat stays uniform')
    page.evaluate('closeParents();showParents("studio")')
    page.click('[data-record="word:dog"]');page.wait_for_function('recordState==="recording"')
    page.wait_for_timeout(1100);page.click('[data-record="word:dog"]')
    page.wait_for_function('recordState==="idle" && media.has("word:dog")',timeout=15000)
    parent_audio=page.evaluate('media.get("word:dog")')
    assert page.evaluate('!!mediaMeta.get("word:dog").verifiedAt')
    page.evaluate('__spoken=[]');page.click('[data-listen="word:dog"]');page.wait_for_timeout(250)
    assert not page.evaluate('__spoken')
    assert '\ub179\uc74c' in page.evaluate('AudioEngine.lastSource')
    page.evaluate('closeParents();showParents("offline")')
    with page.expect_download() as got:page.click('#export-backup')
    backup_path=out/'backup-test.json';got.value.save_as(backup_path)
    backup=json.loads(backup_path.read_text())
    assert len([r for r in backup['media'] if r['id'].startswith('character:')])==20
    assert any(r['id']=='word:dog' for r in backup['media'])
    assert page.evaluate('(raw)=>validateBackup(raw).media.length',backup)==len(backup['media'])
    passed('Real MediaRecorder synthetic signal encodes; parent plays ahead of TTS; character images included in backup')
    rows=page.evaluate('[...__testRows.values()]');settings=page.evaluate('settings')
    second=context.new_page();second.on('pageerror',lambda e:errors.append(str(e)))
    second.set_content(fixture(rows,settings,False));second.wait_for_selector('#start')
    assert second.evaluate('characterCount()')==20
    assert second.evaluate('media.get("word:dog")')==parent_audio
    assert second.evaluate('characterURI(WORD_MAP.get("pororo"))===media.get("photo:pororo")')
    second.evaluate('settings.category="characters";settings.characterSeries="pororo";startSession()')
    assert second.evaluate('session.pool.length')==9
    assert second.locator('#big-card img').get_attribute('src').startswith('data:image/')
    assert second.evaluate('__imageCalls.length')==0
    passed('Reopen with persisted-row fixture and offline flag displays nine Pororo entries without network (not installed-PWA test)')
    second.evaluate('AudioEngine.stop();session=null;renderHome()')
    for width,height,name in [(390,844,'iphone'),(820,1180,'ipad')]:
        second.set_viewport_size({'width':width,'height':height})
        second.evaluate('showParents("characters")')
        second.screenshot(path=str(out/(name+'-characters-test-fixtures.png')),full_page=True)
        assert second.evaluate('document.querySelector("#parents-dialog").scrollWidth<=innerWidth')
        second.evaluate('closeParents();settings.category="animals";renderHome()')
        second.screenshot(path=str(out/(name+'-home-v13.png')),full_page=True)
        assert second.evaluate('document.documentElement.scrollWidth<=innerWidth')
    passed('390px and 820px layout: no horizontal overflow')
    assert not errors,errors
    passed('No uncaught browser JavaScript errors in exercised flows')
    browser.close()
(out/'characters-report.json').write_text(json.dumps({'passed':results,'limitations':['IndexedDB and device speech simulated','External original images replaced with arbitrary test fixtures','Local navigation was blocked by browser policy; no real installed-service-worker test','No live Vercel, physical iPhone/iPad, or parent microphone test']},indent=2))
