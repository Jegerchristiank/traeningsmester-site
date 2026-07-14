# Juridisk driftscheck

Senest gennemgået: 14. juli 2026.

Dette dokument beskriver den tekniske baseline for Træningsmesters offentlige
pre-launch-side og webappen. Det er et driftsdokument, ikke en juridisk
garanti eller erstatning for konkret rådgivning.

## Implementeret baseline

- KRISTENSONs navn, CVR, fysiske adresse, offentlige kontaktmail og telefon er
  direkte tilgængelige i footer, vilkår og privatlivspolitik.
- Ventelisten kræver et aktivt og specifikt emailsamtykke. Version, tekst,
  tidspunkt, kanal og formål gemmes server-side. Afmelding er gratis,
  tokenbundet og idempotent.
- Den interaktive afmeldingsside accepterer kun token i URL-fragmentet og
  sender det videre i POST-body. Query-token bruges kun på API-endpointet til
  mailklienters standardiserede one-click-afmelding.
- Privatlivspolitikken beskriver formål, retsgrundlag, datatyper, modtagere,
  internationale overførsler, opbevaring, rettigheder og klageadgang.
- Nye webappkonti kræver særskilt udtrykkeligt samtykke til de trænings-,
  kropsvægt- og aktivitetsdata, brugeren selv vælger at tilføje. Valg, version
  og tidspunkt skrives til Supabase Auth-metadata. Eksisterende konti uden den
  aktuelle samtykkeversion møder samme valg, før appens dataflader eller lokale
  appkopi indlæses.
- Produktionsbuilds kan ikke falde tilbage til lokal browserkonto eller
  DEBUG-fixtures, hvis Supabase mangler. Kun en tidligere markeret, verificeret
  remote-cache kan bruges ved en midlertidig læsefejl. Logout rydder den
  aktuelle lokale appkopi og cachemarkøren.
- Marketingforsiden indeholder ingen annoncepixels, tredjepartsanalyse eller
  ikke-nødvendig lokal lagring. Derfor vises der ikke et tomt, vildledende
  cookiebanner. Nye ikke-nødvendige teknologier skal blokeres indtil samtykke.
- Mobilnavigationen har fokusretur, Escape-lukning, baggrundslås, scroll på
  lave skærme og navngivne standardelementer. Webappens menu og modaler har
  fokusfælde, Escape-lukning og inert baggrund.

## Driftskrav før og efter deployment

Følgende kan ikke bevises alene af frontendkoden og skal holdes aktuelle:

1. Kontaktmailen skal være overvåget, og privatlivs- og slettehenvendelser skal
   have en dokumenteret arbejdsgang og svartid.
2. Databehandleraftaler, underdatabehandlerlister og overførselsgrundlag for
   Supabase, Vercel og Resend skal arkiveres og genkontrolleres ved ændringer.
3. Retention og sletning skal verificeres i Supabase, leverandørlogs og backups.
   Auth-metadata er den nuværende samtykkekvittering; før en bred app-lancering
   bør samtykke også skrives til en append-only server-side log, som brugeren
   ikke kan redigere.
4. Hver produktiondeploy skal kontrolleres for nye scripts, pixels, embeds,
   cookies og lokal lagring. Tilføjes ikke-nødvendig tracking, kræves reel
   opt-in før teknologien aktiveres.
5. Betaling er ikke aktiv på pre-launch-siden. Før salg åbnes, skal checkout
   vise samlet pris, bindings-/fornyelsesperiode, opsigelse, fortrydelsesret og
   øvrige forbrugeroplysninger før bestilling.
6. Tilgængelighed skal fortsat testes med tastatur, skærmlæser, zoom og
   reduceret bevægelse; erklæringen må kun beskrive verificeret adfærd.

## Centrale officielle kilder

- [E-handelsloven](https://www.retsinformation.dk/eli/lta/2002/227), især § 7
- [Databeskyttelsesforordningen](https://eur-lex.europa.eu/legal-content/DA/TXT/?uri=CELEX:32016R0679), især artikel 6, 9, 13 og 15-22
- [Markedsføringsloven](https://www.retsinformation.dk/eli/lta/2024/1420), især § 10 og § 13
- [Cookiebekendtgørelsen](https://www.retsinformation.dk/eli/lta/2011/1148)
- [Datatilsynets GDPR-guide til små virksomheder](https://www.datatilsynet.dk/regler-og-vejledning/gdpr-univers-for-smaa-virksomheder/trin-4-oplys-om-at-du-behandler-personoplysninger)
- [Forbrugerombudsmandens spamvejledning](https://forbrugerombudsmanden.dk/media/bjajzdv1/vejledning-om-spamforbuddet-2021-a.pdf)
