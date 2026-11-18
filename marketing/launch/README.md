# Træn videre fra sidste gang.

Mens du står ved bænken, viser Træningsmester, hvad du løftede sidst. I eksemplet går første sæt fra 60 kg × 8 til 62,5 kg × 8. I næste træning kan du genfinde sættet i historikken.

## Materiale til omtale

| Fil | Brug | Format |
| --- | --- | --- |
| [Lanceringsfilm](traen-videre.mp4) | Lodret, lydløs film | 1080 × 1920, H.264, 30 billeder/s, 19 sekunder |
| [Stillbillede](traen-videre-still.png) | Opslag | 1080 × 1350, PNG |
| [Dansk opslag](opslag.md) | Tekst til betatestere og træningspartnere | Markdown |
| [Delingsbillede](../../public/product/og-image.jpg) | Linkpreview for traeningsmester.dk | 1200 × 630, JPEG |

**Alternativ tekst til stillbilledet**

Træn videre fra sidste gang. På telefonen står »Bænkpres Med Stang«. For tre dage siden løftede du 60 kg otte gange. Første sæt i dag står til 62,5 kg og otte gentagelser. Få besked om adgang på traeningsmester.dk. Tallene er et eksempel.

## Produktbilleder i filmen og opslaget

Alle udsnit viser samme telefon og samme træning på en blågrå studiebund. Skærmens skarpe bogstaver kommer fra [kilderekonstruktionen af det aktive sæt](../../public/product/screen-set.webp). Visningen gengiver appens scroll med en fast træningsoverskrift og øvelse, sidste vægt og aktivt sæt i den rullende liste. Kildedimensionen er 1206 × 2622. De enkelte formater placerer kameraet, så både den tidligere vægt og det aktive sæts blå afkrydsning er med. Billedkanten ligger i den hvide afstand mellem rækkerne. Hver WebP-eksport har mindst fire hele pixelrækker med fri bund langs sætrækkens samlede bredde.

| Visning | Eksporter |
| --- | --- |
| Desktop, 3:2 | [960 × 640](../../public/product/fokus-desktop-960.webp) og [1620 × 1080](../../public/product/fokus-desktop-1620.webp) |
| Mobil, 1,35:1 | [540 × 400](../../public/product/fokus-mobil-540.webp) og [1080 × 800](../../public/product/fokus-mobil-1080.webp) |
| Bred, lav skærm, 2,5:1 | [1800 × 720](../../public/product/fokus-panorama.webp) |
| Billedplade til deling | [1200 × 630](source/fokus-deling.webp) med plads til overskriften til venstre |

## Filmens forløb

| Tid | Billede |
| --- | --- |
| 0–3 s | »Hvad løftede jeg sidst?« Telefonen viser bænkpres og det sidste sæt på 60 kg × 8. |
| 3–6 s | `Mit styrkeprogram` → `Overkrop A` → `Bænkpres Med Stang`. Tre sæt med otte gentagelser, 60 kg og to minutters pause er planlagt. |
| 6–9 s | Den 15. november står første sæt til 62,5 kg × 8. Lige ovenfor står de 60 kg × 8 fra den 12. november. |
| 9–12 s | Første sæt er registreret, andet sæt er aktivt, og pausen viser 01:42. |
| 12–15 s | Ved træningen den 17. november kan man i historikken se sættet fra den 15. november. |
| 15–19 s | »Træn videre fra sidste gang.« Slutbilledet viser »Få besked om adgang«, webadressen og appens udviklingsstatus. |

## Kilder og genbygning

Den 8,5 sekunder lange baggrundsfilm åbner midt i et bænkpres. Tima Miroshnichenko har filmet løftet fra to vinkler. K (@kelly) har filmet hænderne, der klapper magnesiumstøv op i luften. Støvet samler sig til »62,5« som en redaktionel effekt, der forbinder løftet med vægten i træningsloggen. Scenen med telefonen på træningsbænken er iscenesat med ImageGen. På skærmen ses en rekonstruktion af Træningsmester med eksempeldata. [Løfteren](https://www.pexels.com/video/a-person-doing-bench-press-exercise-5320004/) · [Vægtskiven](https://www.pexels.com/video/a-person-doing-bench-press-exercise-5320001/) · [Originaloptagelse af magnesiumskyen](https://www.pexels.com/video/chalk-dust-clouds-from-clapping-hands-31794153/) · [Pexels’ licens](https://www.pexels.com/license/).

[Landskabsfilmen](../../public/product/cover/saet-landskab.mp4) og [portrætfilmen](../../public/product/cover/saet-portraet.mp4) har hver sin kamerabeskæring og sit eget WebP-startbillede. Træningsfilmen på 19 sekunder åbnes separat fra forsiden.

Til genbygning bruges 4K-originalerne fra de tre Pexels-links ovenfor, ffmpeg og Python med Pillow, NumPy og OpenCV. Den tabsfri [telefonmaster](source/magnesium/baenk.webp) indeholder skærmtilstandene og vægtfeltets placering på glasset. Talformen er taget fra appens eget felt, og [støvmasken](source/magnesium/stoevkorn.png) er udtrukket af magnesiumoptagelsen.

```sh
python scripts/media-unpack-bench.py /tmp/tm-baenk
python scripts/media-cover-motion.py --bench /tmp/tm-baenk \
  --greb 5320004.mp4 --loeft 5320001.mp4 --kalk 31794153.mp4
```

Sætrækker, registrering, pause og historik er rekonstrueret efter den officielle mobilapp og mærket som eksempeldata. Systemstatus og enkelte ikoner er forenklet. Skærmenes grundlag er `workout-session-screen.tsx`, `workout-exercise-targets.tsx`, `exercise-history-sheet.tsx`, `history/set-values.ts`, `program-detail-screen.tsx` og `program-exercise-row.tsx` ved apprevision `a733bd20614306f3bb754232616aea87266c01e2`. Sætrække, pause og historik er også kontrolleret mod `e9d7df52a973`. Det originale katalogmotiv for Bænkpres Med Stang er `0f93677e-79d9-4e24-ace9-0981e532ec17`. Den tidligere read-only-udvælgelse i `rbplnybmjwcoigiwtkuh` brugte `user_id IS NULL`, `is_private IS FALSE` og `erGodkendt IS TRUE`. [Kildedokumentation](revision-center-stage-origin.md) · [katalogillustration](source/bench-start.png).

Filmens fire appudsnit kommer fra det eksisterende Center Stage-masterklip. Studiets hardwarekontur, lys og kamerabeskæringer er egne. Kabinet, display og appindhold eksporteres som én fil. Typografien uden for telefonen er Cabinet Grotesk og Satoshi. [Center Stage-master](source/product-center-stage.mp4) · [React Bits Center Stage](https://www.reactbits.dev/tools/center-stage) · [studie og kamera](source/fokus-studio.html) · [film- og opslagssats](composition.html).

Kør fra projektets rod med projektets Playwright Chromium, `cwebp` og `ffmpeg` tilgængelige. Den fulde kommando bygger først alle telefonudsnit og derefter film, stillbillede og delingsbillede.

```sh
node scripts/media-launch.cjs --studio
```

Når telefonudsnittene allerede findes, kan film og stillbilleder genbygges direkte fra masterklippet.

```sh
node scripts/media-launch.cjs marketing/launch/source/product-center-stage.mp4
```

`node scripts/media-launch.cjs` genbygger kun opslagets stillbillede og delingsbilledet. De oprindelige skærmrekonstruktioner kan eksporteres med `node scripts/media-reconstruct-app.cjs`. Deres Center Stage-indstillinger er `center-stage-video.json` og `revision-center-stage-*.json`.

## Kontrol den 18. november 2026

Den færdige MP4 blev afspillet ved normal hastighed i Chromium i en mobilvisning på 390 × 844. Afspilleren nåede 19,0 sekunder og rapporterede 570 billeder, 0 tabte og ingen afspilningsfejl. Åbning, program, registrering, pause, historik og adgang blev kontrolleret i den kodede film.

Projektets lokale side leverede delingsbilledet med HTTP 200 som JPEG i 1200 × 630. Filen var byteidentisk med eksporten, og billedtekst, titel og beskrivelse blev kontrolleret i en gengivelse af et linkpreview på 358 pixels.
