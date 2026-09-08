
#!/usr/bin/env python3
"""Optional macOS-only local audio-pack builder. No cloud TTS or Python packages.
Requires an installed Korean macOS voice and the built-in say / afconvert commands.
Actual macOS execution has not been validated in the creation environment.
"""
import argparse, base64, hashlib, json, re, shutil, subprocess, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
def main():
    parser=argparse.ArgumentParser(description="말랑말랑 낱말정원: Mac의 한국어 음성으로 오프라인 음성팩 만들기")
    parser.add_argument("--voice",help="설치된 macOS 한국어 음성 이름 (예: Yuna)")
    parser.add_argument("--rate",type=int,default=175,help="say의 말하기 속도 (기본 175)")
    parser.add_argument("--output",type=Path,default=HERE/"word-garden-voice-pack.json")
    parser.add_argument("--list-only",action="store_true",help="만들 음성 목록만 출력; 어느 OS에서든 가능")
    args=parser.parse_args()
    if not 100<=args.rate<=240:
        parser.error("--rate는 100~240 범위로 지정하세요.")
    content=json.loads((HERE/"content.json").read_text(encoding="utf-8"))
    profiles={"seol":"은설아","chae":"은채야","both":"은설아, 은채야"}
    texts={f"name:{k}":f"{v}, 같이 놀자." for k,v in profiles.items()}
    texts.update({"system:pair":"같은 그림을 찾아볼까?","system:again":"같이 한 번 더 살펴볼까?","system:test":"안녕. 사과. 바나나."})
    for w in content["words"]:
        texts[f"word:{w['id']}"]=w["label"]
        texts[f"phrase:{w['id']}"]=w["phrase"]
        for k,v in profiles.items():
            texts[f"ask:{w['id']}:{k}"]=f"{v}, {w['label']} 어디 있을까?"
    if args.list_only:
        for k,t in texts.items(): print(k,t)
        print(f"총 {len(texts)}개")
        return
    if sys.platform!="darwin" or not shutil.which("say") or not shutil.which("afconvert"):
        raise SystemExit("이 선택 도구는 Mac 전용입니다. 앱 자체는 아이폰·아이패드에서 기기 음성으로 사용할 수 있습니다.")
    output=subprocess.run(["say","-v","?"],capture_output=True,text=True,check=True).stdout
    choices=[]
    for line in output.splitlines():
        m=re.match(r"^(.*?)\s+ko[_-]KR\b",line,re.I)
        if m: choices.append(m.group(1).strip())
    voice=args.voice or (choices[0] if choices else None)
    if not voice:
        raise SystemExit("Mac에서 한국어 음성을 찾지 못했습니다. 시스템 설정의 손쉬운 사용 음성 메뉴에서 한국어 음성을 설치하세요.")
    if voice not in choices:
        raise SystemExit("지정한 한국어 음성을 설치 목록에서 찾지 못했습니다. 사용 가능: "+", ".join(choices))
    cache=HERE/(".voice-cache-"+hashlib.sha256(f"{voice}:{args.rate}".encode()).hexdigest()[:10])
    cache.mkdir(exist_ok=True)
    entries=[]
    for i,(key,text) in enumerate(texts.items(),1):
        stem=hashlib.sha256((key+":"+text).encode()).hexdigest()[:24]
        aiff=cache/(stem+".aiff")
        m4a=cache/(stem+".m4a")
        print(f"[{i}/{len(texts)}] {text}",flush=True)
        if not m4a.exists() or m4a.stat().st_size<100:
            try:
                subprocess.run(["say","-v",voice,"-r",str(args.rate),"-o",str(aiff),text],check=True,timeout=90)
                subprocess.run(["afconvert","-f","m4af","-d","aac","-b","64000",str(aiff),str(m4a)],check=True,timeout=40)
                aiff.unlink(missing_ok=True)
            except (subprocess.SubprocessError,OSError) as e:
                m4a.unlink(missing_ok=True)
                raise SystemExit(f"음성 생성 실패: {text}\n{e}\n같은 명령을 다시 실행하면 이미 생성한 파일은 재사용합니다.")
        value="data:audio/mp4;base64,"+base64.b64encode(m4a.read_bytes()).decode("ascii")
        entries.append({"id":key,"value":value})
    defaults={"profile":"seol","mode":"cards","category":"animals","count":6,"minutes":3,"choices":2,"rate":.88,"picture":"mixed","autoRead":True,"cues":True,"showLabels":False,"voiceURI":""}
    payload={"schema":1,"app":"word-garden","settings":defaults,"media":entries,"voicePack":{"voice":voice,"rate":args.rate}}
    args.output.write_text(json.dumps(payload,ensure_ascii=False),encoding="utf-8")
    size=args.output.stat().st_size
    if size>45*1024*1024:
        raise SystemExit("만들어진 파일이 앱의 45MB 가져오기 한도를 넘었습니다. 음성 또는 출력 설정을 조정해야 합니다.")
    print(f"\n완료: {args.output}\n{size/1024/1024:.1f}MB. 파일을 아이폰·아이패드로 옮기고 앱의 부모 설정 > 오프라인 > 백업 불러오기에서 선택하세요.")
    print("불러오면 이름·낱말·두 낱말·찾기 질문·반복 안내에 저장된 음성을 사용합니다.")
if __name__=="__main__":
    main()
