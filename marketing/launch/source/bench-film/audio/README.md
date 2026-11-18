# Lyd til bænkpresfilmen

`speak.da.flac` rummer de otte danske replikker fra første frame til sidste frame. Den tabsfri monofil er 40 sekunder lang, 48 kHz og 24 bit. Manus med de otte visningstider ligger i [filmens danske undertekster](../../../../../public/product/film/baenkpres-da.vtt).

## Genbyg musik, effekter og mix

Kør fra repositoryets rod i et Python-miljø med NumPy, SciPy, SoundFile og pyloudnorm samt FFmpeg på søgestien.

```sh
python -B marketing/launch/source/bench-film/audio/render.py output/bench-film/audio
```

`music.wav` og `foley.wav` er de separate spor med kontrabas og håndlyde. I `music-ducked.wav` sænkes bassen med op til 3,8 dB gennem hver hel replik. `mix.wav` er stereomasteren. `mix.m4a` er 192 kbit/s AAC til begge filmformater. Alle lydkilder ligger i projektet, så mixet kan genbygges offline.

En plukket kontrabas følger løftet. I pausen tager et kort buestrøg over. Da sættet dukker op i historikken, vender den plukkede figur tilbage. Tonernes tid og styrke kan redigeres i `music/notes.py`. [Instrument, optagelser og licens](music/README.md).

Det første kridtklap rammer håndkontakten ved 6,750 sekunder. De to blødere anslag ved 21,917 og 25,083 sekunder bruger hver sit udsnit af rigtige hænder. Gemningen og historikken er stille. Redigér håndlydenes placering i `foley/cues.json` og deres fælles niveau i `render.py`. [Billedtider, lydkilder og tilladelser](foley/README.md).

## Stemme og oprindelse

Dansk AI-stemme med Røst fra CoRal-projektet og Alexandra Instituttet. Optagelserne er genereret med Røst-v3 Chatterbox 350M ved modelrevision `2a12d9c0be51fbebd6ae100ab5578caef8b6bd4f`. Den officielle, syntetiske stemmeprøve “Mic” fra samme revision gav filmen én gennemgående stemme. Den leverede stemmefil er færdig tale. Den kan redigeres og mixes offline. [Modelbeskrivelse og eksempler](https://huggingface.co/CoRal-project/roest-v3-chatterbox-350m) · [Den anvendte stemmeprøve](https://huggingface.co/CoRal-project/roest-v3-chatterbox-350m/blob/2a12d9c0be51fbebd6ae100ab5578caef8b6bd4f/audio_samples/01_mic_00_t0.7_p0.95_k600_r1.2.wav).

Alexandra Instituttets modellicens beskriver genereret lyd i § 5 og brugsbegrænsningerne i Attachment A. Filmen angiver “Dansk AI-stemme” ved afspilleren. [Licens ved den anvendte revision](https://huggingface.co/CoRal-project/roest-v3-chatterbox-350m/blob/2a12d9c0be51fbebd6ae100ab5578caef8b6bd4f/LICENSE).
