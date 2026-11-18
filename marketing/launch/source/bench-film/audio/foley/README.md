# Håndlydene i bænkpresfilmen

Håndlydene er efterlagt med optagelser af klap og hud mod hud. De tre Pexels-klip har intet lydspor. Hændernes bevægelser styrer derfor placering, styrke og afstand. Appens gemning, pauseur og historik er stille.

## Billedtider

Framenumrene tæller fra nul ved 24 billeder i sekundet. Den tydeligste transient i hvert anslag falder på den valgte kontaktframe. Bevægelsesuskarpheden giver en visuel usikkerhed på cirka ét billede.

| Frame | Tid | Det, man ser og hører |
| --- | --- | --- |
| 162 | 6,750 s | Håndfladerne mødes. Ét kort, tørt klap. |
| 166 | 6,917 s | Et svagt strøg følger klappet, mens hænderne bevæger sig fra hinanden. |
| 526 | 21,917 s | En blød kontakt mellem håndfladerne. |
| 559 | 23,292 s | Hænderne glider fra hinanden. |
| 602 | 25,083 s | Anden håndkontakt i pausen, med et mørkere anslag. |
| 644 | 26,833 s | Sidste korte friktion, mens fingrene slipper. |

## Optagelser

- Ashe Kirk (OwlStorm / Owlish Media) har optaget *Solo Clap*. Udsnittet fra 0,706 til 0,896 s i den offentlige MP3 bruges til filmens første håndkontakt. [Optagelse og ophaverens CC0-angivelse](https://freesound.org/people/OwlStorm/sounds/151219/) · [Anvendt kildefil](https://cdn.freesound.org/previews/151/151219_140737-hq.mp3).
- Joseph Sardin har optaget *Rubbing hands*. Fire forskellige udsnit giver de senere kontakter og friktionslyde. Præcise kildetider og filernes SHA-256 står i [cueplanen](cues.json). [Originaloptagelse](https://bigsoundbank.com/rubbing-hands-s0663.html) · [Anvendt WAV](https://bigsoundbank.com/UPLOAD/bwf-en/0663.wav) · [Ophaverens CC0-vilkår](https://bigsoundbank.com/licenses.html).

Begge optagelser er frigivet under CC0. Kilder og tilladelser blev kontrolleret den 18. november 2026. [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

## Genbyg sporet

Kør fra projektets rod med Python, NumPy og FFmpeg. De fem kildelyde ligger i `samples/`.

```sh
python marketing/launch/source/bench-film/audio/foley/build-foley.py \
  --output output/bench-film/audio/foley-v3.wav
```

Det separate spor varer 40 sekunder ved 48 kHz, stereo og 24 bit. Det kraftigste anslag er −20 dBFS før mix. Ved siden af WAV-filen skrives en JSON-fil med de enkelte lydes samplepositioner. Filmens mixer bruger samme `render_foley()` og indstiller det samlede niveau i [render.py](../render.py).
