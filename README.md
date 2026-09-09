# 말랑말랑 낱말정원 v1.3.0

## 무엇이 달라졌나요?

캐릭터를 AI로 다시 그리지 않고, 확인한 원본 이미지를 받아 저장하도록 변경했습니다. 일반 카드 52장과 캐릭터 20명, 최대 72장으로 놀 수 있습니다.

## 먼저 알아두세요

ZIP에 원본 캐릭터 이미지 파일 20장이 미리 들어 있는 방식은 아닙니다. 배포 후 앱에서 처음 한 번 온라인으로 받아야 합니다. 성공적으로 저장된 이미지는 이후 오프라인으로 사용합니다. 처음에는 준비된 일반 카드 52장만 나옵니다.

## 1. 기존 목소리와 사진 백업

기존 앱에서 부모 → 저장·백업 → 백업 파일 저장을 눌러주세요. 이전 버전에서는 탭 이름이 오프라인일 수 있습니다. 업데이트를 위해 Safari 데이터를 삭제하거나 홈 화면 앱을 지우지 마세요. 앱의 저장소 이름과 기존 녹음 키는 그대로 유지했습니다.

## 2. GitHub → Vercel 업데이트

ZIP을 풀고 안에 있는 모든 파일과 폴더를 기존 저장소 최상위에 올려주세요. index.html만 교체하면 안 됩니다. api/character.js, character-sources.json, vercel.json, sw.js, assets도 함께 올리세요. 기존 Other / Build Command 비움 / Output Directory . 설정을 유지합니다. 이 ZIP은 수정본이며, 이미 사용자님 계정에 배포된 것은 아닙니다.

## 3. 새 버전 확인

계속 같은 운영 주소를 사용하세요. 온라인에서 부모 → 저장·백업 → 새 버전 확인을 누르고 앱을 완전히 닫았다 다시 열어 v1.3.0을 확인하세요.

## 4. 원본 20장 받기

부모 버튼 1.2초 길게 누르기 → 캐릭터 → 원본 20장 받기. 저장소에 쓴 뒤 다시 읽어 확인한 항목만 완료로 표시합니다. 전부 받으면 20 / 20입니다. 중간에 실패하면 다시 눌러 빠진 원본만 받으세요. 기존 사진과 녹음은 덮어쓰지 않습니다.

## 5. 이미지 설정은 따로

동물·과일·야채·탈것·음식은 기본 그림으로 통일합니다. 기존 고양이 사진은 지우지 않고 보관하되, 버전 변경 후 첫 설정은 그림 우선으로 설정합니다. 캐릭터는 부모가 넣은 이미지 → 저장된 원본 순서로 표시합니다. 일반 카드의 사진 설정을 변경할 필요가 없습니다.

## 6. 내 이미지로 바꾸기

부모 → 캐릭터 → 해당 캐릭터의 내 그림도 넣기 / 녹음 → 내 사진 등록. JPG/PNG를 선택하면 바로 적용됩니다. 등록 이미지를 삭제하면 저장된 원본으로 돌아갑니다. 기존 20명의 이미지 교체를 지원하며, 새 캐릭터 이름의 자유 추가는 아직 지원하지 않습니다.

## 7. 소리와 오프라인 확인

받은 캐릭터 그림은 목소리 파일이 아닙니다. 음성은 기존처럼 부모 녹음 → 준비된 AI 음성 → 기기 음성 순서입니다. 이미지 받기에는 API 키가 필요 없지만 AI 음성 생성은 기존처럼 별도 설정과 비용이 필요합니다. 비행기 모드에서 앱을 닫았다 다시 열어 그림과 녹음을 각각 확인하세요. 아이폰과 아이패드는 각각 저장하거나 백업으로 옮겨야 합니다.

## 실패했을 때

api 폴더 배포 확인이면 api/character.js가 함께 배포됐는지 확인하세요. 원본 받기 또는 저장 실패는 원본 서버 응답, 네트워크, 기기 저장소 문제일 수 있습니다. 실패 상태를 완료로 표시하지 않습니다. 받기가 계속 실패하면 같은 카드에 직접 이미지를 넣을 수 있습니다.

## 확인한 범위와 아직 남은 확인

화면·녹음·저장 실패 처리·백업·캐시·API 검사를 실행했습니다. 저장소와 원격 응답은 모의 환경을 포함합니다. 실제 Vercel에서의 원본 다운로드, 아이폰·아이패드의 마이크와 오프라인 재실행은 아직 확인하지 못했습니다. 그림을 받은 후의 테스트 화면은 실제 캐릭터 원본이 아닌 검사용 도형으로 확인했습니다.

## 확인한 캐릭터

**뽀로로 9명**: 뽀로로, 크롱, 루피, 에디, 포비, 패티, 해리, 로디, 통통이

**아기상어 11명**: 아기상어 올리, 아빠 상어, 엄마 상어, 할아버지 상어, 할머니 상어, 윌리엄, 치치, 레이, 쌩쌩이, 몰라몰라, 레오

뽀로로파크 요청 페이지는 열리지 않아 아이코닉스 공식 자료로 대신 확인했습니다. 아기상어는 사용자가 보내준 With HS 게시물에서 이름과 이미지를 확인했습니다. 블로그 글에 표시된 이미지 출처는 KBS입니다. 앱은 설명 글자 부분을 제외하고 캐릭터 영역을 잘라 표시합니다. 모습을 새로 생성하지 않습니다.
네이버 링크는 본문을 확인할 수 없어 미반영입니다. 해당 글의 캐릭터를 추측해 넣지 않았습니다.
이미지의 별도 이용허락을 확보한 것은 아닙니다. 출처를 표기했다고 공개 배포 또는 상업적 사용에 대한 허락을 의미하지 않습니다.

## Technical layout

- Runtime: static `index.html` + generated `sw.js`; two Node Vercel Functions in `api/`.
- Source: `app.js`, `audio.js`, `storage.js`, `recording.js`, `voices.js`, `characters.js`, `styles.css`, `content.json`, `template.html`.
- `python3 build.py` regenerates `index.html`, `speech-content.json` (366 fixed phrases) and `sw.js` (58 unique core files).
- `character-sources.json`: 20 fixed public image URLs, attribution, expected source crop rectangles and series labels.
- `/api/character?id=pororo` relays only allowlisted images. It does not accept arbitrary URLs, text, credentials or user media. It enforces HTTPS, known image identity, redirect validation, response byte/type checks and timeouts.
- For Tistory, signed links are refreshed from the supplied public mobile article. A signature is never removed or bypassed. Source removal or layout changes can still cause failures.
- Source images are normalized locally onto a 640 x 640 white canvas. Shark character areas are cropped from the article screenshots; no generative image service is used.
- Prepared artwork is stored under `character:<id>`, separate from custom `photo:<id>` and audio. Rendering and gameplay do not fetch remote images after preparation.
- The IndexedDB database name/version remains `word-garden` / 1. Existing media key IDs, including the original eight character IDs, are unchanged. One-time `picturePolicy:2` migration sets ordinary cards to the uniform art without deleting saved photos.
- Ready-card count initially 52; max 72. Only characters with prepared images or parent-added images participate.
- Character series filters: all, pororo (9), babyshark (11).
- Backup schema stays 2 and accepts schema 1. New character artwork is included in backup/restore; tokens are never included.

## Optional speech (unchanged from v1.2)

Image preparation needs NO OpenAI key or parent token. Existing optional AI speech still requires the following SERVER environment variables in Vercel:

```
OPENAI_API_KEY=<your-project-key>
WORD_GARDEN_PARENT_TOKEN=<at-least-32-random-characters>
```

Never commit those secrets. Only the parent token (not the API key) is entered in the parent's speech generation UI. Paid provider speech is explicitly generated on request, not in gameplay. The ZIP does not contain synthesized speech files. An unprepared AI voice falls back to local device speech; the UI shows zero saved items as unprepared.

## Tests

```
python3 tests/test_characters_browser.py
python3 tests/test_general.py
node tests/test_characters_api.js
node tests/test_api.js
node tests/test_sw.js
```

Python tests require Playwright, Pillow and Chromium. The browser executable path is `/usr/bin/chromium`; adjust it for another environment. Browser navigation was blocked in the build environment, so tests use in-memory documents, simulated IndexedDB transport and simulated network responses. Actual image decode/crop/encode and MediaRecorder encoding ran in Chromium. Do not treat that as proof of physical iOS storage durability or deployed original-image availability. See TESTING.md.

This package is not deployed to any user account. A local Python static server supports UI checks only; it cannot execute Vercel `/api/` endpoints. Deploy the complete folder to test original-image preparation.
