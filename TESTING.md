# 검증 기록
검증일: 2026-09-08. 이 문서는 제작 환경에서 실제로 확인한 범위와 미확인 범위를 구분합니다.

## 확인한 사항
- JavaScript 구문 검사: app.js, sw.js.
- Python 구문 검사: build.py, start.py, make_voice_pack.py.
- Linux Chromium의 격리 HTML 환경: 자동 점검 18항목 통과.
- 화면 크기: 390px, 820px, 1180px. 실제 iPhone/iPad 장치가 아닌 브라우저 화면 크기 모사.
- 아이 이름 선택, 기본 카드 46장·주제 6개, 네 가지 놀이, 이전/다음, 사진/그림 전환.
- 틀렸을 때 다시 찾기, 자동 다음 카드로 넘기지 않음, 잠시 멈춤, 부모 길게 누르기, 설정 반영.
- 사진 선택 및 축소 후 JPEG 변환: **메모리 모의 저장소**를 사용. 실제 IndexedDB 저장 확인이 아닙니다.
- 백업 입력의 잘못된 키와 SVG 데이터 거부, 범위를 벗어난 설정 보정.
- 시간 종료 후 화면 밖 놀이 안내, 원격 한국어 음성 제외, 잡히지 않은 JavaScript 오류 0개.
- 실제 sw.js를 Node.js VM에서 실행한 CacheStorage 모의 테스트 5항목 통과.
  기본 파일 5개 저장, 자체 이전 버전 캐시만 정리, 모의 오프라인 경로, 외부 출처 제외, 하위 경로 배포 범위.
- 음성팩 생성기의 --list-only 실행: 276개 항목 확인.

## 아직 확인하지 못한 사항
실제 iPhone/iPad Safari 및 홈 화면 앱, 한국어 시스템 음성의 존재·품질·오프라인 사용,
실제 마이크/녹음 코덱, Web Audio 첫 재생 지연, 실제 IndexedDB 영구 저장,
실제 브라우저 Service Worker 설치와 종료 후 비행기 모드 재실행, 사과·바나나 사진 다운로드,
macOS say/afconvert를 이용한 전체 음성팩 생성.

제작 환경의 네트워크·마이크 제한 때문에 실제 HTTPS 탐색 대신 격리 HTML 테스트를 사용했습니다.
모의 테스트 통과를 실기기 검증이나 실제 오프라인 재실행 성공으로 해석하면 안 됩니다.

## 재현
앱 자체에는 npm이나 테스트 도구 설치가 필요 없습니다. 아래는 개발자가 테스트를 다시 실행할 때만 필요합니다.

```
python3 build.py
node --check app.js
node --check sw.js
node tests/test_sw.js
python3 make_voice_pack.py --list-only
```

격리 UI 테스트에는 Python Playwright, Pillow, Chromium이 필요합니다.
```
python3 -m pip install playwright pillow
python3 -m playwright install chromium
python3 tests/test_dom.py
```
시스템 Chromium이 있으면 자동 선택합니다. 다른 경로는 CHROME_BIN 환경변수로 지정할 수 있습니다.
테스트 결과와 화면은 test-output/에 생성됩니다. 이것은 앱에 포함되는 가족 데이터가 아닙니다.
