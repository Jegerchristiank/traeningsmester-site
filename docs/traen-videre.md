# Træn videre fra sidste gang

## Leverance og accept

| Behov | Kvalitetskriterium | Evidens / terminaltilstand |
|---|---|---|
| Første skærm | Overskrift, én formular og læsbar app ved første render | Desktop + mobil browser, ingen intro |
| Produktfortælling | Samme øvelse og eksempelværdier fra program til sæt, pause, historik | Kildesporing + 4 sammenhængende frames |
| Adgang og funktioner | Verificeret status, ingen designpriser eller offentligt adgangsløfte | Appkilde og releaseoplysninger |
| Tilmelding | Samtykke, bevaret email ved fejl, kun autoritativ kvittering, dubletter bevaret | Playwright med stubbet transport + servertests, ingen mails |
| Bevægelse | GSAP Flip, naturlig scroll, kapitelvalg, komplet statisk mobil/reduced motion | Browserinteraktion |
| Omtale | Lodret klip, still og dansk tekst i samme fortælling | Eksport afspillet og visuelt kontrolleret; ikke publiceret |
| Bevaring | /app, login, callbacks, server, support, sletning og afmelding | Afgrænsede route-/flowchecks |
| Måling | Besøg, forsøg, bekræftelse, fejl og delingsforsøg uden personindhold | Eventkontrakt, fravalg og payloadkontrol |
| Levering | Preview og PR; ingen merge eller produktion | Vercel/GitHub terminalstatus |

## Komposition

Den låste retning er et levende træningsark: varm hvid, mørk tekst, appens blå #0759C7. Store tætte overskrifter og tabulære træningstal. Asymmetrisk desktop; mobil prioriterer tekst og tilmelding før produktforløbet. Autentiske produktrekonstruktioner er tydeligt mærket som eksempeldata. Ingen påstand om konverteringsløft.

Heron bruges kun som konceptreference for samme objekt gennem flere tilstande; Podium for sammenhængende billedovergange. Ingen kode, identitet eller opfundet produktadfærd overføres. Paywall-reference bidrager fokuseret foto, tæt type og klart handlingslag, ingen priser. Top-web-design-corpus: Sebastian Wittigs responsive recomposition tilpasses en enkelt læserækkefølge; roterende headlines, komplekse menuer og ekstra præferencekontroller udelades. Ingen katalog-mikro-UX tilføjes.

## Arbejdsgrundlag

Isoleret worktree fra 9a77693; oprindelige lokale ændringer berøres ikke. Eksisterende lokale support- og kontosletningssider videreføres, fordi disse kontaktflader eksplicit skal bevares. De øvrige lokale privatlivsændringer forbliver i det oprindelige worktree; PR ændrer kun privatliv/cookies for den nye statistik. Site-repoet har ingen iOS-projekter eller GitHub Actions ved baseline; app-repoet ændres ikke. Ingen push til main.

Browser-plugin er ikke tilgængelig; Playwright bruges som udtrykkeligt bestilt. QA-evidens gemmes uden for Git. Produktmedier er leveranceaktiver og versionsstyres.


## Kontrolleret resultat

- Første skærm: renderet ved 1440×1000 og 390×844. Derudover 320px reflow uden horisontalt overflow. Overskrift og formular har ingen introanimation. Cabinet blev ændret fra 900 med for tæt tracking til 800 med -0,025em efter browsergennemgang.
- Produktforløb: fire sammenhængende, kildefaste rekonstruktioner. GSAP Flip ændrer samme desktopvisnings geometri; ScrollTrigger følger normal scrolling. Kapitelknapper virker. Mobil og reduceret bevægelse viser program, sæt, pause og historik direkte.
- Formular: 16 Playwright-scenarier fordelt på desktop/mobil bestået. Forkert e-mail, manglende samtykke, 503, 429, ufuldstændig HTTP200-kvittering og netværksfejl bevarer input og giver ikke succes. Gyldig serverkvittering viser præcis e-mail, fokus og rolig deling. Efter fokusrettelsen blev kun de to berørte successcenarier gentaget; de bestod. Alle ventelistekald er stubbet, ingen mails eller rigtige tilmeldinger.
- Eksisterende serverregler: 25 Node-tests bestået, herunder dublet/claim, kvitteringsmail og afmelding. TypeScript + Vite build bestået. `/app`, offentlige juridiske sider, support, sletning og afmelding prøvet i browser. Login/callback-kode og serverfunktioner har ingen diff.
- Analytics: samtykke til/fra og payload-whitelist prøvet i browser. En faktisk `marketing_visitor` er modtaget og genfundet read-only i PostHog. Ingen rå e-mails eller træningsindhold. Previewevents er særskilt mærket; der er ikke målt konverteringsløft.

### Sammenlignelig laboratoriemåling

Tre kolde indlæsninger pr. version/viewport, samme Chromium, lokal gzip-server, cache slået fra, 1,6 Mbps download, 150 ms latency, 4× CPU-slowdown. Målevindue: load + 5 sekunder uden interaktion. Før = baselinecommit 9a77693. Efter = redesign, inden sidste mindre tekst/fokusrettelser (samme mediefiler). Tallene er medianer, ikke feltdata.

| Måling | Desktop før → efter | Mobil før → efter |
|---|---|---|
| LCP | 1,452 → 1,216 s | 1,912 → 1,228 s |
| CLS | 0,0056 → 0 | 0,0095 → 0 |
| Overført ved målevinduets slutning | 267 → 459 kB | 267 → 319 kB |

Produktmedier øger overførte bytes, selv om den første læsbare komposition kommer tidligere. Effekten af virkelig trafik, enheder, CDN, brugerforståelse og konvertering er ikke målt. Ingen 3D-motor indlæses på forsiden; bevægelseskoden indlæses kun nær produktområdet på desktop uden reduceret bevægelse.

### Releasegrænse

Dette repo indeholder ingen Xcode-/Android-projekter, ci_scripts eller GitHub Actions-workflows. Branchpush går til en særskilt featurebranch og kan starte Vercel Preview. App-repo og dets Xcode Cloud-flow berøres ikke. Production/main merge afventer brugerens godkendelse. Vercel preview skal beholde den eksisterende deploymentsbeskyttelse.
