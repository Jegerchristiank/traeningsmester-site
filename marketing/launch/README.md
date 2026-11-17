# Træn videre fra sidste gang.

To små skiver forklarer, hvordan otte gentagelser i bænkpres kan gå fra 60 til 62,5 kg. De bruges som visuel indgang til ét sæt i Træningsmester. Eksemplet er fiktivt.

| Fil | Anvendelse | Format |
| --- | --- | --- |
| [traen-videre.mp4](traen-videre.mp4) | Lydløs lodret film til omtale og betatestere | 1080 × 1920, H.264, 30 billeder/s, 19 s |
| [traen-videre-still.png](traen-videre-still.png) | Stillbillede til samme opslag | 1080 × 1350, PNG |
| [opslag.md](opslag.md) | Dansk opslag til betatestere og træningspartnere | Klar til kopiering |
| [og-image.jpg](../../public/product/og-image.jpg) | Hjemmesidens Open Graph- og Twitter-billede | 1200 × 630, JPEG |
| [560](../../public/product/vaegtskiver-560.webp), [1024](../../public/product/vaegtskiver-1024.webp) og [1800](../../public/product/vaegtskiver-1800.webp) | Forsidens studiescene | 560 × 420, 1024 × 768 og 1800 × 1350, WebP |
| [Panorama](../../public/product/vaegtskiver-panorama.webp) | Brede, lave skærme | 1920 × 800, WebP |

**Alternativ tekst til stillbilledet**

Træn videre fra sidste gang. To blå vægtskiver på 1,25 kg ligger og står på en lys studiebund. Sidste sæt i bænkpres var 60 kg × 8. Med én skive mere på hver side bliver dagens sæt 62,5 kg × 8. Få besked om adgang på traeningsmester.dk.

## Ét sæt i bænkpres

| Tid i filmen | Det, man ser |
| --- | --- |
| 0–3 s | »Hvad løftede jeg sidst?« To små vægtskiver og eksemplets seneste sæt på 60 kg × 8. |
| 3–6 s | Mit styrkeprogram → Overkrop A → Bænkpres Med Stang. Planen er 3 sæt × 8, 60 kg og 2 minutters pause. |
| 6–9 s | En ekstra skive på 1,25 kg på hver side. Den 15. november står første arbejdssæt til 62,5 kg × 8. Forrige sæt fra den 12. november er synligt i appen. |
| 9–12 s | Første sæt er udført, andet sæt er valgt, og pausen viser 01:42. |
| 12–15 s | Ved næste træning den 17. november findes det tidligere sæt fra den 15. november i historikken. |
| 15–19 s | »Træn videre fra sidste gang.« Slutningen viser »Få besked om adgang«, webadressen og appens udviklingsstatus. |

Appens billeder er mærket som rekonstruerede appvisninger. Billeder af selve vægtskiverne angiver eksempeldata, når de ledsages af sættal.

## Billedkilder

- **Studiet.** Træningsmesters [Cycles-scene](source/vaegtskiver.py) genererer begge skiver, koboltfarvet emalje, børstede bøsninger, hævet vægtmærkning, gulv, lyskilder og kameravinkler. De er originale, umærkede fotoillustrationer. Et produktdatablad gav en reference for proportionerne af en lille skive med 160 mm diameter og 12 mm tykkelse. [Dimensioner i producentens datablad](https://media.eleiko.com/admin/download-product-sheet.aspx?articlecode=3060350-0125&language=en-gb).
- **Optik.** Den almindelige scene og panoramaet bruger samme motivhøjde. Panoramaet viser mere af det faktiske studie til siderne. [Delingens billedplade](source/vaegtskiver-deling.webp) er optaget med separat kameraforskydning, så overskrift og tal kan stå på den frie del af gulvet.
- **Appklippet.** De fire tresekundersudsnit stammer fra projektets eksisterende [Center Stage-klip](source/product-center-stage.mp4). Appens program, aktive sæt, pause og historik følger den samme øvelse. [React Bits Center Stage](https://www.reactbits.dev/tools/center-stage).
- **Rekonstruktionerne.** Grundlaget er Træningsmester-appens `workout-session-screen.tsx`, `workout-exercise-targets.tsx`, `exercise-history-sheet.tsx`, `history/set-values.ts`, `program-detail-screen.tsx` og `program-exercise-row.tsx`, oprindeligt kontrolleret ved revision `a733bd20614306f3bb754232616aea87266c01e2`. Sætrækken, pausen og historikken er også kontrolleret mod apprevision `e9d7df52a973`. Eksemplet viser en træning styret fra telefonen. Systemstatus og symboler er forenklet. [Skærmenes kilder og beskæringer](revision-center-stage-origin.md).
- **Kataloget.** Bænkpres Med Stang har id `0f93677e-79d9-4e24-ace9-0981e532ec17` i Supabase-projektet `rbplnybmjwcoigiwtkuh`. Den tidligere read-only-udvælgelse brugte `user_id IS NULL`, `is_private IS FALSE` og `erGodkendt IS TRUE`. Katalogillustrationen ligger i `source/bench-start.png`.

## Genbygning

[composition.html](composition.html) indeholder typografi, stillbillede, delingsbillede og filmen. [media-launch.cjs](../../scripts/media-launch.cjs) bygger med Chromium og ffmpeg fra projektets rod.

```sh
node scripts/media-launch.cjs marketing/launch/source/product-center-stage.mp4
```

Uden argument gendannes opslagets stillbillede og hjemmesidens linkpreview. Hele 3D-studiet kan genbygges med Blender 5.2, cwebp og den samme kommando i studietilstand. De tre projektioner renderes sekventielt med fem CPU-tråde.

```sh
node scripts/media-launch.cjs --studio /Applications/Blender.app/Contents/MacOS/Blender
```

De fire skærmrekonstruktioner kan genskabes med `node scripts/media-reconstruct-app.cjs`. Deres Center Stage-indstillinger er `center-stage-video.json` og `revision-center-stage-*.json`.

## Kontrol den 18. november 2026

Studiet er renderet og gennemset i tre kamerabilleder, også i lille størrelse. Markeringen 1,25 og de to hele skiver er synlige i både standardformat og panorama. De tre 4:3-filer fylder henholdsvis 13.730, 37.676 og 108.582 bytes.

Den færdige film blev afspillet ved normal hastighed i Chromium ved 390 × 844. Afspilleren nåede sidste frame efter 19 sekunder med 570 billeder og 0 tabte. Åbning, alle fire appstadier og afslutning er gennemset i den kodede fil. Projektets lokale webserver leverede den annoncerede Open Graph-JPEG på 1200 × 630 med HTTP 200. Titel, billedtekst og visning blev også kontrolleret som 358 pixels bredt linkpreview.
