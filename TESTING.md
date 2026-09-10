# v1.6.2 checks - explicit limitations

## Image scope
Only the truck is a new native high-resolution illustration (1448 x 1086).
Lossless WebP has been verified pixel-for-pixel against the PNG output.
Other 219 general cards and 24 character originals are unchanged.
This is not a completed 220-card high-resolution release.

## Reproduced bug
v1.6.0 matching target container measured 110 x 110 CSS px.
The nested image viewport was 130 x 130 and extended outside its parent.

## Browser tests executed
Chromium via Playwright, isolated about:blank document.
Real bundled assets loaded as Blob URLs solely for the test harness.
Viewports: 320x568, 375x667, 390x844, 430x932, 820x1180,
1024x1366, 844x390, 1180x820, 1366x900. Device scale factor 2.
244 visible cards in all four modes, with both two and three answer choices.
13,176 card layouts checked against actual DOM bounds: zero overflow failures.
Parent editor and document horizontal overflow checks passed.
No uncaught JavaScript errors.
Correct-answer gate: next and right arrow blocked before answer; wrong answer
stays; correct answer enables next; passed.
Photo resize: 2400x1800 -> 1600x1200; 1800x2400 -> 1200x1600;
300x200 unchanged. These were synthetic browser-generated test images.

## Cache simulation (not real PWA/iOS)
42 CORE assets exist, including assets/hd/truck.webp.
VM simulation of install/activate/fetch: HD file served from cache;
missing HD file rejects install and discards incomplete new cache;
previous app cache remains available after failed install;
unrelated cache preserved; /api/ excluded.

## Preservation and packaging
Original word IDs, spoken phrases/questions and recording/audio functions retained.
Only truck art reference and app version modified within existing content.
New HD metadata added; original character files and all API files byte-identical.
All JSON and JavaScript parsed; all runtime image/cache paths checked.
ZIP member paths and CRC integrity verified.

## Not tested
Actual iPhone/iPad Safari, physical taps/rotation, microphone, cloud restore,
Vercel deployment, browser quota/eviction, and installed PWA offline restart.
Browser emulation and cache mocks do not establish real-device correctness.
