# Visuel revision — kontrol

Udgangspunkt: main `882d107`, den første udgivne redesignversion. Reference: Apples produktprioritering og appens godkendte fotografiske paywall. Apple er en kvalitetsreference, ikke et design der kopieres.

## Ændret

- Heroen bruger to faste tekstlinjer og et frontalt appviewport med ét større udsnit af samme sætrække. De dekorative blå ord, det skrå hero-kort og den gentagne store billedramme er fjernet.
- På mobil kommer tekst og adgangsknap før produktet, og den eneste formular følger efter produktet. Desktop beholder formularen ved teksten. Adgangsknapperne fokuserer samme felt.
- Kapitelknapperne bliver tilgængelige under desktopforløbet. Mobilknapper fører til kapitlets begyndelse; mobil og reduceret bevægelse viser læsbare udsnit direkte.
- Program, 62,5 kg × 8, pause og historik er knyttet tydeligere sammen i teksten. Alle visninger bruger samme eksempeldata.
- Træningsfotoet bærer afsnittet om træningsmuligheder. Afsenderpræsentationen står separat, så fotoet ikke kan forveksles med et portræt af Christian. Integrationernes navne og status står direkte i den korte oversigt.
- Still, delingsbillede og filmens åbning/slutning følger den nye komposition. Filmens kildefaste produktsekvens er genbrugt.

## Verificeret

| Område | Status | Evidens |
| --- | --- | --- |
| Desktop og mobil | Bevist | Faktisk browsergennemgang ved 1280 × 720 og 390 × 844 samt Chromium-captures ved 1440 × 1000 og 390 × 844. Hero, kapitler, foto, afsender og footer gennemset. |
| Visuel iteration | Bevist | Heroens sætnærbillede er løftet og forstørret efter kritik; grå canvas-kanter opdaget i integrationen og fjernet ved ny Center Stage-export. |
| Produktmedier | Bevist som rekonstruktioner | Samme kildeframes, samme tal, korrekt registreret sæt/pause/historik. Seks scene-JSON og oprindelsesnote er versionsstyret. Ingen nye native optagelser. |
| Formular og navigation | Bevist med simulerede serversvar | 16 Playwright-scenarier bestået på mobil/desktop: validering, 503, 429, ufuldstændigt 200-svar, netværksfejl, accepteret svar, dobbeltforsøg, deling, fokus, tastatur, billeder og reduceret bevægelse. Ingen rigtige tilmeldinger eller mails. |
| Analyse | Bevist i browserkontrakten | Ingen events før statistikvalg; eventpayloads indeholder ikke e-mail eller træningsindhold; fravalg stopper events. Produktionskonfigurationen fra PR #1 er ikke ændret. |
| App og servergrænse | Bevist | `/app`, support, sletning, privatliv, vilkår og afmelding kontrolleret. Ingen ændringer i auth-, callback-, app- eller serverkode. Hero-preload kører kun på `/`. |
| Build og billedbudgetter | Bevist | TypeScript/Vite build samt de tre eksisterende experience-contracts bestået. Responsiv 640-pixel hero-variant reducerer billedtrafik. |
| Lanceringsmateriale | Bevist | Endelig film afspillet til slut uden fejl: 18,5 s, 1080 × 1920, H.264, 30 fps, 555 frames. Still og OG gennemset ved 390 px. Intet sendt eller publiceret. |
| Konverteringsløft | Ikke bevist | Ingen påstand om højere konvertering eller brugeraccept ud fra screenshots og tekniske tests. |

## Performance

Tre skiftevis før/efter-kørsler i Chromium ved 390 × 844, DPR 1, 4× CPU, 150 ms latency, 1,6 Mbit/s download og tom cache. Begge produktionsbuilds blev serveret af samme Vite preview-server med gzip. Målingen gælder første viewport uden statistiktilvalg, ikke feltdata fra rigtige besøgende. Rådata: [performance.json](performance.json).

| Median | Før | Efter |
| --- | ---: | ---: |
| Første indhold / FCP | 1,18 s | 1,47 s |
| Største indhold / LCP | 1,18 s | 1,47 s |
| Layoutforskydning / CLS | 0 | 0 |
| Ressourcebytes ved indlæsning | 318 KB | 301 KB |
| Produktets begyndelse på mobil | 846 px | 399 px |

Den nye version viser produktet i første viewport. Den er ikke dokumenteret hurtigere: LCP og FCP er cirka 0,29 s senere under disse forhold. Tidlig, responsiv indlæsning af heroen forbedrede revisionens første måling fra 2,08 til 1,47 s uden at hente hero-billedet på `/app`.

## Releasegrænse

Site-repoet har ingen iOS-projektfiler, Xcode Cloud-scripts eller GitHub Actions-workflows. Vercels produktionsbranch er verificeret som `main`; revisionsbranchen er kun til preview og review. Merge og produktionsudgivelse af denne revision afventer brugerens vurdering.
