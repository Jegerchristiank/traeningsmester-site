import { useEffect } from "react";
import "../training-information.css";

const entryUrl = typeof window === "undefined" ? null : window.location.href;

const featureGroups = [
  {
    title: "Program og øvelser",
    topics: [
      [
        "Programmer",
        "Byg træningsdage med egne rækkefølger, mål og pauser. Periodiserede programmer kan fordele arbejdet over flere uger. Oprettelse af egne øvelser kræver Premium.",
      ],
      [
        "Øvelsesbibliotek",
        "Filtrér øvelser efter muskelgruppe og træningsform. I Match kan du gemme dem, du vil vende tilbage til, under Dine valg. Adgangen kan afhænge af medlemskab.",
      ],
      [
        "Import og AI",
        "Med Premium, internetforbindelse og dit AI-samtykke kan du importere indhold eller få forslag til et program. Gennemgå resultatet, før du gemmer det. Adgang og kapacitet kan variere.",
      ],
    ],
  },
  {
    title: "Under og efter træningen",
    topics: [
      [
        "Sæt og historik",
        "Registrér opvarmning og arbejdssæt hver for sig. Følg vægt, gentagelser og volumen i historikken, og angiv tempo, RIR eller RPE, når det er relevant. Du kan bruge kg eller lbs.",
      ],
      [
        "Kondition",
        "Registrér løb, gang og cykling. Vælger du at bruge GPS udendørs, kan appen registrere din rute og distance.",
      ],
      [
        "Træningscentre",
        "Vælg center manuelt, og se, hvad du tidligere har løftet der. Du kan også give tilladelse til, at appen genkender dit center via din placering.",
      ],
    ],
  },
  {
    title: "Deling og forbindelser",
    topics: [
      [
        "Træningsmakkere",
        "Tilføj venner, send beskeder, og vælg, hvem der må se et træningsresumé. Deler du et program via en kode, beholder du retten til at redigere det.",
      ],
      [
        "Apple Sundhed og Watch",
        "På iPhone kan du forbinde Apple Sundhed og vælge, hvad appen må dele. Watch-funktionerne kræver et parret Apple Watch med urappen installeret.",
      ],
      [
        "Strava",
        "Valgfri forbindelse til eksport af aktiviteter. Integrationen er under udvikling. Tilgængeligheden afhænger af platform, opsætning og release.",
      ],
    ],
  },
] as const;

const questions = [
  {
    title: "Hvornår kan jeg prøve appen?",
    answer:
      "Der er endnu ingen offentlig adgangsdato. Skriv dig op, så får du en e-mail, når der er nyt om at prøve Træningsmester.",
  },
  {
    title: "Hvilke enheder understøttes?",
    answer:
      "Træningsmester udvikles til iPhone og Android. Apple Sundhed og Apple Watch hører til Apple-platformen. De konkrete enhedskrav følger med, når adgangen åbner.",
  },
  {
    title: "Hvad kommer det til at koste?",
    answer:
      "Det er gratis at skrive sig op. Der er endnu ingen offentlig pris for appen. Du får adgangsvilkårene at se, før du skal beslutte dig.",
  },
  {
    title: "Hvad sker der med min e-mail?",
    answer:
      "KRISTENSON bruger din e-mail til beskeder om lancering og adgangsrunder. Du kan afmelde dig gratis via linket i hver mail.",
    link: { href: "/privatliv", label: "Læs om privatliv." },
  },
];

export default function TrainingInformation() {
  useEffect(() => {
    // Prerendered pages already expose the anchor to the browser at load time.
    if (document.getElementById("root")?.dataset.page === "/") return;
    const hash = window.location.hash;
    if (hash !== "#funktioner" && hash !== "#faq") return;
    if (entryUrl !== window.location.href || window.scrollY !== 0) return;
    const target = document.getElementById(hash.slice(1));
    if (!target || target.getBoundingClientRect().top < window.innerHeight)
      return;
    target.focus({ preventScroll: true });
    target.scrollIntoView();
  }, []);

  return (
    <div className="training-information">
      <section id="funktioner" aria-labelledby="feature-heading" tabIndex={-1}>
        <h2 id="feature-heading">Til din måde at træne på.</h2>
        <p className="training-information-intro">
          Vælg selv øvelser og pauser i dit program. Registrér vægt og
          gentagelser, når du løfter, eller tid og distance, når du løber, går
          eller cykler.
        </p>
        <p className="training-information-apple">
          På iPhone kan du forbinde Apple Sundhed. Har du et parret Apple Watch,
          kan du også bruge urappen under træningen.
        </p>
      </section>
      <details className="all-features" aria-labelledby="feature-heading">
        <summary>
          <span className="features-open-label">Se alle funktioner</span>
          <span className="features-close-label">
            Skjul funktionsoversigten
          </span>
        </summary>
        <div className="feature-overview">
          <p>
            Funktioner i mobilappen under udvikling. Adgang afhænger af platform
            og medlemskab.
          </p>
          <div className="feature-groups">
            {featureGroups.map(({ title, topics }) => (
              <div key={title}>
                <h3>{title}</h3>
                <dl>
                  {topics.map(([name, detail]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>{detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <a href="/ai/help">
            Sådan forbinder du en AI-assistent til din konto
          </a>
        </div>
      </details>
      <section id="faq" aria-labelledby="questions-title" tabIndex={-1}>
        <h2 id="questions-title">Spørgsmål om adgang</h2>
        <div className="training-information-answers">
          {questions.map(({ title, answer, link }) => (
            <details key={title}>
              <summary>{title}</summary>
              <p>
                {answer} {link && <a href={link.href}>{link.label}</a>}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
