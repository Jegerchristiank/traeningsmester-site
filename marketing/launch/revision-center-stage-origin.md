# Frontale produktmedier · 15. november 2026

Disse seks filer er faktisk eksporteret fra React Bits Center Stage med projektets eksisterende rekonstruerede appvisninger. Ingen nye native optagelser, private brugerdata, UI-retouchering eller opfundne funktioner. Bevar den synlige markering **Eksempeldata · rekonstruerede appvisninger** på siden og i materiale.

| Fil i public/product | Format | Størrelse |
| --- | --- | --- |
| revision-full-set.webp | RGBA WebP | 960 × 2088, 106.1 KB |
| revision-detail-set.webp | RGBA WebP | 1200 × 510, 31.7 KB |
| saetraekke-600.webp | Nedskaleret udgave af samme sætrække til smalle visninger | 600 × 255 |
| revision-program.webp | RGBA WebP | 960 × 1250, 54.2 KB |
| revision-set.webp | RGBA WebP | 960 × 1083, 56.7 KB |
| revision-rest.webp | RGBA WebP | 960 × 1403, 70.8 KB |
| revision-history.webp | RGBA WebP | 960 × 939, 31.9 KB |

De tilhørende `revision-center-stage-{full,detail,program,set,rest,history}.json` kan importeres i https://www.reactbits.dev/tools/center-stage. Upload derefter mediet gennem studiets Upload-knap. Heleframe bruger `screen-set.webp`; øvrige kilder beskæres før upload:

| Scene | Kilde i public/product | Udsnit x / y / bredde / højde |
| --- | --- | --- |
| detail | screen-set.webp | 60 / 1446 / 1080 / 440 |
| program | screen-program.webp | 0 / 380 / 1206 / 1580 |
| set | screen-set.webp | 0 / 770 / 1206 / 1365 |
| rest | screen-rest.webp | 0 / 770 / 1206 / 1780 |
| history | screen-history.webp | 0 / 1400 / 1206 / 1180 |

Alle scener bruger Card, frontal 0°, transparent baggrund, slukket skyggeplan (`shadow: 0`) og ingen grain/vignette. Heleframe har afrundede hjørner uden hardware eller ekstra statusbar. Full eksporteres 1440 × 2560, beskæres x130/y0/1180×2560 og skaleres til 960 × 2088. Detail eksporteres 1920 × 1005, beskæres x0/y96/1920×816 og skaleres til 1200 × 510. Kapitelcanvas beskæres tæt omkring kortet med cirka 20 pixels transparent margin og skaleres til 960 pixels bredde. Der er kun udført billedbeskæring og skalering efter Center Stage-export; ingen apptekst eller værdier er ændret.

Kvalitetskontrol: kilde og fuldviewport er sammenlignet side om side ved 260 og 166 CSS-pixels i Chromium. Nærbilledet er kontrolleret ved 278 CSS-pixels; alle kapitler ved 260 CSS-pixels. De samme tal, hele første sætrække, pausetid 01:42 og historikkens 62,5 kg × 8 er bevaret. Fuldt viewport er produktkontekst; nærbilledet bærer de små tal på mobil. Rekonstruktionens statusbar og ikoner er fortsat tilnærmede, og kildens grammatiske “1 øvelser” er bevaret. Ingen påstand om ny native runtime-verifikation eller målt konverteringsforbedring.

Rettelse efter integration: Center Stages skyggeplan efterlod oprindeligt alpha 2–8 på hele canvas og gav synlige grå rektangler. Alle seks filer er reexporteret med shadow=0. Den komplette yderste pixelrække på alle fire sider er nu verificeret alpha=0 for hver fil. De nye exports er gennemset på præcis #f6f5f1; en eventuel skygge skal tilføjes med CSS drop-shadow, som følger billedets faktiske alphaform.
