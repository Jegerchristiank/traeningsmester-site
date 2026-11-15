# Træn videre fra sidste gang

Materiale til egen publicering efter godkendelse. Intet er sendt eller publiceret af produktionen.

- `traen-videre.mp4`: lodret lanceringsklip, 1080 × 1920, 30 fps, uden lyd. Åbning: »Hvad løftede jeg sidst?«. Slutning: »Få besked om adgang«.
- `traen-videre-still.png`: opslag, 1080 × 1350.
- `opslag.md`: færdigt dansk opslagudkast.
- `../../public/product/og-image.jpg`: delingsbillede, 1200 × 630.
- `composition.html`: redigerbar typografi, opslag og videotekst. Eksisterende Cabinet Grotesk 800 og Satoshi, varm grund #f6f5f1, blå #0759c7.

## Produktets sandhedsstatus

Billederne er kildefaste, redaktionelle **rekonstruktioner**, ikke nye native screenshots. Der er ingen rigtige brugerdata. Markeringen »Eksempeldata · rekonstruerede appvisninger« skal bevares. Program, aktivt sæt, pause og historik følger appens aktuelle komponenter i `Jegerchristiank/Traeningsmester-app`, kontrolleret 15. november 2026 ved revision `a733bd20614306f3bb754232616aea87266c01e2`. Systemstatusbar og symboler er forenklet. De viser ikke ny servergemning.

Program: Mit styrkeprogram. Dag: Overkrop A. Bænkpres Med Stang, 3 × 8, plan 60 kg og 2:00 pause. Tidligere sæt 12. november: 60 kg × 8. Første sæt 15. november: 62,5 kg × 8. Efter registrering er første sæt udført, andet aktivt og pausen viser 01:42 i appens bundfelt. I næste træning 17. november genfindes samme sæt fra 15. november. Eksemplet viser ét gennemført sæt, ikke tre.

Kildekomponenter: `workout-session-screen.tsx`, `workout-exercise-targets.tsx`, `exercise-history-sheet.tsx`, `history/set-values.ts`, `program-detail-screen.tsx`, `program-exercise-row.tsx`. Den native QA-reference blev kun brugt til layoutkontrol og indgår ikke i leverancen.

## Godkendt katalogindhold

Supabase `rbplnybmjwcoigiwtkuh` blev læst read-only. Kun katalogrækker med `user_id is null`, `is_private is false`, `erGodkendt is true` blev brugt. Valgt øvelse: `0f93677e-79d9-4e24-ace9-0981e532ec17`, Bænkpres Med Stang. Det medfølgende `source/bench-start.png` er den godkendte offentlige katalogillustration, hentet fra `images_workout_days/images_exercises/ai/v7-20261107-r40/0f93677e-79d9-4e24-ace9-0981e532ec17/male/a8/start.png`. Logo og skrifter er projektets eksisterende assets.

## Produktion og reproduktion

Skærmrekonstruktionerne genereres med `node scripts/media-reconstruct-app.cjs`; output er som standard `/tmp/tm-product-assets`. De fire optimerede fulde frames ligger i `public/product/screen-*.webp`.

Produktkompositionerne er faktisk eksporteret fra [React Bits Center Stage](https://www.reactbits.dev/tools/center-stage), med egne appframes. `center-stage-hero.json`, `center-stage-chapters.json` og `center-stage-video.json` er de anvendte redigerbare indstillinger. Importér JSON og derefter tilhørende skærmbillede eller optagelse. Ingen Center Stage-/WebGL-runtime indlæses på hjemmesiden.

Hero: udsnit af `active.png`, x0/y760/bredde1206/højde1125, eksporteret 1280 × 1280. Kapiteludsnit: program y380/h1580; sæt y760/h1365; pause y770/h1780; historik y1400/h1180, alle bredde1206 og x0. Kapitelkompositionerne er eksporteret 1024 × 1280. Cropændringer er redaktionelle; de fremstiller ikke appanimation som eksisterende.

Videoens kilde er program → aktivt sæt → pause → historik, hver 3 sekunder. Center Stage bruger Card med eksplicit 9:19.5 viewport, 9:16 output og beskeden Sway (intensity0.06). Phone-rammen fravalgtes, fordi den tilføjede endnu en statusbar over de faktiske frames. WebM anvendes som mellemformat og transkodes til H.264 MP4 med fast start/sluttekst; MP4-renderingen i studiet gav ingen fil i denne browser.

Den leverede film er 18,5 sekunder: åbning 2,5 s, produkt 12 s, slutning 4 s. Det eksporterede Center Stage-klip ligger komprimeret som `source/product-center-stage.mp4`. Genskab slutfilm og stills med:

```sh
node scripts/media-launch.cjs marketing/launch/source/product-center-stage.mp4
```

Produktdelen har redaktionelle nærbilleder af program, sæt, pause og historik, så de afgørende tal kan læses i telefonstørrelse. Det er filmens kamerabeskæring, ikke nye overgange eller zoomfunktioner i appen. Filmens titel-/slutkort er synlige straks. Ingen lyd eller musikrettigheder kræves.

Kontrolleret: de faktisk eksporterede billeder er åbnet; hele den færdige MP4 er afspillet i Chromium ved 390 × 844 til `ended=true`, 555 videoframes, 18,5 sekunder, ingen video-fejl. Første/sidste frame og hvert kapitel er gennemset; pauseudsnittet blev rettet for at bevare hele 01:42-feltet. H.264/1080×1920/30fps er kontrolleret med ffprobe. Det er produktions- og afspilningskontrol, ikke bruger- eller konverteringstest.
