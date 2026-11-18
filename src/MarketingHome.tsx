import { useEffect } from "react";
import AccessForm, { focusAccessForm } from "./components/AccessForm";
import AnalyticsConsent from "./components/AnalyticsConsent";
import SiteBrand from "./components/SiteBrand";
import WorkoutStory from "./components/WorkoutStory";
import TrainingInformation from "./components/TrainingInformation";
import { recordMarketingVisit } from "./marketingAnalytics";
import "./training-story.css";

function Arrow() {
  return (
    <span className="edition-arrow" aria-hidden="true">
      →
    </span>
  );
}

function AccessLink({ className }: { className: string }) {
  return (
    <a
      className={className}
      href="#adgang"
      aria-haspopup="dialog"
      aria-controls="access-dialog"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        focusAccessForm();
      }}
    >
      Få besked om adgang <Arrow />
    </a>
  );
}

const navigation = [
  ["traeningsforloeb", "Sådan virker appen"],
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
          Menu <span aria-hidden="true" className="menu-chevron" />
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
        Log ind
      </a>
    </nav>
  );
}

function WorkoutExample() {
  return (
    <figure className="hero-example" aria-labelledby="example-exercise">
      <picture className="focus-picture">
        <source
          media="(min-width: 900px) and (min-aspect-ratio: 2.65/1)"
          srcSet="/product/fokus-panorama.webp"
          width="1800"
          height="720"
        />
        <source
          media="(max-width: 899px)"
          srcSet="/product/fokus-mobil-540.webp 540w, /product/fokus-mobil-1080.webp 1080w"
          sizes="100vw"
          width="540"
          height="400"
        />
        <img
          className="focus-photo"
          src="/product/fokus-desktop-960.webp"
          srcSet="/product/fokus-desktop-960.webp 960w, /product/fokus-desktop-1620.webp 1620w"
          sizes="55vw"
          width="960"
          height="640"
          fetchPriority="high"
          alt="I programmet Overkrop A viser appen sidste bænkpres på 60 kg × 8. Første sæt i dag er klar med 8 gentagelser på 62,5 kg."
        />
      </picture>
      <figcaption>
        <span id="example-exercise">60 kg sidst. 62,5 kg i dag.</span>
        <span>Eksempeldata</span>
      </figcaption>
    </figure>
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
          <div className="hero-copy">
            <h1 id="hero-title">
              Træn videre <span>fra sidste gang.</span>
            </h1>
            <p className="hero-lead">
              Se, hvad du løftede sidst. Registrér dit næste sæt, og lad appen
              holde styr på pausen.
            </p>
            <div className="hero-access" id="adgang">
              <AccessLink className="hero-access-link" />
              <p>Under udvikling til iPhone og Android.</p>
              <noscript>
                <p>
                  Aktivér JavaScript for at skrive dig op, eller{" "}
                  <a href="/support">kontakt support</a>.
                </p>
              </noscript>
            </div>
          </div>
          <WorkoutExample />
        </section>
        <WorkoutStory />
        <TrainingInformation />
        <div className="closing">
          <div className="closing-inner">
            <p>Vil du prøve Træningsmester?</p>
            <AccessLink className="closing-action" />
          </div>
        </div>
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
      <AccessForm />
    </div>
  );
}
