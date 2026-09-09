# Verification - v1.3.0

## Executed tests

- `test_characters_browser.py`: 12 checks. Catalogue/readiness, legacy image-setting migration, commit/read-back application, source failure, storage failure, selective retry, 20-item batch flow, series filtering, custom-image precedence, parent recording/backup regression, reopening seeded state without network, responsive layout and uncaught JS errors.
- `test_general.py`: 14 checks. Four game modes, voice option UI, actual MediaRecorder encoding of synthetic signal, simulated storage failure recovery, previous take restore, parent-audio priority, explicit AI preparation/cache flow, legacy media compatibility, backup validation and 390/820px layout.
- `test_characters_api.js`: 6 checks. Source inventory, fresh signed-link parsing, exact image identity/host validation, mocked image response/cache headers, invalid method/id/URL rejection, unsafe redirect/wrong content rejection, mocked page-refresh path.
- `test_api.js`: existing speech security regression; fixed 366-phrase allowlist and mocked provider.
- `test_sw.js`: file-backed CacheStorage simulation; 58 unique cached core assets, offline response logic, current-version replacement and API exclusion.

Outputs are copied into `tests/report-*.json` and `tests/report-*.txt`. Reports identify mocks. Screenshot fixtures and exported test backups are intentionally excluded from the deployment ZIP.

## Exactly what is simulated

Browser IndexedDB transactions, browser device voice list, remote image byte responses and remote speech provider responses are simulated. Test images are arbitrary shapes, not originals. Actual Chromium decodes and normalizes those fixtures. MediaRecorder encodes a generated oscillator stream, not a human microphone. A new document seeded with stored rows tests rehydration logic; it is not a true browser persistence/relaunch test.

An attempted local-server browser navigation returned `ERR_BLOCKED_BY_ADMINISTRATOR`. No attempt was made to bypass that restriction. Consequently no installed-service-worker end-to-end test succeeded here; only the separate worker simulation was run.

## Still needs real-device / deployed verification

- Deploy all files to Vercel and check `/api/character` can retrieve source images.
- Verify crop framing and each real original after download; web source images were visually inspected, but their original bytes could not be downloaded into this build container.
- Verify 20/20 saved state, relaunch, airplane-mode artwork display and audio on both iPhone and iPad.
- Verify real microphone permission, parent recording save/read-back, playback latency and storage durability.
- Verify paid AI speech only after explicit provider credentials and authorization.
- Test future Tistory signed-link refresh and upstream site changes. Failures should be shown, not hidden.

No claim is made that these tests guarantee hardware behavior, unlimited persistence, zero delay, live Vercel availability, or image licensing.
