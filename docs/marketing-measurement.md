# Måling af adgangstilmelding

Forsiden måler kun efter det særskilte, frivillige valg under **Statistik** i footer. Mailtilmelding og analysestilsagn er uafhængige. Et afslag eller senere tilbagetrækning stopper nye events. Hændelser fra før samtykke køres ikke igennem bagefter.

| Event | Betydning |
| --- | --- |
| `marketing_visitor` | Én visning af forsiden pr. indlæst side med analysestilsagn. Ikke unikke personer. |
| `marketing_attempt` | Et formularforsøg; kan efterfølges af klientvalidering. |
| `marketing_confirmed` | Klienten modtog HTTP-succes **og** `{ok:true, confirmation:"accepted"}` fra `/api/waitlist`. Det er en serverkvittering, ikke bevis for leveret mail, og serveren skjuler bevidst dubletstatus. Ikke antal nye, unikke tilmeldte. |
| `marketing_error` | En fast fejlkategori: `email`, `consent`, `rate_limit`, `service` eller `network`. |
| `marketing_share_attempt` | Tryk på Del: `native` eller `copy`. Ikke dokumenteret deling eller omtale. |

Adapteren bruger PostHogs [Capture API](https://posthog.com/docs/api/capture#single-event) uden SDK, autocapture, replay, identify eller personprofiler. Payload bygges fra en whitelist; rå e-mail, formularværdier, træningsindhold, referrer og URL-parametre indgår ikke. Det tilfældige side-id findes kun i RAM. Browseren gemmer kun valget `allowed`/`denied` i `tm-marketing-statistics-v1`. `$process_person_profile:false` fravælger profiler, og `$geoip_disable:true` fravælger [GeoIP-berigelse](https://posthog.com/docs/privacy/data-collection#ip-data-capture). Projektets verificerede indstilling `anonymize_ips:true` frasorterer lagring af klient-IP; modtagerserveren modtager fortsat IP som led i netværksforbindelsen.

## Konfiguration

Byg med `VITE_POSTHOG_PROJECT_TOKEN` og `VITE_POSTHOG_HOST`, læst fra det valgte PostHog-projekt. Projektet for dette preview er det tilsluttede EU-projekt **252804**. De faktiske værdier findes i den ignorerede `.env.local`; tilføj dem i Vercels preview-miljø før build. Tokenet er en offentlig write-only projektnøgle, men hold konfiguration ude af kildekoden. CSP `connect-src` skal tillade den konfigurerede host. Uden begge værdier foretages ingen analyseanmodninger, og statistikvalget er deaktiveret.

Kald `recordMarketingVisit()` ved montering af forsiden; funktionen tåler React Strict Modes gentagelse. Indsæt `<AnalyticsConsent />` i footer. Formularen registrerer de øvrige fire events selv. Ingen event er nødvendig for at tilmeldingen kan virke.

Fokuserede tests i `tests/marketingAnalytics.test.ts` kontrollerer manglende samtykke, tilbagetrækning, whitelist, manglende konfiguration og præcis serverkvittering. Browserkontrol skal desuden kontrollere netværksrequests ved samtykke til/fra, inputbevarelse og de faktiske UI-tilstande. Mockede serverkvitteringer tester brugerfladen uden ventelistemails; de er ikke bevis for en rigtig databaseindsættelse.

## Kontrolleret integration

Browserafprøvning har kontrolleret ingen events før tilladelse, inputbevarelse, serverfejl/succes og fravalg. Én særskilt `marketing_visitor` fra en rigtig browser er modtaget og genfundet read-only i PostHog252804 den 15. november 2026. Eventet er mærket `environment: preview`; rapporter om den offentlige side skal filtrere på `environment: production`. De øvrige hændelser og formularsvar er afprøvet med stubbet netværk, uden ventelistemails. Denne prøve dokumenterer integrationen, ikke faktisk konvertering.
