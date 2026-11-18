# Træn videre fra sidste gang.

Mens du står ved bænken, viser Træningsmester, hvad du løftede sidst. I eksemplet går første sæt fra 60 kg × 8 til 62,5 kg × 8. I næste træning kan du genfinde sættet i historikken.

## Materiale til omtale

| Fil | Brug | Format |
| --- | --- | --- |
| [Hvad løftede jeg sidst? · Bredformat](../../public/product/film/baenkpres-bred.mp4) | Filmen på hjemmesiden, med dansk tale og musik | 1440 × 810, H.264/AAC, 24 billeder/s, 40 sekunder |
| [Hvad løftede jeg sidst? · Højformat](../../public/product/film/baenkpres-hoej.mp4) | Mobilvisning og lodret deling | 720 × 1280, H.264/AAC, 24 billeder/s, 40 sekunder |
| [Danske undertekster](../../public/product/film/baenkpres-da.vtt) | Valgbare undertekster til begge udgaver | WebVTT |
| [Kort lanceringsfilm](traen-videre.mp4) | Tidligere lydløst klip til opslag | 1080 × 1920, H.264, 30 billeder/s, 19 sekunder |
| [Stillbillede](traen-videre-still.png) | Opslag | 1080 × 1350, PNG |
| [Dansk opslag](opslag.md) | Tekst til betatestere og træningspartnere | Markdown |
| [Delingsbillede](../../public/product/og-image.jpg) | Linkpreview for traeningsmester.dk | 1200 × 630, JPEG |

**Alternativ tekst til stillbilledet**

Træn videre fra sidste gang. På telefonen står »Bænkpres Med Stang«. For tre dage siden løftede du 60 kg otte gange. Første sæt i dag står til 62,5 kg og otte gentagelser. Få besked om adgang på traeningsmester.dk. Tallene er et eksempel.

## Den nye film på hjemmesiden

Åbningen viser et løft og stiller spørgsmålet »Hvad løftede jeg sidst?«. En sky af magnesium samler sig til 62,5 og fører ind i vægtfeltet på telefonen. Første sæt på otte gentagelser bliver gemt, ringen skifter til en afkrydsning, og pausen på to minutter begynder. Da den samme øvelse åbnes i en senere træning, står de 62,5 kg i historikken. Filmen slutter med »Få besked om adgang«.

Telefonen på bænken er en iscenesat billedkomposition. Sætrækker og historik er rekonstrueret efter appen med eksempeldata. Magnesiumtallet og den store tid over træningsbilledet er filmgrafik. Bredformat og højformat har hver sin beskæring, som holder vægtfeltet frit og læsbart. Afspilleren henter den valgte MP4, når man starter filmen, og tilbyder danske undertekster.

Den danske fortæller er en lokalt genereret AI-stemme fra Røst, udviklet af CoRal-projektet og Alexandra Instituttet. En kort figur på kontrabas følger løftet og vender tilbage, da sættet dukker op i historikken. I pausen går bassen fra pluk til bue. De tre håndkontakter har hver sin optagede lyd. [Kamera, optagelser og appvisninger](source/bench-film/README.md) · [Instrument, håndlyde og mix](source/bench-film/audio/README.md) · [Røst](https://huggingface.co/CoRal-project/roest-v3-chatterbox-350m).

### Afprøvning den 18. november 2026

Filmen med det nye lydmix blev afspillet fra start til slut i det hostede preview i Chromium ved 1440 × 900 og WebKit ved 390 × 844. Begge afspillere viste alle 960 billeder, rapporterede 0 tabte billeder, afkodede lydsporet og indlæste de otte danske undertekster. Efter filmen satte »Få besked om adgang« fokus i formularens e-mailfelt. De to hostede film var byteidentiske med de lokale sluteksporter. Formularens fejl- og succesvisninger blev ved den foregående afprøvning kontrolleret med simulerede serversvar.

I tre lokale mobilmålinger pr. version ved 390 × 844, kold cache, reduceret bevægelse, 40 ms netværksforsinkelse og 10 Mbit/s blev forsiden sammenlignet med revision `1386a05`. Første indlæsning voksede fra 433 til 470 kB på den ukomprimerede testserver. Medianen for største synlige element (LCP) gik fra 256 til 280 ms. Begge versioner hentede nul MP4-filer før brugerens første handling under disse forhold. Resultatet beskriver denne browserprøve.

## Produktbilleder i den korte film og opslaget

Alle udsnit viser samme telefon og samme træning på en blågrå studiebund. Skærmens skarpe bogstaver kommer fra [kilderekonstruktionen af det aktive sæt](../../public/product/screen-set.webp). Visningen gengiver appens scroll med en fast træningsoverskrift og øvelse, sidste vægt og aktivt sæt i den rullende liste. Kildedimensionen er 1206 × 2622. De enkelte formater placerer kameraet, så både den tidligere vægt og det aktive sæts blå afkrydsning er med. Billedkanten ligger i den hvide afstand mellem rækkerne. Hver WebP-eksport har mindst fire hele pixelrækker med fri bund langs sætrækkens samlede bredde.

| Visning | Eksporter |
| --- | --- |
| Desktop, 3:2 | [960 × 640](../../public/product/fokus-desktop-960.webp) og [1620 × 1080](../../public/product/fokus-desktop-1620.webp) |
| Mobil, 1,35:1 | [540 × 400](../../public/product/fokus-mobil-540.webp) og [1080 × 800](../../public/product/fokus-mobil-1080.webp) |
| Bred, lav skærm, 2,5:1 | [1800 × 720](../../public/product/fokus-panorama.webp) |
| Billedplade til deling | [1200 × 630](source/fokus-deling.webp) med plads til overskriften til venstre |

## Forløbet i den tidligere lanceringsfilm på 19 sekunder

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

[Forsidens baggrundsfilm i bredformat](../../public/product/cover/saet-landskab.mp4) og [i højformat](../../public/product/cover/saet-portraet.mp4) har hver sit WebP-startbillede. »Se bænkpres i appen« åbner den 40 sekunder lange film med lyd.

Til genbygning bruges 4K-originalerne fra de tre Pexels-links ovenfor, ffmpeg og Python med Pillow, NumPy og OpenCV. Den tabsfri [telefonmaster](source/magnesium/baenk.webp) indeholder skærmtilstandene og vægtfeltets placering på glasset. Talformen er taget fra appens eget felt, og [støvmasken](source/magnesium/stoevkorn.png) er udtrukket af magnesiumoptagelsen.

```sh
python scripts/media-unpack-bench.py /tmp/tm-baenk
python scripts/media-cover-motion.py --bench /tmp/tm-baenk \
  --greb 5320004.mp4 --loeft 5320001.mp4 --kalk 31794153.mp4
```

Sætrækker, registrering, pause og historik er rekonstrueret efter den officielle mobilapp og mærket som eksempeldata. Systemstatus og enkelte ikoner er forenklet. Skærmenes grundlag er `workout-session-screen.tsx`, `workout-exercise-targets.tsx`, `exercise-history-sheet.tsx`, `history/set-values.ts`, `program-detail-screen.tsx` og `program-exercise-row.tsx` ved apprevision `a733bd20614306f3bb754232616aea87266c01e2`. Sætrække, pause og historik er også kontrolleret mod `e9d7df52a973`. Det originale katalogmotiv for Bænkpres Med Stang er `0f93677e-79d9-4e24-ace9-0981e532ec17`. Den tidligere read-only-udvælgelse i `rbplnybmjwcoigiwtkuh` brugte `user_id IS NULL`, `is_private IS FALSE` og `erGodkendt IS TRUE`. [Kildedokumentation](revision-center-stage-origin.md) · [katalogillustration](source/bench-start.png).

Den tidligere 19-sekunders films fire appudsnit kommer fra Center Stage-masterklippet. Studiets hardwarekontur, lys og kamerabeskæringer er egne. Kabinet, display og appindhold eksporteres som én fil. Typografien uden for telefonen er Cabinet Grotesk og Satoshi. [Center Stage-master](source/product-center-stage.mp4) · [React Bits Center Stage](https://www.reactbits.dev/tools/center-stage) · [studie og kamera](source/fokus-studio.html) · [film- og opslagssats](composition.html).

Kør fra projektets rod med projektets Playwright Chromium, `cwebp` og `ffmpeg` tilgængelige. Den fulde kommando bygger først alle telefonudsnit og derefter film, stillbillede og delingsbillede.

```sh
node scripts/media-launch.cjs --studio
```

Når telefonudsnittene allerede findes, kan film og stillbilleder genbygges direkte fra masterklippet.

```sh
node scripts/media-launch.cjs marketing/launch/source/product-center-stage.mp4
```

`node scripts/media-launch.cjs` genbygger kun opslagets stillbillede og delingsbilledet. De oprindelige skærmrekonstruktioner kan eksporteres med `node scripts/media-reconstruct-app.cjs`. Deres Center Stage-indstillinger er `center-stage-video.json` og `revision-center-stage-*.json`.

## Kontrol af den korte lanceringsfilm og linkpreview den 18. november 2026

Den færdige MP4 blev afspillet ved normal hastighed i Chromium i en mobilvisning på 390 × 844. Afspilleren nåede 19,0 sekunder og rapporterede 570 billeder, 0 tabte og ingen afspilningsfejl. Åbning, program, registrering, pause, historik og adgang blev kontrolleret i den kodede film.

Projektets lokale side leverede delingsbilledet med HTTP 200 som JPEG i 1200 × 630. Filen var byteidentisk med eksporten, og billedtekst, titel og beskrivelse blev kontrolleret i en gengivelse af et linkpreview på 358 pixels.
