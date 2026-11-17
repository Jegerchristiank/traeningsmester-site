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

function WorkoutCover() {
  return (
    <figure
      className="hero-product"
      aria-label="Træningskort med eksempel fra Overkrop A"
    >
      <div className="deck-stage">
        <img
          className="deck-cover"
          src="/product/programkort.webp"
          srcSet="/product/programkort-lille.webp 500w, /product/programkort-mobil.webp 900w, /product/programkort.webp 1200w"
          sizes="(max-width: 719px) 93vw, (max-width: 1500px) 45vw, 660px"
          width="1200"
          height="1056"
          fetchPriority="high"
          alt="Ringbundet træningskort med appens illustration af bænkpres med stang."
        />
        <details className="deck-inspection">
          <summary>
            <span className="deck-turn-label">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M19.5 8.8A8 8 0 1 0 20 14M20 4v5h-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="turn-to">Vend til appvisning</span>
              <span className="turn-back">Vend til træningskort</span>
            </span>
          </summary>
          <div className="deck-reverse">
            <p>Overkrop A</p>
            <h2>Bænkpres med stang</h2>
            <img
              src="/product/revision-detail-set.webp"
              width="1200"
              height="510"
              loading="lazy"
              decoding="async"
              alt="Appens sætrække med 60 kg × 8 fra sidste gang og et nyt arbejdssæt indstillet til 62,5 kg × 8."
            />
            <small>Rekonstrueret appvisning · eksempeldata</small>
          </div>
        </details>
      </div>
      <figcaption className="deck-ledger">
        <div className="ledger-caption">
          <strong>
            Overkrop A <span>/</span> Bænkpres
          </strong>
          <small>Eksempeldata</small>
        </div>
        <dl>
          <div>
            <dt>Sidste træning</dt>
            <dd>
              60 <span>kg × 8</span>
            </dd>
          </div>
          <div className="ledger-current">
            <dt>Dagens første sæt</dt>
            <dd>
              62,5 <span>kg × 8</span>
            </dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

function FeatureIndex() {
  return (
    <section
      id="funktioner"
      className="edition-features edition-shell"
      aria-labelledby="feature-heading"
    >
      <header className="feature-heading">
        <h2 id="feature-heading">
          Til din måde
          <br />
          at træne på.
        </h2>
        <p>
          Vælg dine øvelser, byg din uge, og tag programmet med fra første
          opvarmning til sidste arbejdssæt.
        </p>
      </header>
      <div className="week-spread">
        <article className="warmup-poster">
          <div className="warmup-art">
            <img
              src="/product/opvarmningsflamme.webp"
              width="480"
              height="477"
              loading="lazy"
              decoding="async"
              alt=""
            />
          </div>
          <div className="week-copy">
            <h3>Før første sæt.</h3>
            <p>
              Læg opvarmningen ind i programmet. Appen holder opvarmningssæt og
              arbejdssæt adskilt i din log.
            </p>
          </div>
        </article>
        <article className="restday-poster">
          <div className="restday-art">
            <img
              src="/product/hviledag.webp"
              width="779"
              height="680"
              loading="lazy"
              decoding="async"
              alt="En blå kettlebell hviler i et håndklæde."
            />
          </div>
          <div className="week-copy">
            <h3>Plads til en hviledag.</h3>
            <p>
              Byg dit eget program med de træningsdage, øvelser og pauser, der
              passer ind i din uge.
            </p>
          </div>
        </article>
      </div>
      <dl className="feature-notes">
        <div>
          <dt>Styrke og kondition</dt>
          <dd>
            Log kilo og gentagelser i centeret. Registrér tid og distance, når
            du løber, går eller cykler.
          </dd>
        </div>
        <div>
          <dt>Dine forbindelser</dt>
          <dd>
            Forbind Apple Sundhed på iPhone. Strava er under udvikling som
            valgfri forbindelse til dine aktiviteter.
          </dd>
        </div>
      </dl>
      <details className="all-features">
        <summary>
          Se alle funktioner <span className="toggle-mark" aria-hidden="true" />
        </summary>
        <div className="feature-overview">
          <p>
            Funktioner i mobilappen under udvikling. Adgang afhænger af platform
            og medlemskab.
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
    </section>
  );
}

function Questions() {
  return (
    <section
      className="questions-block"
      id="faq"
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
          <nav aria-label="Hovednavigation">
            <a className="header-chapter" href="#traeningsforloeb">
              Træningsforløb
            </a>
            <a className="header-chapter" href="#funktioner">
              Funktioner
            </a>
            <a className="header-chapter" href="#faq">
              Spørgsmål
            </a>
            <a className="header-login" href="/app">
              Log ind <Arrow />
            </a>
          </nav>
        </div>
      </header>
      <main id="main-content">
        <section className="story-hero" aria-labelledby="hero-title">
          <div className="edition-shell cover-layout">
            <div className="hero-intro">
              <h1 id="hero-title">
                Træn videre <span>fra sidste gang.</span>
              </h1>
              <p>
                Dit program, dine sæt og dine pauser samlet i én app. Se, hvad
                du løftede sidst, og hold fokus på den træning, du er i gang
                med.
              </p>
              <div className="hero-mobile-action">
                <AccessLink className="access-button" />
                <a className="edition-text-link" href="#traeningsforloeb">
                  Se forløbet <Arrow down />
                </a>
              </div>
            </div>
            <WorkoutCover />
            <div className="hero-signup">
              <AccessForm />
            </div>
            <a
              className="hero-follow edition-text-link"
              href="#traeningsforloeb"
            >
              Se et træningsforløb <Arrow down />
            </a>
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
