# 캐릭터 이미지 출처와 처리

## 직접 제공된 캡처
이 대화에 사용자가 직접 올린 캡처 14장을 사용했습니다. 이 버전의 기본 캐릭터 WebP 파일을 만들기 위해 원본 사이트에 접속하거나 AI로 캐릭터를 다시 생성하지 않았습니다.
- 뽀로로 소개 3장 → 원형 이미지 10장(삐삐·뽀뽀는 합친 카드).
- 아기상어 소개 6장 → 캐릭터 6장.
- 타요 소개 5장 → 캐릭터 8장.

`bundled-characters.json`에 원본 파일 이름/해시/자르기 영역/자르기 후 실제 픽셀/출력 크기/제약을 기록했습니다.
출력 캔버스는 512×512, 흰 배경, 기존 비율 유지, Lanczos 리사이즈, 무손실 WebP입니다.
알파 배경 제거, 누락 부분 복원, 얼굴 재생성은 하지 않았습니다.
뽀로로는 원형 배경도 원본의 일부로 그대로 사용했습니다. 설명 본문은 카드에 복제하지 않았습니다.

하나의 발끝 일부가 원본 캡처에서 잘려 있습니다. 삐삐·뽀뽀는 두 등장인물을 한 장으로 구성했습니다.
이름이 없는 남산 버스 캡처는 피넛으로 정리했습니다. 참고: 공식 타요 시리즈 S4 EP5 'Nice to meet you, Peanut!' https://www.youtube.com/watch?v=PH10nKdNf7w 와 남산버스 명칭 확인 자료 https://prod.danawa.com/info/?pcode=25284668 .
기존 캐릭터 권리는 해당 권리자에게 있습니다. 별도 라이선스를 확보했다는 뜻은 아닙니다.

## 기존 일반 그림
동물·과일·야채·탈것·음식의 SVG 52장은 v1.3.0에 포함된 파일을 변경 없이 유지했습니다.


## v1.6.0 approved vocabulary sheets

220 general vocabulary cards use 11 approved WebP sheets at assets/sheets. Each sheet is 1280 x 1024 pixels (5 columns x 4 rows; 256 x 256 per card). Text is rendered as HTML, not baked into the images. The supplied catalog and the application use the same art bytes and cell coordinates. The 24 original character image files, their names, and their attributions remain unchanged. Optional earlier characters require a saved or uploaded image and are not counted among the 24 bundled originals.


## v1.6.2 new native artwork
- assets/hd/truck.webp: newly generated illustration; native 1448 x 1086 pixels.
- Lossless WebP encoding, pixel dimensions preserved, no upscaling.
- Only truck was replaced. Other general atlas artwork is unchanged.
- Original character files are preserved; no AI redrawing of characters.
