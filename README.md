# 은설, 은채만의 낱말놀이 v1.7.1

## Full vector image replacement
All 220 general cards now load distinct SVG vector originals from assets/vector.
There are no low-resolution spritesheet references or embedded raster images in those SVGs.
This is a new illustrative art style with soft shading, not a restoration of the former 3D renderings.
50 previously created vector originals were reused; 170 additional vectors were drawn for this release.
The 24 parent-supplied character images remain byte-for-byte unchanged. Their source resolution is unchanged.

## Upload
Upload parts 1, 2 and 3 in that order to the existing repository root. Part 3 contains the app code.
Unzip each part in its own empty directory; upload the files and directories INSIDE it, not the ZIP itself.
Counts: part 1 = 92, part 2 = 92, part 3 = 81; full release = 265 files.
Do not delete existing assets or the browser's website data. Keep the same production origin.
Back up recordings privately before updating; never upload a personal backup JSON to a public repository.
No new environment variables or API keys are required for the replacement images.
Cloud backup and AI synthesis still require the previously configured server credentials.

## Cache
The new service worker caches all 220 SVGs and existing character assets atomically.
A missing upload causes installation to fail rather than replacing the previous working cache.
The recovery page /recover.html now expects v1.7.1. It does not erase IndexedDB or recordings.
Real iPhone/iPad service worker behavior must be tested after deployment.

## Audit
image-quality.json lists every general card and SHA-256 of its exact vector asset.
TESTING.md records the limited local tests. The public site has NOT been changed by generating this ZIP.
