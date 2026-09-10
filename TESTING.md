# v1.7.1 verification

- 220 unique general-card paths. All 220 are actual SVG vectors without embedded raster images.
- All 220 SVGs passed XML/color/path checks, rasterization and browser image decoding.
- No assets/sheets, assets/hd, w.sprite or imageResolution references remain in index.html.
- 7 viewport sizes: 360x780, 390x844, 430x932, 844x390, 820x1180, 1180x820, 1200x1000.
- 1320 rendered card/mode/choice-count cases per viewport, 9240 total.
- Checked image and picture bounds, horizontal overflow, and the unanswered Next gate: no violations.
- Actual pointer clicks: Next disabled before selection, stays disabled after wrong answer, enabled after correct answer.
- No uncaught JavaScript errors in those rendering tests.
- All prior word identifiers, labels, phrases, prompts, character metadata and other non-art fields preserved.
- 24 supplied character files and all 3 API endpoint files have unchanged bytes.
- Changed JavaScript function sections: artMarkup, renderPlay, renderSettings, renderEditor. These are presentation/image-source changes.

## Scope limits
The sandbox blocks even localhost navigation in the browser. The layout tests therefore embedded the EXACT on-disk asset bytes in the unmodified app logic and enabled its existing preview mode.
These are rendering and UI tests, not live Vercel, real iOS touch, microphone, IndexedDB durability, cloud synchronization, or actual service-worker/offline tests.
Static cache dependency coverage was verified. No claim is made that the production site has been deployed.
After deploying all three parts, verify the version, wait for cache completion, and test pictures and recordings in airplane mode separately.
