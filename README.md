# Word Garden v1.6.2 - display fix and ONE native HD card

## Exact scope
- Fixed the media overflow affecting matching targets, choices and editor previews.
- Truck ONLY: newly generated 1448 x 1086 native image, saved as lossless WebP.
- The other 219 general cards are still the existing 256 x 256 atlas cells.
- All 24 bundled character images and their metadata are unchanged.
- This release is NOT a completed 220-card high-resolution collection.
- New parent image uploads retain up to 1600px on their longest side. Small images are not upscaled.

## Update
Back up private recordings from the app first. Never upload your personal backup JSON to GitHub.
Upload the patch at the ROOT of the existing repository, retaining folder paths.
Include assets/hd/truck.webp, not just index.html.
Do not remove old assets or api folders. Use the same Vercel project and domain.
Wait for the latest deployment. Open /recover.html on that domain to apply v1.6.2.
Do not delete browser data or the home-screen app.

## Upload count
The complete app has 56 files. The patch from v1.6.0 has 9 files.
Future independently generated native images can be uploaded in separate category folders.
There is no need to reduce per-card resolution to reduce the number of files.

## Preservation
Word IDs, phrases, questions, recording storage, parent voice playback priority,
cloud API files, backup format and character originals are retained.
New images are runtime assets and are included in the offline CORE manifest.
No completed-device, iOS, Vercel, cloud or microphone test is claimed.
See TESTING.md for reproducible browser test scope.
