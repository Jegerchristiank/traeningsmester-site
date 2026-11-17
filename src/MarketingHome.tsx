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
      aria-label="Træningsfoto og eksempel fra Træningsmester"
    >
      <div className="cover-print training-photo">
        <img
          className="cover-athlete"
          src="/product/athlete.webp"
          width="1200"
          height="800"
          fetchPriority="high"
          alt="En atlet holder vægtstangen over hovedet i træningscenteret."
        />
        <span className="photo-credit">Foto · Victor Freitas</span>
      </div>
      <div className="cover-sheet">
        <div className="sheet-heading">
          <p className="edition-label">Overkrop A</p>
          <p className="sheet-exercise">Bænkpres Med Stang</p>
        </div>
        <img
          className="cover-app"
          src="/product/revision-detail-set.webp"
          width="1200"
          height="510"
          alt="Appens sætrække. Sidste gang 60 kg × 8. Dagens første arbejdssæt er indstillet til 62,5 kg og 8 gentagelser."
        />
      </div>
      <figcaption>Eksempeldata · rekonstrueret appvisning</figcaption>
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
      <div className="feature-spread-heading">
        <h2 className="print-title" id="feature-heading">
          Til din måde
          <br />
          <em>at træne på.</em>
        </h2>
        <p>
          Opbyg din træningsuge med de øvelser, aktiviteter og forbindelser, der
          passer til dig.
        </p>
      </div>
      <div className="feature-spread">
        <figure className="exercise-plate">
          <p className="edition-label">Fra øvelsesbiblioteket</p>
          <img
            src="/product/baenkpres.webp"
            width="512"
            height="512"
            alt="Appens øvelsesillustration viser startpositionen til bænkpres med stang."
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            <strong>Bænkpres Med Stang</strong>
            <span>Styrke / Vægtstang</span>
          </figcaption>
        </figure>
        <div className="feature-register">
          <div>
            <h3>Egne programmer</h3>
            <p>
              Sæt øvelserne i din rækkefølge. Vælg antal sæt og pauser for hver
              træningsdag.
            </p>
          </div>
          <div>
            <h3>Styrke og kondition</h3>
            <p>
              Registrér kilo og gentagelser i centeret. Tag tid på din løbetur,
              og følg distancen udenfor.
            </p>
          </div>
          <div>
            <h3>Dine forbindelser</h3>
            <p>
              Brug Apple Sundhed på iPhone. Strava er under udvikling som
              valgfri forbindelse til dine aktiviteter.
            </p>
          </div>
        </div>
      </div>
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

function ProjectAndQuestions() {
  return (
    <section className="project-section" aria-labelledby="questions-title">
      <div className="edition-shell project-spread">
        <aside aria-labelledby="project-title" className="project-colophon">
          <p className="edition-label" id="project-title">
            Bag Træningsmester
          </p>
          <h3>
            Christian
            <br />
            <em>Kristensen.</em>
          </h3>
          <p>
            Bag projektet står KRISTENSON i Næstved. Skriv til Christian, hvis
            du har et spørgsmål til appen eller en idé fra din egen træning.
          </p>
          <a className="edition-text-link" href="/support">
            Kontakt og support <Arrow />
          </a>
        </aside>
        <div className="question-register" id="faq">
          <h2 id="questions-title">
            Inden du <em>skriver dig op.</em>
          </h2>
          <div className="question-list">
            {questions.map(([question, answer], i) => (
              <details className="question" key={question} open={i === 0}>
                <summary>
                  {question}
                  <span className="toggle-mark" aria-hidden="true" />
                </summary>
                <p>
                  {answer}
                  {i === 3 && (
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
      <header className="edition-header edition-shell">
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
      </header>
      <main id="main-content">
        <section
          className="story-hero edition-shell"
          aria-labelledby="hero-title"
        >
          <div className="hero-intro">
            <h1 id="hero-title">
              Træn videre <em>fra sidste gang.</em>
            </h1>
            <p>
              Dit program, dine sæt og dine pauser samlet i én app. Se, hvad du
              løftede sidst, og hold fokus på den træning, du er i gang med.
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
          <a className="hero-follow edition-text-link" href="#traeningsforloeb">
            Se et træningsforløb <Arrow down />
          </a>
        </section>
        <WorkoutStory />
        <FeatureIndex />
        <ProjectAndQuestions />
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
            <div>
              <SiteBrand />
              <p>
                KRISTENSON · CVR 40679456
                <br />
                Blomstergården 13, 4700 Næstved
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
            <AnalyticsConsent />
            <a href="#top">
              Til toppen <span aria-hidden="true">↑</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
