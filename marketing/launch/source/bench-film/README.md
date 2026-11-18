# Hvad løftede jeg sidst?

Bænkpresfilmen har to kamerabeskæringer, 1440 × 810 og 720 × 1280. Begge varer 40 sekunder ved 24 billeder i sekundet. Den danske fortællerstemme, musikken og de otte valgfrie undertekster følger samme tidslinje. [Færdige film og undertekster](../../README.md) · [Lydkilder og stemmekreditering](audio/README.md).

## Genbyg billederne

Kør fra projektets rod. Brug macOS med Menlo, projektets Playwright Chromium, ffmpeg og Python med `numpy`, `opencv-python-headless`, `Pillow` og `fonttools[woff]`. Læg de tre originalklip i en mappe ved siden af projektet.

```sh
node marketing/launch/source/bench-film/capture-ui.cjs output/bench-film/ui
python scripts/media-unpack-bench.py output/bench-film/bench
python -B scripts/media-bench-film.py \
  --grip ../source-clips/pexels5320004.mp4 \
  --press ../source-clips/pexels5320001.mp4 \
  --chalk ../source-clips/pexels31794153.mp4 \
  --bench output/bench-film/bench \
  --output output/bench-film
```

Brug `--preview-only` for at sammenligne seks nøglebilleder fra hver beskæring. `--format landscape` og `--format portrait` kan gengive ét format ad gangen. Rendereren afkoder webprojektets Cabinet Grotesk 800 og Satoshi 400 til midlertidige skrifter. Appvisningerne bruger systemskriften.

## Saml billede og lyd

Genskab lydmasteren med afhængighederne i lydopskriften. Ffmpeg kopierer de færdige billed- og lydspor ind i hver MP4. [Lydopskrift](audio/README.md).

```sh
python -B marketing/launch/source/bench-film/audio/render.py output/bench-film/audio

mux_film() {
  ffmpeg -i "output/bench-film/bench-film-$1-silent.mp4" \
    -i output/bench-film/audio/mix.m4a \
    -map 0:v:0 -map 1:a:0 -c copy -movflags +faststart \
    -metadata title="Hvad løftede jeg sidst? – Træningsmester" \
    -metadata artist="Træningsmester" \
    -metadata description="Bænkpres med eksempeldata og rekonstruerede appvisninger. Dansk AI-stemme og original musik." \
    -metadata:s:a:0 language=dan -metadata:s:a:0 handler_name="Dansk tale og musik" \
    "output/bench-film/baenkpres-$2.mp4"
}
mux_film landscape bred
mux_film portrait hoej
```

De godkendte eksporter og undertekster til webafspilleren ligger i [public/product/film](../../../../public/product/film). Originalklip og arbejdsfiler bliver i den lokale produktionsmappe.

## Billedkilder

Tima Miroshnichenko har filmet løftet og vægtskiven. K (@kelly) har filmet hænderne med magnesium. Optagelserne bruges som træningsmiljø. [Løft](https://www.pexels.com/video/a-person-doing-bench-press-exercise-5320004/) · [Vægtskive](https://www.pexels.com/video/a-person-doing-bench-press-exercise-5320001/) · [Magnesium](https://www.pexels.com/video/chalk-dust-clouds-from-clapping-hands-31794153/) · [Pexels’ licens](https://www.pexels.com/license/).

Telefonen på bænken genbruger kampagnens iscenesatte ImageGen-billede. Skærmen er rekonstrueret med eksempeldata efter den officielle apps `workout-session-screen.tsx`. Øvelsen er scrollet i position på det fysiske glas. Den tomme ring, uret under gemning, det grønne flueben og historikken er kontrolleret i appkilden. Pausens illustration, bænkpresmotivet og logoet kommer fra Træningsmester. [Telefonmaster](../magnesium/baenk.webp) · [Øvelse](../bench-start.png) · [Produktgrundlag](../../../../docs/product-basis.md).

## Klipning

| Tid | På skærmen |
| --- | --- |
| 0–6 sek. | Grebet om stangen. »Hvad løftede jeg sidst?« En anden vinkel følger vægtskiven. |
| 6–11 sek. | Magnesium bliver til »62,5«, og tallet lander i appens vægtfelt. |
| 11–18 sek. | Kameraet går tæt på samme telefon. Sidste gang var det 60 kg × 8. Første sæt i dag er 62,5 kg × 8. |
| 18–20 sek. | Første ring viser et ur under gemningen og skifter til grønt flueben. Anden række bliver aktiv. |
| 20–24 sek. | Den grønne ring åbner billedet af hænderne. Pausen, som startede ved 18,35 sekunder, passerer 01:58. |
| 24–28 sek. | Hænderne og musikken får fire sekunder alene. |
| 28–34 sek. | »Næste træning.« På samme telefon viser »Tidligere« det gemte sæt på 62,5 kg × 8. Datoerne 12. og 15. november 2026 er eksempeldata. |
| 34–40 sek. | Vægtskive, logo og »Få besked om adgang«. |

Magnesiumtallet, overgangen fra ringen og den store pausetid over hænderne er filmgrafik. Underteksterne har plads i billedets nederste del.
