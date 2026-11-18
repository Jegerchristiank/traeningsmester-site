# Produktgrundlag for »Træn videre fra sidste gang«

Kontrolleret 15. november 2026. Kilderepo: `Jegerchristiank/Traeningsmester-app`, remote `Jegerchristiank/Traeningsmester-app`, HEAD `a733bd20614306f3bb754232616aea87266c01e2`. Lokalt main er ahead 1 og indeholder andre igangværende ændringer. Ingen appfiler eller Supabase-data er ændret i dette arbejde.

## Adgang og pris

- `docs/releases/2.0-124.md:3,14` beskriver alene intern TestFlight og ingen bestilt ekstern beta/App Store-udgivelse. Samme dokument er genlæst via GitHub connector på remote main. Dette dokumenterer releaseintention, ikke live App Store Connect-distribution.
- Offentlig adgang er ikke verificeret. Behold »Få besked om adgang« og »under udvikling«. Undlad downloadknapper, adgangsdato og løfte om platformslancering.
- `src/premium/ui/paywall-details.tsx:45,57,64-65`: priser og indhold er foreløbige; køb er ikke aktiveret i preview; designforslag ændrer ikke adgang. Ingen numeriske priser må kopieres til markedsføringen. Sikker FAQ: »Den endelige pris er ikke offentliggjort. Du får oplysninger om adgang og pris, før du tager stilling.«

Kontrolleret igen 17. november 2026. Build 2.0 (129) beskriver TestFlight for eksisterende testere. Opslag på appens egne pakke-id’er gav 0 resultater i Apples danske butik (`com.traeningsmester.ios`) og HTTP 404 i Google Play (`com.traeningsmester.android`). Forsiden bruger fortsat tilmelding om adgang. Bænkpresillustrationen i funktionsafsnittet er en lokal WebP fra det samme godkendte katalogbillede som programvisningen.

## Redaktionel funktionsoversigt med kilder

Alle funktioner beskrives som funktioner i appen under udvikling, ikke tilgængelighed for en offentlig køber.

- Egne programmer, træningsdage, rækkefølge og øvelser: `src/programs/ui/program-detail-screen.tsx:1337-1445`, `src/programs/ui/program-exercise-row.tsx:79-88,142-149`. Fælles mesoforløbsstruktur findes i `app/(ready)/cycle-detail.tsx`.
- Styrke: sæt, gentagelser, belastning, pause, RIR/RPE/tempo, super-/dropsæt: `src/workout/ui/workout-session-screen.tsx:678-749,837-1065`; `src/workout/ui/workout-exercise-targets.tsx:53-87`. Undlad at love bestemte offentlige plan-grænser.
- Kondition/aktiviteter og intervalmål: `src/activity/ui/activity-editor.tsx`, `src/activity/ui/activity-catalog.tsx`, `src/activity/catalog-metadata.ts:14-42`; aktuelle releaseeksempler for svømning og cykling i `docs/releases/2.0-124.md:5-6`.
- Sætregistrering, pause og tidligere værdier: `workout-session-screen.tsx:171-267` (pausetimer), `:1025-1048` (arbejdssæt og sidste sæt), `:1118-1125` (relative datoer), `:1691-1712` (timerens placering i bundfelt).
- Historik og tidligere sæt direkte fra træningen: `src/history/ui/exercise-history-sheet.tsx:57-68,94-166`; `src/history/set-values.ts:7-12` formatterer »62,5 kg × 8 gent.«. Historiksheet filtrerer sæt før den aktuelle trænings start, så registreringen fra 15. november vises i eksemplets næste træning 17. november.
- AI-programoprettelse og AI-tilpasning: `src/premium/ui/premium-screen.tsx:61-67`, kræver Premium/internet; `docs/releases/2.0-124.md:5-12` giver konkrete pilotbegrænsninger. Formulér som hjælp og forslag, ikke garanti for korrekt plan eller medicinsk egnethed.
- Program- og historikimport fra tekst/billeder: `premium-screen.tsx:78-84`; `src/history/import/ui/history-import-screen.tsx:201-206,245`; Premium og brugerens valgte AI-samtykke. Resultatet gennemgås før gemning. Release dokumenterer ufuldstændig billedaccept; lov ikke fejlfri import eller alle formater.
- Egne øvelser og personlige øvelses-GIFs: `premium-screen.tsx:68-76`; `src/custom-exercises/feature.ts:1-8`. Eksisterende features er flagafhængige; nye øvelser kræver Premium. Undgå at markedsføre intern kvote som endeligt kommercielt løfte.
- Social/træningsmakkere og valgfri deling: `src/social/hub/ui/social-hub-screen.tsx:142`, øvrige flows i `src/social/`. Formulér forsigtigt som muligheder under udvikling, ingen testerudsagn eller brugertal fundet til offentlig brug.
- Apple Sundhed: iOS-afgrænset adgang i `src/health/native.ts`; synligt forbindelsesvalg i `src/settings/ui/settings-training-preview.tsx:20-21`. Frivillig tilslutning og tilladelser.
- Apple Watch: `src/apple-watch/native.ts:51-70`, iOS-only native bridge, kræver parring/installeret Watch-app. Live Activity/låseskærm/pauser i `src/live-activity/` og settings-link `settings-training-preview.tsx:30`.
- Strava: `settings-training-preview.tsx:20`, `src/strava/authorization.ts:18-46` og `docs/releases/2.0-124.md:9`. Eksport implementeret, fysisk ende-til-ende modtagelse ikke verificeret af releasekilden. Android nytilslutning er afhængig af korrekt callbackkonfiguration. Undlad ubetinget integrationsløfte.
- **Ikke verificeret i den aktuelle kilde:** Health Connect og direkte Bluetooth-sensortilslutning. Ingen matches i `src`, `android`, `modules` ved denne kildeinspektion. Ældre web-privatlivstekst er ikke tilstrækkeligt produktbevis. Undlad dem i funktionsoversigten, medmindre yderligere aktuel kilde findes.

## Afsender/brand/foto

- Eksisterende webkilde `src/MarketingSite.tsx:27-34` angiver KRISTENSON, CVR 40679456 og supportkontakt. Personnavnet er desuden underbygget af den offentlige virksomhedsrolle: https://www.proff.dk/rolle/christian-kristensen/-/4008154847. Ingen godkendte testimonials identificeret.
- Appens originale mærke: `assets/tm-logo.png`; identisk godkendt kopi i `design/paywall/sport/logo.png`. Ingen genskabt wordmark.
- Brand action: `src/shared/ui/brand-theme.ts:2` #0A66E8. Til læsbare handlinger på hvid: `src/shared/ui/app-theme.ts:22-38` primary/selection #0759C7, tekst #15181D, sekundær #475467, udført #06703E.
- Godkendt foto `design/paywall/sport/athlete.jpg`: Victor Freitas, https://unsplash.com/photos/man-carrying-barbell-at-the-gym-CQwNdMxwjfk. `README.md` dokumenterer Unsplash License-kontrol og crop 57% / 40%; billedet udgør ingen anbefaling af appen.

## Fire produktframes leveret

`/tmp/tm-product-assets/{program,active,rest,history}.png`, 1206×2622, 402×874 CSS @3. Alle fire er gennemset som renderede billeder. Tilsvarende HTML og `render-frames.cjs` bevarer redigerbar kilde.

**Sandhedsstatus:** kildefaste, redaktionelle rekonstruktioner — ikke nye screenshots fra native runtime. Ingen real-user-data. Eksisterende native QA-screenshot `lokal QA-reference named-center-workout.png (ikke versionsstyret)` blev kun brugt som visuel layoutreference. Aktuelle kildekomponenter styrer labels, tilstande, felter, timerplacering, farver og historiksheet. Systemstatusbar og SVG-symboler er forenklet. Ingen apphandling foregives udført på serveren.

Kontinuitet: program »Mit styrkeprogram«, dag »Overkrop A«, Bænkpres Med Stang; plan 3×8, 60 kg, 2:00 pause. Sidste sæt 12. november 60 kg×8. Første sæt 15. november indtastes 62,5 kg×8; efter registrering er første række grøn, anden aktiv blå, pause 01:42 i bundfelt. 17. november åbnes Tidligere og genfindes præcis 15. november-sættet. Kun ét sæt demonstreres; eksemplet hævder ikke at alle tre er afsluttet.

Mærk på web/materiale: »Eksempeldata · rekonstruerede appvisninger«. Bevar læsbarhed frem for stærkt perspektiv.

I den længere bænkpresfilm ses den opdaterede afkrydsning. Første sætrække har en tom ring. Under gemning viser den et ur, og ved gemt sæt kommer det grønne flueben og næste aktive række. Tidligere registreringer viser afsluttede træninger. Den frivillige øvelse på websiden følger de samme tilstande og holder eksempeltallene i fanens sessionslager. Den henter illustrationen og pausemotivet fra webprojektets egne filer. [Billedkilder og appgrundlag](../marketing/launch/source/bench-film/README.md) · [Film og undertekster](../marketing/launch/README.md).

## Supabase read-only, lille godkendt udvalg

Kun schema metadata og offentligt godkendt øvelseskatalog læst; ingen brugere/programmer/logs. Filter: `user_id is null and is_private is false and "erGodkendt" is true`. To katalogresultater ved bænkpres-søgning; kun Bænkpres Med Stang anvendt. En afgrænset søgning på seated cable row gav ingen række.

- ID: `0f93677e-79d9-4e24-ace9-0981e532ec17`
- Navn: Bænkpres Med Stang / Barbell Bench Press.
- Offentligt godkendt medie: `https://rbplnybmjwcoigiwtkuh.supabase.co/storage/v1/object/public/images_workout_days/images_exercises/ai/v7-20261107-r40/0f93677e-79d9-4e24-ace9-0981e532ec17/male/a8/start.png`
- Hentet uden ændring til `/tmp/tm-product-assets/bench-start.png`; anvendt i alle frames. Illustration er katalogets godkendte illustration, ikke et brugerfoto.

## Supplerende kontrol: fuld funktionsoversigt

Følgende konkrete områder bør indgå, hvis oversigten skal dække appens væsentlige flader:

| Redaktionel række | Dokumenteret kilde | Status/afgrænsning |
| --- | --- | --- |
| **Find øvelser med Match.** Gennemse øvelser, filtrér efter muskel/træningsform, og gem dem, du synes om. | `src/match/ui/match-screen.tsx:903-925,1078-1087,1108-1160` — Dine valg, Fortryd, Spring over, Synes godt om og Synes MEGET om. | Implementeret. Brug produktets »Dine valg« frem for at opfinde en separat Favoritter-funktion. Gemning kan kræve internet. Ingen offentlig plan-/kvotegrænse verificeret. |
| **Se udviklingen i dine løft.** Følg belastning, gentagelser og volumen over tid. | `src/history/ui/history-progress.tsx:76-80,131-150,236` og `src/history/progress.ts`. | Implementerede mål er belastning pr. sæt, gentagelser, volumen pr. sæt og samlet arbejdssætvolumen. Vis kun registrerede værdier; ingen løfter om fremgang. |
| **Træn i flere centre.** Gem dine centre, vælg det relevante, og sammenlign med tidligere registreringer samme sted. | `src/centers/ui/centers-settings.tsx:183-204`; `src/centers/ui/center-tracking-controls.tsx`; `src/programs/ui/program-center-picker.tsx`. | Manuelt centervalg findes. Automatisk genkendelse er valgfri og afhænger af lokationstilladelse; en igangværende træning beholder sit center. |
| **Del et program.** Lad en anden følge dit program via en kode. | `src/programs/ui/program-sharing-sheet.tsx:97-104,149-167`. | Modtager kan se programmet; kun afsender kan ændre det. Personlige GIFs kan følge med (originalfotos deles ikke). Det er deling, ikke en verificeret PDF/CSV-eksport. |
| **Opvarmning og egne træningsmål.** Hold opvarmningssæt adskilt fra arbejdssæt; tilpas gentagelser, belastning og pauser. | `src/workout/ui/workout-warmup-panel.tsx:56-92`; `src/workout/ui/workout-exercise-targets.tsx:53-87`. | Implementeret. Kan indgå i eksisterende registreringsrække, ingen separat stor sektion nødvendig. |
| **Kropsvægt og enheder.** Angiv kropsvægt og vælg kg eller lbs. | `src/settings/ui/settings-screen.tsx:1002-1026`. | Kropsvægtfeltet bruges, når en øvelse regnes med kropsvægt. Ikke belæg for at love en særskilt kropsvægtgraf eller kost-/kropsanalyse. |

Der blev ikke fundet en offentlig PDF/CSV-download i de aktuelle historik-, indstillings- eller programflader. Brug kun de allerede dokumenterede eksterne eksportforbindelser Apple Sundhed/Strava; programdeling kan beskrives særskilt.

**Afsendernavn:** Repoernes relevante offentlige tekst/kontaktfiler gav ikke »Christian Kristensen«. Webkilden angiver KRISTENSON og CVR; »Christian« forekommer i eksempelprofiler og er ikke tilstrækkelig afsenderverifikation. Seneste git author er brugernavnet Jegerchristiank. Sikkert offentligt afsendernavn med nuværende evidens er **KRISTENSON**; fuldt personnavn bør ikke kaldes verificeret på dette grundlag.


## Eksterne referencekilder

- Center Stage: https://www.reactbits.dev/tools/center-stage
- Heron, kreativ konceptreference: https://tympanus.net/codrops/2026/10/12/heron-ai/
- Podium, billedkontinuitet: https://tympanus.net/codrops/2026/06/23/podium-building-a-website-where-running-becomes-storytelling/
