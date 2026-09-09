
"""Browser UI tests. Storage/voices are simulations; MediaRecorder is real.
Navigation is restricted in this environment; no physical iOS/offline installation
is claimed. SVGs are embedded only in the test fixture, not in the deployment."""
from pathlib import Path
import base64,json,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
out=root/"test-output";out.mkdir(exist_ok=True)
reports=[]
def ok(name,detail=""):
    reports.append({"test":name,"status":"passed","detail":detail});print("PASS",name,flush=True)
def fixture(seed=None):
    html=(root/"index.html").read_text()
    html=re.sub(r'assets/cards/([a-z0-9_-]+)\.svg',lambda m:"data:image/svg+xml;base64,"+base64.b64encode((root/m.group(0)).read_bytes()).decode(),html)
    support="window.__SEED_ROWS__="+json.dumps(seed or [])+";\n"+(root/"tests"/"fixture.js").read_text()
    return html.replace('<script type="application/json"',"<script>"+support+"</script><script type=\"application/json\"",1)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--autoplay-policy=no-user-gesture-required"])
    ctx=b.new_context(viewport={"width":820,"height":1180},accept_downloads=True)
    page=ctx.new_page();page.set_default_timeout(8000);errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
    page.set_content(fixture());page.wait_for_selector("#start")
    assert page.evaluate("readyWords().length")==52
    assert page.locator(".category").count()==6
    assert page.evaluate("CATS.map(c=>c.label)")==["동물","과일","야채","탈것","음식","캐릭터"]
    assert page.evaluate("Object.fromEntries(CATS.map(c=>[c.id,readyWords(c.id).length]))")==dict(animals=12,fruit=8,vegetables=10,vehicles=12,food=10,characters=0)
    ok("Six categories; 52 active ordinary cards before character preparation")
    page.evaluate("Promise.all(WORDS.map(w=>new Promise((yes,no)=>{const i=new Image();i.onload=()=>yes();i.onerror=no;i.src=w.art})))")
    ok("52 illustrations and neutral character placeholder decode")
    assert page.evaluate("AudioEngine.voices.length")==2
    page.evaluate('showParents("voices")')
    assert page.locator("[data-ai-voice]").count()==6
    assert page.locator("[data-style]").count()==5
    page.click('[data-style="calm"]');page.click("#preview-device");page.wait_for_timeout(150)
    assert page.evaluate("__spoken.at(-1).rate")==.82
    assert page.evaluate("__spoken.at(-1).pitch")==.9
    ok("Two simulated local Korean voices; remote excluded; five styles; six AI choices")
    page.evaluate('closeParents();session=null;renderHome()')
    for mode in ["cards","find","phrase","pair"]:
        page.evaluate("(m)=>{settings.mode=m;settings.category='vegetables';startSession()}",mode)
        assert page.locator(".play-app").is_visible()
        if mode in ["cards","phrase"]:assert page.locator("#big-card img").count()==1
        else:
            assert page.locator("[data-answer]").count()==2
            target=page.evaluate("session.deck[session.index].id")
            page.click('[data-answer="'+target+'"]')
            assert page.evaluate("session.answer")
        page.click("#next");assert page.evaluate("session.index")==1
        page.evaluate("AudioEngine.stop();session=null;renderHome()")
    ok("All four play modes and navigation")
    page.evaluate("showParents('studio')")
    page.click('[data-record="word:dog"]')
    page.wait_for_function("recordState==='recording'")
    assert page.locator("#close-parents").is_disabled()
    page.wait_for_timeout(1150)
    page.click('[data-record="word:dog"]')
    # During commit/readback the app must not announce successful save.
    assert page.evaluate("recordState") in ["stopping","saving"]
    page.wait_for_function("recordState==='idle'&&media.has('word:dog')",timeout=12000)
    assert page.evaluate("!!mediaMeta.get('word:dog').verifiedAt")
    assert page.evaluate("mediaMeta.get('word:dog').bytes>150")
    assert page.locator(".record-success audio").count()==1
    saved=page.evaluate("media.get('word:dog')")
    ok("Actual MediaRecorder encodes generated test signal; commit/readback completion controls success")
    page.evaluate("__spoken=[]")
    page.click('[data-listen="word:dog"]');page.wait_for_timeout(250)
    assert page.evaluate("__spoken.length")==0
    assert "녹음" in page.evaluate("AudioEngine.lastSource")
    ok("Saved parent clip plays without TTS call")
    page.evaluate("__failWrite=true")
    page.click('[data-record="word:dog"]');page.wait_for_function("recordState==='recording'")
    page.wait_for_timeout(900);page.click('[data-record="word:dog"]')
    page.wait_for_function("recordState==='error'&&!!pendingRecording")
    assert page.evaluate("media.get('word:dog')")==saved
    assert page.locator("#rescue-record-file").is_visible()
    assert page.locator("#close-parents").is_disabled()
    assert not page.locator(".record-success").count()
    ok("Simulated disk-full abort preserves previous clip and exposes rescue/retry; no false success")
    page.evaluate("__failWrite=false")
    page.click("#retry-record-save");page.wait_for_function("recordState==='idle'&&!pendingRecording")
    assert page.evaluate("mediaMeta.get('word:dog').previous") ==saved
    page.click("#restore-previous");page.wait_for_timeout(250)
    assert page.evaluate("media.get('word:dog')")==saved
    ok("Retry saves pending take; previous parent take can be restored")
    page.evaluate('closeParents();parentTab="voices";showParents("voices");settings.aiVoice="coral";settings.voiceSource="ai";renderVoices();aiToken="a".repeat(40)')
    # Replace fetch with a local fixture only for explicit AI preparation.
    page.evaluate("""() => {
      const original=window.fetch;
      window.fetch=async (url,options)=>{
       if(url==='/api/speech'){
        __networkCalls.push(JSON.parse(options.body));
        return new Response(uriToBlob(media.get('word:dog')),{status:200,headers:{'Content-Type':'audio/mp4'}});
       }
       return original(url,options);
      };
    }""")
    page.click(".ai-setup summary")
    page.click("#make-ai-sample")
    page.wait_for_function("!aiJob&&media.has('ai:coral:system:test')")
    assert page.evaluate("__networkCalls.length")==1
    page.click("#make-ai-sample");page.wait_for_timeout(100)
    assert page.evaluate("__networkCalls.length")==1
    page.evaluate("putMedia('ai:coral:word:dog',media.get('word:dog'),{source:'ai'})")
    page.evaluate("__spoken=[];void AudioEngine.say('강아지','word:dog')")
    page.wait_for_timeout(250)
    assert "부모" in page.evaluate("AudioEngine.lastSource")
    assert page.evaluate("__networkCalls.length")==1
    assert page.evaluate("__spoken.length")==0
    ok("AI explicit preparation cached; repeat skips paid request; parent overrides selected AI; no API during playback")
    page.evaluate("AudioEngine.stop()")
    assert page.evaluate("validateSettings({category:'cars'}).category")=="vehicles"
    assert page.evaluate("validateBackup({app:'word-garden',schema:1,settings:{category:'cars'},media:[{id:'word:mom',value:media.get('word:dog')},{id:'word:carrot',value:media.get('word:dog')}] }).media.length")==2
    invalid=page.evaluate("""()=>{try{validateBackup({app:'word-garden',schema:2,media:[{id:'word:dog',value:'javascript:bad'}]});return false}catch{return true}}""")
    assert invalid
    ok("Legacy cars category and removed people recordings accepted; corrupt backup rejected")
    page.evaluate("putMedia('word:mom',media.get('word:dog'),{source:'legacy'})")
    rows=page.evaluate("[...__testRows.values()]")
    second=ctx.new_page();second.set_content(fixture(rows));second.wait_for_selector("#start")
    assert second.evaluate("media.has('word:dog')&&media.has('word:mom')&&media.has('ai:coral:system:test')")
    assert second.evaluate("media.get('word:dog')")==saved
    ok("Reopen with simulated persisted rows restores parent, legacy and AI clips")
    second.evaluate("showParents('offline')")
    with second.expect_download() as d:
        second.click("#export-backup")
    path=out/"test-backup.json";d.value.save_as(path)
    backup=json.loads(path.read_text());assert backup["schema"]==2
    assert any(x["id"]=="word:mom" for x in backup["media"])
    assert "aiToken" not in path.read_text()
    ok("Backup includes legacy and AI media, not server tokens")
    # Screen captures and layout checks.
    second.evaluate("closeParents();session=null;renderHome()")
    for width,height,name in [(820,1180,"ipad"),(390,844,"iphone")]:
        second.set_viewport_size({"width":width,"height":height})
        second.screenshot(path=str(out/(name+"-home.png")),full_page=True)
        assert second.evaluate("document.documentElement.scrollWidth<=innerWidth")
        for tab in ["studio","voices"]:
            second.evaluate("(tab)=>showParents(tab)",tab)
            second.screenshot(path=str(out/(name+"-"+tab+".png")),full_page=True)
            assert second.evaluate("document.querySelector('#parents-dialog').scrollWidth<=innerWidth")
            second.evaluate("closeParents()")
        second.click("#start")
        second.screenshot(path=str(out/(name+"-play.png")),full_page=True)
        assert second.evaluate("document.documentElement.scrollWidth<=innerWidth")
        second.evaluate("session=null;renderHome()")
    ok("390px iPhone and 820px iPad layouts: home/play/recording/voice panels")
    assert not errors,errors
    ok("No browser JavaScript errors in exercised flows")
    b.close()
(out/"browser-report.json").write_text(json.dumps({"results":reports,"limitations":["IndexedDB transport and device voices simulated","MediaRecorder used a generated sine signal, not physical microphone","No real iPhone/iPad, installed PWA, or live OpenAI API test"]},ensure_ascii=False,indent=2))
