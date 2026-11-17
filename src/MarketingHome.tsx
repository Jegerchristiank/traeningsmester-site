import { useEffect } from "react";
import AccessForm, { focusAccessForm } from "./components/AccessForm";
import AnalyticsConsent from "./components/AnalyticsConsent";
import SiteBrand from "./components/SiteBrand";
import WorkoutStory from "./components/WorkoutStory";
import { recordMarketingVisit } from "./marketingAnalytics";
import "./training-story.css";

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <span className="edition-arrow" aria-hidden="true">
      {down ? "↓" : "↗"}
    </span>
  );
}

function AccessLink({ className }: { className: string }) {
  return (
    <a
      className={className}
      href="#adgang"
      onClick={(event) => {
        event.preventDefault();
        focusAccessForm();
      }}
    >
      Få besked om adgang <Arrow />
    </a>
  );
}

const navigation = [
  ["traeningsforloeb", "Træningsforløb"],
  ["funktioner", "Funktioner"],
  ["faq", "Spørgsmål"],
] as const;

function SiteNavigation() {
  return (
    <nav aria-label="Hovednavigation">
      <div className="header-links">
        {navigation.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </div>
      <details
        className="contents-menu"
        onKeyDown={(event) => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
        onBlur={(event) => {
          if (
            event.relatedTarget &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            event.currentTarget.open = false;
        }}
      >
        <summary>
          Indhold <span aria-hidden="true">⌄</span>
        </summary>
        <div className="contents-links">
          {navigation.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(event) => {
                const disclosure = event.currentTarget.closest("details");
                if (disclosure) disclosure.open = false;
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </details>
      <a className="header-login" href="/app">
        Log ind <Arrow />
      </a>
    </nav>
  );
}

const features = [
  [
    "Programmer",
    "Byg træningsdage med egne rækkefølger, mål og pauser. Periodiserede programmer kan fordele arbejdet over flere uger. Oprettelse af egne øvelser kræver Premium.",
  ],
  [
    "Øvelsesbibliotek",
    "Filtrér øvelser efter muskelgruppe og træningsform. I Match kan du gemme dem, du vil vende tilbage til, under Dine valg. Adgangen kan afhænge af medlemskab.",
  ],
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
  [
    "Import og AI",
    "Med Premium, internetforbindelse og dit AI-samtykke kan du importere indhold eller få forslag til et program. Gennemgå resultatet, før du gemmer det. Adgang og kapacitet kan variere.",
  ],
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
];

const questions = [
  [
    "Hvornår kan jeg prøve appen?",
    "Der er endnu ingen offentlig adgangsdato. Skriv dig op, så får du en e-mail, når der er nyt om at prøve Træningsmester.",
  ],
  [
    "Hvilke enheder understøttes?",
    "Træningsmester udvikles til iPhone og Android. Apple Sundhed og Apple Watch hører til Apple-platformen. De konkrete enhedskrav følger med, når adgangen åbner.",
  ],
  [
    "Hvad kommer det til at koste?",
    "Det er gratis at skrive sig op. Der er endnu ingen offentlig pris for appen. Du får adgangsvilkårene at se, før du skal beslutte dig.",
  ],
  [
    "Hvad sker der med min e-mail?",
    "KRISTENSON bruger din e-mail til beskeder om lancering og adgangsrunder. Du kan afmelde dig gratis via linket i hver mail.",
  ],
];

function WorkoutExample() {
  return (
    <section className="hero-product" aria-labelledby="example-exercise">
      <div className="sample-heading">
        <p className="sample-context">
          <span>Overkrop A</span>
          <small>Eksempeldata</small>
        </p>
        <h2 id="example-exercise">Bænkpres med stang</h2>
      </div>
      <dl className="sample-values">
        <div>
          <dt>Sidste træning</dt>
          <dd>
            60 <span>kg × 8</span>
          </dd>
        </div>
        <div className="sample-today">
          <dt>Dagens første sæt</dt>
          <dd>
            62,5 <span>kg × 8</span>
          </dd>
        </div>
      </dl>
      <div className="sample-window">
        <p>Sætrækken i appen</p>
        <img
          src="/product/revision-detail-set.webp"
          srcSet="/product/saetraekke-600.webp 600w, /product/revision-detail-set.webp 1200w"
          sizes="(max-width: 699px) 92vw, (max-width: 1023px) 48vw, (min-width: 2300px) and (min-aspect-ratio: 2.75/1) 24vw, 33vw"
          width="1200"
          height="510"
          decoding="async"
          alt="Rekonstrueret appvisning. Sidste sæt var 60 kg × 8. Den aktive række viser 8 gentagelser med 62,5 kg."
        />
        <a className="edition-text-link" href="#traeningsforloeb">
          Se et træningsforløb <Arrow down />
        </a>
      </div>
      <figure className="plate-figure">
        <picture>
          <source
            media="(min-width: 1024px) and (min-aspect-ratio: 2/1)"
            srcSet="/product/vaegtskiver-panorama.webp"
            width="1920"
            height="800"
          />
          <img
            className="plate-image"
            src="/product/vaegtskiver-1024.webp"
            srcSet="/product/vaegtskiver-560.webp 560w, /product/vaegtskiver-1024.webp 1024w, /product/vaegtskiver-1800.webp 1800w"
            sizes="(max-width: 699px) 47vw, (max-width: 1023px) 25vw, 31vw"
            width="1024"
            height="768"
            fetchPriority="high"
            alt="To små blå vægtskiver på 1,25 kg hver."
          />
        </picture>
        <figcaption>
          <strong>
            +2,5 <span>kg</span>
          </strong>
          <span>
            En skive på 1,25 kg
            <br />i hver side af stangen.
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

function FeatureIndex() {
  return (
    <section
      id="funktioner"
      tabIndex={-1}
      className="edition-features edition-shell"
      aria-labelledby="feature-heading"
    >
      <header className="feature-heading">
        <h2 id="feature-heading">
          Til din måde
          <br />
          at træne på.
        </h2>
      </header>
      <div className="features-content">
        <dl className="feature-register">
          <div>
            <dt>Eget program</dt>
            <dd>
              Vælg øvelser og træningsdage. Læg vægt, gentagelser og pauser ind,
              så programmet er klar, når du møder op.
            </dd>
          </div>
          <div>
            <dt>Styrke og kondition</dt>
            <dd>
              Hold opvarmning og arbejdssæt adskilt i styrketræningen. Registrér
              tid og distance, når du løber, går eller cykler.
            </dd>
          </div>
          <div>
            <dt>Dine forbindelser</dt>
            <dd>
              Forbind Apple Sundhed på iPhone, eller brug et parret Apple Watch.
              Forbindelsen til Strava er under udvikling.
            </dd>
          </div>
        </dl>
        <details className="all-features">
          <summary>
            Se alle funktioner{" "}
            <span className="toggle-mark" aria-hidden="true" />
          </summary>
          <div className="feature-overview">
            <p>
              Funktioner i mobilappen under udvikling. Adgang afhænger af
              platform og medlemskab.
            </p>
            <dl>
              {features.map(([name, detail]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
            <a className="edition-text-link" href="/ai/help">
              Sådan forbinder du en AI-assistent til din konto <Arrow />
            </a>
          </div>
        </details>
      </div>
    </section>
  );
}

function Questions() {
  return (
    <section
      className="questions-block"
      id="faq"
      tabIndex={-1}
      aria-labelledby="questions-title"
    >
      <div className="edition-shell questions-spread">
        <h2 id="questions-title">
          Inden du
          <br />
          skriver dig op.
        </h2>
        <div className="question-list">
          {questions.map(([question, answer], index) => (
            <details className="question" key={question} open={index === 0}>
              <summary>
                {question}
                <span className="toggle-mark" aria-hidden="true" />
              </summary>
              <p>
                {answer}
                {index === 3 && (
                  <>
                    {" "}
                    <a href="/privatliv">Læs om privatliv.</a>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MarketingHome() {
  useEffect(() => {
    document.title = "Træningsmester — Træn videre fra sidste gang.";
    recordMarketingVisit();
  }, []);
  return (
    <div className="edition-home" id="top">
      <a className="story-skip" href="#main-content">
        Gå til indhold
      </a>
      <header className="cover-header">
        <div className="edition-shell header-inner">
          <SiteBrand />
          <SiteNavigation />
        </div>
      </header>
      <main id="main-content">
        <section className="story-hero" aria-labelledby="hero-title">
          <div className="poster-heading">
            <h1 id="hero-title">
              Træn videre <span>fra sidste gang.</span>
            </h1>
          </div>
          <div className="cover-layout">
            <div className="cover-access">
              <p className="hero-lead">
                <strong>En træningsapp, der husker dine sæt.</strong> Åbn dit
                program, se dit sidste løft, og hold styr på pausen.
              </p>
              <AccessForm />
            </div>
            <WorkoutExample />
          </div>
        </section>
        <WorkoutStory />
        <FeatureIndex />
        <Questions />
        <section className="closing" aria-label="Tilmelding">
          <div className="edition-shell closing-inner">
            <p>Træningsmester er under udvikling.</p>
            <AccessLink className="closing-action" />
          </div>
        </section>
      </main>
      <footer className="story-footer">
        <div className="edition-shell">
          <div className="footer-directory">
            <div className="footer-maker">
              <SiteBrand />
              <p>
                Træningsmester udvikles af Christian Kristensen i Næstved. Har
                du en idé fra din træning, kan du{" "}
                <a href="/support">skrive til Christian</a>.
              </p>
            </div>
            <nav aria-label="Konto og hjælp">
              <h2>Konto og hjælp</h2>
              <a href="/app">Log ind</a>
              <a href="/ai/help">Forbind en AI-assistent</a>
              <a href="/support">Support</a>
              <a href="/slet-konto">Slet konto</a>
            </nav>
            <nav aria-label="Praktiske og juridiske links">
              <h2>Praktisk</h2>
              <a href="/privatliv">Privatliv</a>
              <a href="/vilkaar">Vilkår</a>
              <a href="/cookies">Cookies</a>
              <a href="/tilgaengelighed">Tilgængelighed</a>
              <a href="/afmeld">Afmelding</a>
            </nav>
          </div>
          <div className="footer-base">
            <p>
              KRISTENSON · CVR 40679456
              <br />
              Blomstergården 13, 4700 Næstved
            </p>
            <AnalyticsConsent />
            <a href="#top">Til toppen ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
