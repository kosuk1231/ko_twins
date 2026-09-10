# v1.6.0 release checks

검사일: 2026-09-10. 배포 ZIP은 55개 파일입니다.

## 수행 환경과 제한
- JavaScript 문법: Node.js 22.
- 브라우저: Chromium에서 격리된 HTML을 렌더링했습니다. 그림은 테스트용 문서에서만 데이터 URI로 공급했습니다.
- 브라우저의 외부·로컬 URL 직접 탐색이 관리자 정책으로 제한되어, 실제 서비스 워커 등록이나 실제 IndexedDB 보존을 이 환경에서 검증했다고 주장하지 않습니다.
- 화면·버튼·키보드·부모 패널은 실제 앱의 코드로 실행했습니다.
- 저장 테스트는 모의 저장소, 음성 테스트는 인공 데이터, 확대 방지 테스트는 합성 터치 이벤트입니다.
- 캐시 테스트는 Node VM의 모의 CacheStorage / Request / fetch로 앱의 원본 sw.js를 실행했습니다.
- 복구 페이지는 실제 HTML/DOM 코드와 모의 fetch / ServiceWorker를 사용했습니다.
- API 테스트는 유효하지 않은 테스트 자격증명으로 오류 처리를 확인했으며, OpenAI나 Vercel Blob에 요청하지 않았습니다.
- 아래 테스트용 모의 구현은 배포 index.html에 들어 있지 않습니다.

## 통과한 검사
1. Startup: 12 categories, 244 ready cards, no render error
2. All 244 approved labels, phrases, image paths and coordinates match
3. 12 topics x 4 games; wrong answers and keyboard cannot bypass answer gate — 48
4. Timer waits for answer and explicit next; no automatic navigation
5. Parent audio priority, failed-save retention, previous take and backup restore (simulated store)
6. Backup import into independent test page (simulated store)
7. 6 viewport sizes, card display, parent panels, no horizontal overflow
8. Double-tap event guard and touch-action CSS active (synthetic gestures)
9. No uncaught JavaScript exceptions during UI checks
10. All 41 core files installed; includes 11 sprite sheets, 24 character originals
11. Activation removes only old word-garden app caches
12. Navigation and all core assets use cached content when simulated network is offline
13. Cloud/API/non-GET/cross-origin requests are not cached
14. Recovery page version protocol reports 1.6.0
15. Failed/missing sheet installation preserves old cache and prevents activation
16. Recovery success — Mock fetch/ServiceWorker; real recovery-page script and DOM
17. Recovery version-mismatch — Mock fetch/ServiceWorker; real recovery-page script and DOM
18. Recovery network-error — Mock fetch/ServiceWorker; real recovery-page script and DOM
19. Speech allowlist covers every new card and child profile
20. All 3 existing backend API implementations preserved byte-for-byte
21. Cloud and speech routes reject missing setup, invalid token, foreign origin and wrong method (no provider calls)

## 파일 검증
- 일반 220장 및 기본 캐릭터 24장의 이름/문구/이미지 경로/스프라이트 좌표가 검토한 도감과 같습니다.
- 11개 일반 이미지 시트는 승인된 파일과 바이트 단위로 동일합니다.
- 24개 캐릭터 원본은 v1.5.1의 파일과 바이트 단위로 동일합니다.
- 기존 3개 서버 API 구현은 v1.5.1과 동일합니다. 신규 음성 문구의 허용 목록만 확장했습니다.
- 필수 캐시 리소스는 중복을 제거한 41개이고, 모두 ZIP 안의 실제 파일에 연결됩니다.
- package.json, 앱 데이터, sw.js, 복구 페이지는 v1.6.0을 가리킵니다.
- 모의 테스트 플래그나 모의 저장소는 배포본에 주입하지 않았습니다.
- ZIP CRC 무결성과 파일 경로를 확인했습니다.

## 배포 후 실기기 검사
최신 Vercel 배포 Ready → 동일 운영 주소에서 v1.6.0 확인 → 부모 녹음 재생 →
온라인 상태의 화면 저장 완료 → 앱 종료 → 비행기 모드 재실행 → 그림·소리 확인.
클라우드를 사용하는 경우 별도의 두 번째 기기에서 백업 복원도 점검하세요.
