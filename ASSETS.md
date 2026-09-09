# Artwork and source manifest - v1.3.0

52 ordinary illustration SVGs and one neutral placeholder are included in `assets/cards/`. Previously generated character SVGs have been removed. No source-character PNG/JPEG bytes are bundled.

Original character names and visible source imagery were checked on the following pages:

- Requested: http://www.pororopark.com/about/character.php (unavailable during inspection).
- Official substitute: https://www.iconix.co.kr/works/iconix-detail.php?idx=1 (ICONIX; 9 characters).
- Requested and inspected: https://with-hs.tistory.com/184 and its mobile view https://with-hs.tistory.com/m/184 (11 Baby Shark characters; the article credits KBS).
- Requested but unreadable: https://blog.naver.com/alongmong/223738269214. No characters from this unverified page were guessed or added.

Exact source URLs, labels, fixed source identities and crop rectangles are recorded in `character-sources.json` and embedded in `content.json`. Source screenshots are cropped to the character area when the parent explicitly downloads them in the app. A white canvas and consistent contained sizing are applied without redrawing the characters.

Each artwork remains credited to its source/rightsholders. No separate image reuse/public-distribution/commercial license was obtained. Attribution is not an assertion of permission. The app does not claim endorsement by ICONIX, Pinkfong, KBS, or the blog authors.

Test images are simple geometric fixtures generated only inside regression tests. They are not the character artwork and are not installed into the app or deployed source assets.
