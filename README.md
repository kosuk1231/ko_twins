# Word Garden v1.3.1 - GitHub browser upload package

This is the already-built deployment package: 93 files, not a new app version.
No application, card artwork, audio, recording, or storage code was modified.
The full editable source and tests remain in word-garden-v1.3.1-originals-vercel.zip.

## Upload to your existing repository
1. Back up your current app's local data first.
2. Extract this ZIP to a NEW empty folder. Do not merge it into the old 122-file folder.
3. Open the root of your existing GitHub repository, then Add file > Upload files.
4. Select everything INSIDE the extracted folder, including assets/ and api/.
   Drag those files and folders onto the upload page together. Do not upload the ZIP itself.
   Do not drag the outer wrapper folder: index.html must remain at repository root.
5. Commit the upload to the branch connected to your existing Vercel project.
6. Keep your current Vercel settings and environment variables. No new project is needed.
7. Open the SAME production address and confirm v1.3.1.
   Wait for offline preparation, then check cards and audio separately offline.

Do not delete Safari site data or remove the installed home-screen app for this update.
Existing repository files not included in this package do not need to be deleted.
The per-upload file limit is not a limit on total files already in the repository.

## Contents (93 files)
- assets/cards/: 52 original general card illustrations + 1 neutral placeholder
- assets/characters/: all 24 supplied character images, unchanged
- api/: 2 existing server endpoints
- Root: 14 deployment files, manifests and documentation

index.html already contains the application JavaScript, CSS and card data.
The separate development sources, build tools, local launchers and test reports
are intentionally omitted. A Python build is not required to deploy this bundle.

The app version remains v1.3.1 because only packaging changed.
INSTALL.html explains backup, update and offline checks.
ASSETS.md and bundled-characters.json preserve original-image provenance.

## Validation
Verified all 82 service-worker core paths, both API JSON dependencies,
all manifest icons, all 24 character-image bytes, ZIP CRCs, and byte equality
of every retained file except this README against the full v1.3.1 source ZIP.
This packaging check is not a live GitHub/Vercel deployment or an iPhone test.

GitHub upload documentation:
https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
