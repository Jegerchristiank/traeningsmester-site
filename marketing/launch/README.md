# Træn videre fra sidste gang.

Lanceringsmaterialet bruger samme sort-hvide træningsfoto, Cabinet Grotesk, kursiv Georgia og blå aktive sætrække som hjemmesiden. Filmen kan ses uden lyd. Opslaget og filmen er klargjort til Christians egen publicering.

| Fil | Anvendelse | Format |
| --- | --- | --- |
| [traen-videre.mp4](traen-videre.mp4) | Lodret film med spørgsmål, træningsforløb og adgangshandling | 1080 × 1920, H.264, 30 billeder/s, 19 s |
| [traen-videre-still.png](traen-videre-still.png) | Billede til opslag i stående format | 1080 × 1350, PNG |
| [opslag.md](opslag.md) | Dansk opslag til betatestere og træningspartnere | Klar til kopiering |
| [og-image.jpg](../../public/product/og-image.jpg) | Hjemmesidens Open Graph- og Twitter-billede | 1200 × 630, JPEG |

**Alternativ tekst til opslagets billede**

Træn videre fra sidste gang. En hånd griber en vægtstang. Foran fotoet viser Træningsmester sidste sæt på 60 kg × 8 og det næste på 62,5 kg × 8. Få besked om adgang på traeningsmester.dk.

## Ét sæt i bænkpres

| Tid i filmen | Det, man ser |
| --- | --- |
| 0–3 s | »Hvad løftede jeg sidst?« Hånden om stangen og den aktive sætrække. |
| 3–6 s | Mit styrkeprogram → Overkrop A → Bænkpres Med Stang. Planen er 3 sæt × 8, 60 kg og 2 minutters pause. |
| 6–9 s | Forrige sæt den 12. november var 60 kg × 8. Den 15. november står første arbejdssæt til 62,5 kg × 8. |
| 9–12 s | Første sæt er udført, andet sæt er valgt, og pausen viser 01:42. |
| 12–15 s | Ved næste træning den 17. november kan sættet fra den 15. november genfindes i historikken med 62,5 kg × 8. |
| 15–19 s | »Træn videre fra sidste gang.« »Få besked om adgang.« Slutbilledet viser webadressen og oplyser, at appen er under udvikling. |

Alle appbilleder har synlig markering for eksempeldata og rekonstruerede appvisninger. De viser ét udført arbejdssæt. Kilder, beskæringer og de seks frontale billeder er dokumenteret sammen med de eksisterende [Center Stage-eksporter](revision-center-stage-origin.md).

## Produkt- og billedkilder

- Skærmrekonstruktionen bygger på Træningsmester-appens `workout-session-screen.tsx`, `workout-exercise-targets.tsx`, `exercise-history-sheet.tsx`, `history/set-values.ts`, `program-detail-screen.tsx` og `program-exercise-row.tsx`. Grundlaget blev kontrolleret den 15. november 2026 ved revision `a733bd20614306f3bb754232616aea87266c01e2`. Kildeeksemplet er lokalt og fiktivt. Systemstatus og symboler er forenklede.
- Katalogillustrationen i `source/bench-start.png` kommer fra et read-only-udtræk for øvelsen Bænkpres Med Stang, id `0f93677e-79d9-4e24-ace9-0981e532ec17`, i projekt `rbplnybmjwcoigiwtkuh`. Katalogfilteret var `user_id IS NULL`, `is_private IS FALSE` og `erGodkendt IS TRUE`. De færdige mediefiler indeholder ingen private træninger.
- Fotoet er samme godkendte motiv som i appens `design/paywall/sport/index.html`. Den lokale version er `public/product/athlete.webp`. [Victor Freitas på Unsplash](https://unsplash.com/photos/man-carrying-barbell-at-the-gym-CQwNdMxwjfk) · [Unsplash License](https://unsplash.com/license).
- Kapitlerne i filmen er direkte udsnit af det eksisterende [Center Stage-klip](source/product-center-stage.mp4). Produktets program, aktuelle sæt, pause og historik kommer fra sammenhængende tresekunderssekvenser. Sæt og pause bruger samme udsnit og skala ved klippet. Den langsomme kamerabevægelse i fotografiet ligger i den redaktionelle komposition. [React Bits Center Stage](https://www.reactbits.dev/tools/center-stage).

## Reproduktion

De oprindelige skærme kan genskabes med `node scripts/media-reconstruct-app.cjs`. De fire fulde frames ligger i `public/product/screen-*.webp`. Indstillingerne `center-stage-video.json` og `revision-center-stage-*.json` hører til henholdsvis kildeklippet og de frontale appudsnit. Billedudsnit, typografi og webfilm kan redigeres i [composition.html](composition.html) og [media-launch.cjs](../../scripts/media-launch.cjs).

Fra roden af projektet med projektets Playwright og ffmpeg installeret:

```sh
node scripts/media-launch.cjs marketing/launch/source/product-center-stage.mp4
```

Uden argument gendannes opslagets stillbillede og hjemmesidens linkpreview.

## Kontrol den 17. november 2026

Den færdige MP4 blev afspillet ved normal hastighed i Chromium ved 390 × 844 til slutmarkeringen. Afspilleren rapporterede 570 viste billeder, 0 tabte billeder og 19,0 sekunders spilletid. H.264, 1080 × 1920 og 30 billeder/s blev også læst fra filen med ffprobe. Åbning, alle fire appstadier og slutning er gennemset i den kodede film.

Fra den lokale hjemmesides HTML blev Open Graph- og Twitter-billedet fundet på samme adresse. Den lokale server leverede den eksporterede 1200 × 630 JPEG med HTTP 200. Billedet og den tilhørende titel og beskrivelse blev gengivet i en previewbredde på 358 pixels.
