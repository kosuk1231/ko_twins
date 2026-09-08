
import json, os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
out=root/"test-output"
out.mkdir(exist_ok=True)
results=[]
errors=[]
def ok(name, extra=None):
    results.append({"test":name,"status":"passed","detail":extra})
    print("PASS",name,extra if extra is not None else "")
def parent(page,tab=None):
    page.locator("#parents").dispatch_event("pointerdown",{"button":0})
    page.wait_for_timeout(1280)
    page.locator("#parents").dispatch_event("pointerup")
    page.locator("#parents-dialog").wait_for(state="visible")
    if tab:
        page.locator(f'[data-tab="{tab}"]').click()
def home(page):
    page.evaluate("AudioEngine.stop();session=null;renderHome()")

with sync_playwright() as p:
 chrome=os.environ.get("CHROME_BIN") or shutil.which("chromium") or shutil.which("google-chrome")
 browser=p.chromium.launch(**({"executable_path":chrome} if chrome else {}),headless=True,args=["--no-sandbox"])
 ctx=browser.new_context(viewport={"width":1180,"height":980},device_scale_factor=1,permissions=["microphone"])
 page=ctx.new_page()
 page.on("pageerror",lambda e:errors.append(str(e)))
 page.set_content((root/"index.html").read_text(encoding="utf-8"),wait_until="load")
 page.locator("#start").wait_for()

 assert page.evaluate("wordGardenDiagnostics().readyCards")==46
 assert page.locator(".category").count()==6
 assert page.locator(".mode").count()==4
 assert page.locator("h1").inner_text()=="은설아, 오늘은 뭐 하고 놀까?"
 ok("Initial homepage: 46 usable words, six themes, four modes")
 page.screenshot(path=str(out/"home.png"),full_page=True)
 page.locator('[data-profile="chae"]').click()
 assert page.locator("h1").inner_text()=="은채야, 오늘은 뭐 하고 놀까?"
 assert page.evaluate("settings.profile")=="chae"
 ok("Child selection and natural Korean name ending")
 page.locator("#start").click()
 assert page.locator(".word-card").is_visible()
 page.evaluate("session.deck=[WORD_MAP.get('cat'),WORD_MAP.get('dog'),WORD_MAP.get('rabbit')];session.index=0;prepareRound();renderPlay()")
 assert page.locator("#big-card img").is_visible()
 page.locator("#picture-swap").click()
 assert page.locator("#big-card .emoji").is_visible()
 page.locator("#picture-swap").click()
 page.evaluate("document.querySelector('#toast').hidden=true"); page.screenshot(path=str(out/"play.png"),full_page=True)
 page.locator("#next").click()
 assert page.evaluate("session.index")==1
 page.locator("#previous").click()
 assert page.evaluate("session.index")==0
 ok("Card navigation, embedded photo, picture switch")
 page.locator("#pause").click()
 elapsed=page.evaluate("session.elapsed")
 page.wait_for_timeout(1000)
 assert page.evaluate("session.elapsed")==elapsed
 page.locator("#resume-play").click()
 assert page.evaluate("session.paused") is False
 ok("Pause freezes session timer")
 home(page)
 page.locator('[data-mode="find"]').click()
 page.locator("#start").click()
 ids=page.locator("[data-answer]").evaluate_all("(es)=>es.map(e=>e.dataset.answer)")
 target=page.evaluate("session.deck[session.index].id")
 assert len(ids)==2 and len(set(ids))==2 and target in ids
 wrong=next(i for i in ids if i!=target)
 page.locator(f'[data-answer="{wrong}"]').click()
 assert "한 번 더" in page.locator("#feedback").inner_text()
 assert page.evaluate("session.answer") is False
 page.locator(f'[data-answer="{target}"]').click()
 assert page.locator(".choice.correct").count()==1
 assert page.evaluate("session.index")==0
 ok("Find mode: distinct choices, gentle retry, no automatic advance")
 home(page)
 page.locator('[data-mode="phrase"]').click()
 page.locator("#start").click()
 assert page.locator(".phrase-label span").count()==2
 ok("Two-word phrase mode")
 home(page)
 page.locator('[data-mode="pair"]').click()
 page.locator("#start").click()
 assert page.locator(".match-target").is_visible()
 assert page.locator("[data-answer]").count()==2
 ok("Same-picture matching mode")
 parent(page,"settings")
 page.locator('[data-setting="count"]').select_option("4")
 page.locator('[data-setting="choices"]').select_option("3")
 assert page.evaluate("settings.count")==4
 page.locator("#close-parents").click()
 home(page)
 page.locator('[data-mode="find"]').click()
 page.locator("#start").click()
 assert page.locator("[data-answer]").count()==3
 assert page.evaluate("session.deck.length")==4
 ok("Long-press parental gate and in-session difficulty settings")
 home(page)
 page.evaluate("""()=>{
   putMedia=async(id,value)=>{media.set(id,value)};
   removeMedia=async(id)=>{media.delete(id)};
 }""")
 parent(page,"library")
 page.locator("#lib-category").select_option("characters")
 assert page.locator("[data-edit]").count()==8
 page.locator('[data-edit="pororo"]').click()
 from PIL import Image
 Image.new("RGB",(1200,800),"#ccaa66").save(out/"sample-upload.png")
 page.set_input_files("#image-input",str(out/"sample-upload.png"))
 # Set action separately because set_input_files does not press the picker button.
 page.evaluate("pendingFileAction={type:'photo',id:'pororo'}")
 page.set_input_files("#image-input",[])
 page.set_input_files("#image-input",str(out/"sample-upload.png"))
 page.wait_for_function("media.has('photo:pororo')")
 assert page.evaluate("readyWords('characters').length")==1
 assert page.evaluate("media.get('photo:pororo').startsWith('data:image/jpeg')") is True
 ok("Photo picker/resize with mocked media store activates a character template")
 # Delete placeholder test image; do not ship or show it as character artwork.
 page.locator("#delete-photo").click()
 page.wait_for_function("!media.has('photo:pororo')")
 assert page.evaluate("readyWords('characters').length")==0
 ok("Deleting a character image removes unavailable card from play")
 page.locator("#back-library").click()
 ok("Audio recorder UI exposed; hardware microphone test not run")
 # Validation rejects unknown keys and active content.
 assert page.evaluate("""()=>{try{validateBackup({app:'word-garden',schema:1,settings:{},media:[{id:'photo:cat',value:'data:image/svg+xml;base64,PHN2Zz4='}]});return false}catch{return true}}""")
 assert page.evaluate("""()=>{try{validateBackup({app:'word-garden',schema:1,settings:{},media:[{id:'__proto__',value:'a'}]});return false}catch{return true}}""")
 assert page.evaluate("validateBackup({app:'word-garden',schema:1,settings:{count:999},media:[]}).settings.count")==6
 ok("Backup input validation rejects SVG/unknown keys and invalid settings")
 page.locator("#close-parents").click()
 # Reset setting count for mobile layout screenshot.
 page.evaluate("settings={...DEFAULTS};saveSettings();renderHome()")
 page.set_viewport_size({"width":390,"height":844})
 page.evaluate("document.querySelector('#toast').hidden=true"); page.screenshot(path=str(out/"iphone.png"),full_page=True)
 assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
 ok("iPhone-size layout has no horizontal overflow")
 page.set_viewport_size({"width":820,"height":1180})
 page.screenshot(path=str(out/"ipad.png"),full_page=True)
 assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
 ok("iPad-size layout has no horizontal overflow")
 page.locator("#start").click()
 page.evaluate("session.deck=[WORD_MAP.get('cat')];session.index=0;prepareRound();renderPlay()")
 assert page.locator("#big-card img").evaluate("(img)=>img.complete&&img.naturalWidth>0")
 ok("Embedded photo renders without an image-network request")
 page.evaluate("session.elapsed=settings.minutes*60000-300;session.lastTick=performance.now()")
 page.wait_for_function("wordGardenDiagnostics().screen==='end'")
 assert "약속한 시간" in page.locator(".ending").inner_text()
 ok("Session timer leads to an off-screen play suggestion")
 # Never choose online voices.
 page.evaluate("""()=>{
  window.__testSpoken=[];
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{name:'remote Korean',voiceURI:'remote',lang:'ko-KR',localService:false}],cancel:()=>{},speak:u=>window.__testSpoken.push(u.text)}});
  AudioEngine.initVoices();
 }""")
 assert page.evaluate("AudioEngine.voice===null") is True
 ok("Remote Korean voices are not used")
 assert not errors,errors
 ok("No uncaught JavaScript errors",len(errors))
 report={"environment":"Headless Chromium set_content on Linux; isolated DOM tests (network navigation restricted), simulated 390/820/1180px viewports; NOT physical iPhone/iPad.","results":results,"pageErrors":errors,"notTested":["Physical iPhone/iPad","Apple Korean TTS voice quality/offline availability","Hardware audio latency","Photo-pack network download","Actual iOS microphone recording format","Real browser Service Worker installation/offline navigation","Real browser IndexedDB persistence"]}
 (out/"test-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
 browser.close()
