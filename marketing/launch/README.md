# Træn videre fra sidste gang.

Ringbundne træningskort, det originale timeglas og samme bænkpres går igen i hjemmesiden og lanceringsfilmen. Skrifterne er Træningsmesters Cabinet Grotesk 800 og Satoshi. Materialet er klargjort til Christians egen publicering.

| Fil | Anvendelse | Format |
| --- | --- | --- |
| [traen-videre.mp4](traen-videre.mp4) | Lydløs lodret film med spørgsmål, træningsforløb og adgangshandling | 1080 × 1920, H.264, 30 billeder/s, 19 s |
| [traen-videre-still.png](traen-videre-still.png) | Opslag i stående format | 1080 × 1350, PNG |
| [opslag.md](opslag.md) | Dansk opslag til betatestere og træningspartnere | Klar til kopiering |
| [og-image.jpg](../../public/product/og-image.jpg) | Hjemmesidens Open Graph- og Twitter-billede | 1200 × 630, JPEG |
| [programkort.webp](../../public/product/programkort.webp) og [mobiludgaven](../../public/product/programkort-mobil.webp) | Forsidens fritlagte programkort | 1200 × 1056 og 900 × 792, transparent WebP |

**Alternativ tekst til stillbilledet**

Træn videre fra sidste gang. En metalring samler tre træningskort. På det forreste kort er der en illustration af bænkpres med stang. Sidste sæt var 60 kg × 8, og dagens sæt er 62,5 kg × 8. Få besked om adgang på traeningsmester.dk.

## Ét sæt i bænkpres

| Tid i filmen | Det, man ser |
| --- | --- |
| 0–3 s | »Hvad løftede jeg sidst?« De ringbundne programkort kommer i bevægelse. Sidste sæt vises med 60 kg × 8. |
| 3–6 s | Mit styrkeprogram → Overkrop A → Bænkpres Med Stang. Planen er 3 sæt × 8, 60 kg og 2 minutters pause. |
| 6–9 s | Forrige sæt den 12. november var 60 kg × 8. Den 15. november står første arbejdssæt til 62,5 kg × 8. |
| 9–12 s | Timeglasset fra Træningsugen. I appen er første sæt nu udført, andet sæt er valgt, og pausen viser 01:42. |
| 12–15 s | Ved næste træning den 17. november kan sættet fra den 15. november genfindes i historikken med 62,5 kg × 8. |
| 15–19 s | »Træn videre fra sidste gang.« »Få besked om adgang.« Slutbilledet viser webadressen og oplyser, at appen er under udvikling. |

Eksempelsættene er fiktive. Appbillederne er mærket som rekonstruerede appvisninger. Den eksplicitte markering følger også alle billeder, der kun viser tallene.

## Billedkilder

- **Programkortet.** Træningsugens officielle `design/instagram/traeningsugen/kilder/layout.html#02` monterer katalogbilledet fra `medier/baenkpres.png` og den danske titel på `medier/02.png`. Eksporten bruger automatisk samme perspektivmatrix og Cabinet-tryk. Sølvringen, de koboltblå og violette kort samt papirets tekstur kommer fra originalen.
- **Fritlægningen.** `source/programkort-alpha.png` er en maske fra macOS Vision på originalens 1122 × 1402 px. Den bevarer hulrummet i ringen. Heroen beskæres ved x 60/y 100 til 1000 × 880 px i det koordinatsystem. Hjemmesiden kan give den sit eget lys med CSS. Vægttallene står separat fra den trykte titel.
- **Bevægelsen.** `source/programkort-bevaegelse.mp4` og `source/timeglas-bevaegelse.mp4` er beskårne udsnit af Træningsugens eksisterende `02-bevaegelse.mp4` og `03-bevaegelse.mp4`. Kampagnens fotoillustrationer blev oprindeligt fremstillet med ImageGen og er beskrevet i appens `design/instagram/traeningsugen/Billedprompter.md`.
- **Katalogmotivet.** Øvelsen Bænkpres Med Stang har id `0f93677e-79d9-4e24-ace9-0981e532ec17` i Supabase-projektet `rbplnybmjwcoigiwtkuh`. Den tidligere read-only-udvælgelse brugte `user_id IS NULL`, `is_private IS FALSE` og `erGodkendt IS TRUE`. Illustrationen er bevaret i `source/bench-start.png`.
- **Appklippet.** Træningsforløbet kommer fra det eksisterende [Center Stage-klip](source/product-center-stage.mp4). De fire tresekundersudsnit viser program, sæt, pause og historik. Appens tilstand og markeringerne er bevaret i udsnittene. [React Bits Center Stage](https://www.reactbits.dev/tools/center-stage).
- **Rekonstruktionerne.** Grundlaget er Træningsmester-appens `workout-session-screen.tsx`, `workout-exercise-targets.tsx`, `exercise-history-sheet.tsx`, `history/set-values.ts`, `program-detail-screen.tsx` og `program-exercise-row.tsx`, oprindeligt kontrolleret ved revision `a733bd20614306f3bb754232616aea87266c01e2`. Sætrækken, pausen og historikken er også kontrolleret mod apprevision `e9d7df52a973`. Eksemplet viser en træning styret fra telefonen. Systemstatus og symboler er forenklet. [Skærmenes kilder og beskæringer](revision-center-stage-origin.md).

## Genbygning

[composition.html](composition.html) samler typografi, tal og medieplaceringer. [media-launch.cjs](../../scripts/media-launch.cjs) bygger med Chromium og ffmpeg fra projektets rod.

```sh
node scripts/media-launch.cjs marketing/launch/source/product-center-stage.mp4
```

Uden argument gendannes opslagets stillbillede og hjemmesidens linkpreview. Hvis Træningsugens kilder er tilgængelige lokalt, kan programkort, bevægelsesudsnit og alle slutformater genbygges samlet. Denne variant bruger også `cwebp`.

```sh
node scripts/media-launch.cjs --sources "/absolut/sti/til/Træningsmester-official/design/instagram/traeningsugen/kilder"
```

De fire skærmrekonstruktioner kan genskabes med `node scripts/media-reconstruct-app.cjs`. De tilhørende Center Stage-indstillinger er `center-stage-video.json` og `revision-center-stage-*.json`.

## Kontrol den 17. november 2026

Begge heroformater blev genbygget og sammenlignet med de oprindelige billedlag ved samme visningsstørrelse. De genbyggede WebP-filer var bitidentiske med leverancen. Ringens hul og de fire billedkanter er gennemsigtige.

Den færdigkodede film spillede til ende ved normal hastighed i Chromium ved 390 × 844. Afspilleren registrerede 570 billeder, 0 tabte og 19,0 sekunders spilletid. Åbningen, de fire appstadier og slutningen blev gennemset, og H.264, 1080 × 1920 og 30 billeder/s blev kontrolleret med ffprobe. Fra den lokale hjemmesides Open Graph- og Twitter-metadata blev samme 1200 × 630 JPEG hentet med HTTP 200. Linkbilledet, titlen og beskrivelsen blev kontrolleret ved 358 pixels visningsbredde.
