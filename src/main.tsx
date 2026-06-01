import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type ModeId = "begynder" | "selvoevet" | "logger" | "traener";

type Mode = {
  id: ModeId;
  name: string;
  mood: string;
  promise: string;
  before: string;
  after: string;
  first: string[];
  image: string;
  screen: string;
  screenAlt: string;
};

type LegalPanelId = "terms" | "privacy" | "cookies";
type CookieChoice = "necessary";

const modes: Mode[] = [
  {
    id: "begynder",
    name: "Begynder",
    mood: "Mindre usikkerhed",
    promise: "Åbn appen, se dagens pas, start uden at forstå hele planen først.",
    before: "For mange valg gør træningen tung, før den overhovedet starter.",
    after: "Dagens pas står klart. Øvelserne er konkrete. Starten føles enkel.",
    first: ["Dagens træning", "Tydelige øvelser", "Færre valg ad gangen"],
    image:
      "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1500&q=82",
    screen: "/app/home-training.jpg",
    screenAlt: "Dagens træning i Træningsmester"
  },
  {
    id: "selvoevet",
    name: "Selvøvet",
    mood: "Mere kontrol",
    promise: "Ret, flyt og importér uden at planen mister sin rytme.",
    before: "Gamle noter, nye mål og forskellige centre bliver hurtigt til rod.",
    after: "Planen hænger sammen, selv når hverdagen tvinger dig til at ændre den.",
    first: ["Programmer", "Import", "Skift uden rod"],
    image:
      "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=1500&q=82",
    screen: "/app/programs.jpg",
    screenAlt: "Programmer i Træningsmester"
  },
  {
    id: "logger",
    name: "Logger",
    mood: "Mere præcision",
    promise: "Skriv vægt og reps hurtigt, og stol på dem næste gang.",
    before: "Hvis loggen tager for meget plads, ryger fokus væk fra løftet.",
    after: "Sæt, vægt, PR og historik ligger klar, når næste valg skal tages.",
    first: ["Sæt og vægt", "Seneste løft", "Historik og PR"],
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1500&q=82",
    screen: "/app/exercises.jpg",
    screenAlt: "Øvelseskatalog i Træningsmester"
  },
  {
    id: "traener",
    name: "Træner",
    mood: "Mere overblik",
    promise: "Klienter, planer og opfølgning samlet, så beskeder ikke bliver dit system.",
    before: "Trænerarbejde falder fra hinanden, når alt lever i beskeder.",
    after: "Du ser hvem der kræver opmærksomhed, og hvad der skal gøres.",
    first: ["Klienter", "Planer", "Opfølgning"],
    image:
      "https://images.unsplash.com/photo-1602233158242-3ba0ac4d2167?auto=format&fit=crop&w=1500&q=82",
    screen: "/app/coach.jpg",
    screenAlt: "Coach-overblik i Træningsmester"
  }
];

const flow = [
  {
    label: "Plan",
    title: "Se planen",
    text: "Du starter med det, der skal ske i dag, ikke med alt det appen kan."
  },
  {
    label: "Pas",
    title: "Træn uden jagt",
    text: "Øvelser, sæt og noter ligger tæt på hinanden, mens du træner."
  },
  {
    label: "Log",
    title: "Skriv det vigtige",
    text: "Vægt, reps og oplevelse gemmes, uden at loggen overtager passet."
  },
  {
    label: "Fremgang",
    title: "Vælg bedre",
    text: "Når du kommer tilbage, ligger sidste løft og næste valg klar."
  }
];

const evidence = [
  {
    value: "389",
    label: "øvelser at bygge fra",
    note: "Fra Træningsmesters øvelseskatalog, 1. juni 2026"
  },
  {
    value: "50.000",
    label: "tegn i én import",
    note: "Plads til lange programmer og gamle træningsnoter"
  },
  {
    value: "4",
    label: "startpunkter",
    note: "Begynder, selvøvet, logger og træner"
  }
];

const openingQuestions = [
  {
    question: "Hvad skal jeg lave i dag?",
    answer: "Dagens pas ligger øverst."
  },
  {
    question: "Hvad løftede jeg sidst?",
    answer: "Seneste vægt følger øvelsen."
  },
  {
    question: "Kan jeg ændre planen?",
    answer: "Ja, uden at starte forfra."
  },
  {
    question: "Hvem skal jeg følge op på?",
    answer: "Klienterne samles i ét overblik."
  }
];

const principles = [
  "Dagens pas skal være det første, du ser.",
  "Loggen skal tage sekunder, ikke opmærksomhed.",
  "Historikken skal hjælpe næste løft.",
  "Træneren skal se det, der kalder på handling."
];

const trustSignals = [
  {
    label: "Dansk produkt",
    text: "Sprog, flows og træningslogik er skrevet til danske brugere."
  },
  {
    label: "Køb og adgang",
    text: "Siden informerer. Køb og abonnementer håndteres ikke på websitet."
  },
  {
    label: "Cookiekontrol",
    text: "Ingen marketingcookies eller skjult statistik på denne side."
  },
  {
    label: "Support",
    text: "Hjælp håndteres via appens konto- og indstillingsflader."
  }
];

const legalPanels: Record<
  LegalPanelId,
  {
    title: string;
    kicker: string;
    summary: string;
    sections: { heading: string; body: string }[];
  }
> = {
  terms: {
    title: "Handelsbetingelser",
    kicker: "Det praktiske",
    summary:
      "Denne side sælger ikke abonnementer direkte. Betingelserne forklarer rammen for Træningsmester, når køb åbnes i appen eller gennem en app-butik.",
    sections: [
      {
        heading: "Køb og betaling",
        body:
          "Eventuelle køb vises altid i det betalingsflow, hvor købet gennemføres. Pris, periode, fornyelse og opsigelse skal fremgå før betaling."
      },
      {
        heading: "Adgang",
        body:
          "Digitale funktioner leveres i appen efter login og godkendt betaling, når funktionen kræver abonnement."
      },
      {
        heading: "Fortrydelse og opsigelse",
        body:
          "Fortrydelse, opsigelse og refusion følger den konkrete betalingskanal og de oplysninger, der vises før købet."
      },
      {
        heading: "Reklamation",
        body:
          "Hvis en betalt digital funktion ikke virker som forventet, skal fejlen kunne beskrives, så den kan undersøges og rettes."
      }
    ]
  },
  privacy: {
    title: "Privatliv",
    kicker: "Data",
    summary:
      "Hjemmesiden er en informationsside. Den henter ikke dine træningsdata og beder ikke om konto, helbred, lokation eller betaling.",
    sections: [
      {
        heading: "På websitet",
        body:
          "Denne version bruger kun lokal lagring til at huske cookievalget. Der er ingen aktive marketing- eller statistikværktøjer."
      },
      {
        heading: "I appen",
        body:
          "Når appen bruges, kan kontooplysninger, træningsdata, historik og coachrelationer være nødvendige for funktionerne."
      },
      {
        heading: "Adgang og kontrol",
        body:
          "Personlige appdata skal kunne håndteres gennem appens konto-, indstillings- og supportflader."
      }
    ]
  },
  cookies: {
    title: "Cookies",
    kicker: "Samtykke",
    summary:
      "Vi bruger ikke marketingcookies på denne side. Dit valg gemmes lokalt, så banneret ikke vises igen.",
    sections: [
      {
        heading: "Nødvendig lagring",
        body:
          "Cookievalget gemmes i browserens lokale lager. Det er nødvendigt for at huske, om banneret er lukket."
      },
      {
        heading: "Statistik",
        body:
          "Der er ingen aktiv statistik på websitet i denne version."
      },
      {
        heading: "Marketing",
        body:
          "Der er ingen aktive marketingcookies, pixels eller annonceringsværktøjer på websitet."
      }
    ]
  }
};

const readStoredCookieChoice = (): CookieChoice | null => {
  try {
    if (typeof window.localStorage === "undefined") return null;
    return window.localStorage.getItem("tm-cookie-choice") === "necessary"
      ? "necessary"
      : null;
  } catch {
    return null;
  }
};

const storeCookieChoice = (choice: CookieChoice) => {
  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem("tm-cookie-choice", choice);
    }
  } catch {
    // Some embedded browsers block local storage. The in-memory choice still closes the banner.
  }
};

function App() {
  const [activeMode, setActiveMode] = useState<ModeId>("begynder");
  const [activeLegalPanel, setActiveLegalPanel] = useState<LegalPanelId | null>(null);
  const [cookieChoice, setCookieChoice] = useState<CookieChoice | null>(null);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const selectedMode = useMemo(
    () => modes.find((mode) => mode.id === activeMode) ?? modes[0],
    [activeMode]
  );
  const activeLegal = activeLegalPanel ? legalPanels[activeLegalPanel] : null;

  useEffect(() => {
    const savedChoice = readStoredCookieChoice();
    if (savedChoice === "necessary") {
      setCookieChoice(savedChoice);
    }
  }, []);

  useEffect(() => {
    if (!activeLegalPanel) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveLegalPanel(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeLegalPanel]);

  const saveCookieChoice = () => {
    storeCookieChoice("necessary");
    setCookieChoice("necessary");
    setCookieSettingsOpen(false);
  };

  return (
    <>
      <header className="site-header" aria-label="Hovednavigation">
        <a className="brand-mark" href="#top" aria-label="Træningsmester top">
          <img src="/brand/tm-logo.png" alt="" />
          <span>Træningsmester</span>
        </a>
        <nav>
          <a href="#for-hvem">Hvem</a>
          <a href="#flow">I appen</a>
          <a href="#fakta">Tal</a>
          <a href="#praktisk">Praktisk</a>
          <a href="#team">Team</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">Træningsmester</p>
            <h1 id="hero-title">Næste træning. Ingen tvivl.</h1>
            <p>
              Se dagens pas. Træn. Log det vigtige. Kom tilbage uden at samle
              trådene op igen.
            </p>
          </div>
          <div className="hero-product" aria-label="Appen i brug">
            <img src="/app/home-training.jpg" alt="Dagens træning i appen" />
            <div>
              <span>Dagens pas</span>
              <strong>Full Body A</strong>
              <p>sidst trænet for 4 dage siden</p>
            </div>
          </div>
          <div className="hero-line" aria-hidden="true">
            <span>
              <strong>Begynder</strong>
              <small>Hvad skal jeg lave?</small>
            </span>
            <span>
              <strong>Selvøvet</strong>
              <small>Kan planen ændres?</small>
            </span>
            <span>
              <strong>Logger</strong>
              <small>Hvad løftede jeg sidst?</small>
            </span>
            <span>
              <strong>Træner</strong>
              <small>Hvem mangler svar?</small>
            </span>
          </div>
        </section>

        <section className="tension-section" aria-labelledby="tension-title">
          <div className="tension-lead">
            <p className="eyebrow">Før første sæt</p>
            <h2 id="tension-title">Appen skal svare, før du begynder at lede.</h2>
          </div>
          <div className="tension-lines">
            {openingQuestions.map((item, index) => (
              <p key={item.question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.question}</strong>
                <em>{item.answer}</em>
              </p>
            ))}
          </div>
        </section>

        <section className="mode-section" id="for-hvem">
          <div className="mode-intro section-band">
            <p className="eyebrow">Hvem</p>
            <h2>Bygget til fire helt almindelige situationer.</h2>
            <p>
              Ny i centeret. Fast i et gammelt program. Optaget af tallene.
              Ansvarlig for klienter.
            </p>
          </div>

          <div className="mode-controls" aria-label="Vælg brugerprofil">
            {modes.map((mode) => (
              <button
                aria-pressed={mode.id === selectedMode.id}
                className={mode.id === selectedMode.id ? "is-active" : ""}
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                type="button"
              >
                <span>{mode.name}</span>
                <strong>{mode.mood}</strong>
              </button>
            ))}
          </div>

          <article
            className="mode-stage"
            style={{ "--mode-image": `url(${selectedMode.image})` } as React.CSSProperties}
          >
            <div className="mode-image" aria-hidden="true" />
            <div className="mode-copy">
              <p className="eyebrow">{selectedMode.name}</p>
              <h2>{selectedMode.promise}</h2>
              <div className="before-after">
                <p>
                  <span>Før</span>
                  {selectedMode.before}
                </p>
                <p>
                  <span>Efter</span>
                  {selectedMode.after}
                </p>
              </div>
              <div className="first-list" aria-label={`Første fokus for ${selectedMode.name}`}>
                {selectedMode.first.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="mode-phone">
              <img src={selectedMode.screen} alt={selectedMode.screenAlt} />
            </div>
          </article>
        </section>

        <section className="flow section-band dark" id="flow">
          <div className="section-head">
            <p className="eyebrow">I appen</p>
            <h2>Det samme mønster hver gang.</h2>
            <p>
              Se hvad der skal ske. Gør det. Gem det vigtige. Vælg bedre næste
              gang.
            </p>
          </div>
          <div className="flow-grid">
            {flow.map((item, index) => (
              <article className="flow-item" key={item.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item.label}</p>
                <h3>{item.title}</h3>
                <small>{item.text}</small>
              </article>
            ))}
          </div>
          <div className="screens-row" aria-label="Skærme fra appen">
            <img src="/app/programs.jpg" alt="Programmer i Træningsmester" />
            <img src="/app/home-training.jpg" alt="Dagens træning i Træningsmester" />
            <img src="/app/exercises.jpg" alt="Øvelser i Træningsmester" />
            <img src="/app/coach.jpg" alt="Coach-overblik i Træningsmester" />
          </div>
        </section>

        <section className="evidence section-band" id="fakta">
          <div className="evidence-head">
            <p className="eyebrow">Tal</p>
            <h2>Tal uden pynt.</h2>
          </div>
          <div className="evidence-grid" aria-label="Fakta om Træningsmester">
            {evidence.map((item) => (
              <div className="evidence-row" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="principles section-band dark">
          <div className="section-head">
            <p className="eyebrow">I brug</p>
            <h2>Mindre jagt. Mere træning.</h2>
          </div>
          <div className="principle-list">
            {principles.map((principle, index) => (
              <p key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {principle}
              </p>
            ))}
          </div>
        </section>

        <section className="official section-band" id="praktisk">
          <div className="official-head">
            <p className="eyebrow">Praktisk</p>
            <h2>Vilkår, cookies og praktisk status.</h2>
          </div>
          <div className="trust-grid" aria-label="Praktisk status">
            {trustSignals.map((signal) => (
              <article className="trust-card" key={signal.label}>
                <span>{signal.label}</span>
                <p>{signal.text}</p>
              </article>
            ))}
          </div>
          <div className="legal-console" aria-label="Juridiske oplysninger">
            <div>
              <p className="eyebrow">Officielt</p>
              <h3>Vilkår, privatliv og cookies samlet ét sted.</h3>
            </div>
            <div className="legal-actions">
              <button type="button" onClick={() => setActiveLegalPanel("terms")}>
                Handelsbetingelser
              </button>
              <button type="button" onClick={() => setActiveLegalPanel("privacy")}>
                Privatliv
              </button>
              <button type="button" onClick={() => setActiveLegalPanel("cookies")}>
                Cookies
              </button>
            </div>
          </div>
        </section>

        <section className="team section-band" id="team">
          <div className="team-photo" aria-hidden="true" />
          <div className="team-copy">
            <p className="eyebrow">Team</p>
            <h2>Bygget tæt på træningen.</h2>
            <p>
              Træningsmester er lavet til en almindelig uge med skiftende
              energi, fyldte centre, gamle noter og nye mål.
            </p>
            <p>
              Derfor handler produktet først om det nære: dagens pas, seneste
              løft, planen der kan ændres, og overblikket en træner faktisk kan
              bruge.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <img src="/brand/tm-logo.png" alt="" />
          <p>Træningsmester · næste træning uden tvivl.</p>
          <small>Opdateret 1. juni 2026</small>
        </div>
        <div className="footer-links" aria-label="Juridiske links">
          <button type="button" onClick={() => setActiveLegalPanel("terms")}>
            Handelsbetingelser
          </button>
          <button type="button" onClick={() => setActiveLegalPanel("privacy")}>
            Privatliv
          </button>
          <button type="button" onClick={() => setActiveLegalPanel("cookies")}>
            Cookies
          </button>
        </div>
      </footer>

      {activeLegal ? (
        <div
          aria-labelledby="legal-title"
          aria-modal="true"
          className="legal-overlay"
          role="dialog"
        >
          <button
            aria-label="Luk"
            className="overlay-backdrop"
            onClick={() => setActiveLegalPanel(null)}
            type="button"
          />
          <section className="legal-panel">
            <div className="legal-panel-head">
              <div>
                <p className="eyebrow">{activeLegal.kicker}</p>
                <h2 id="legal-title">{activeLegal.title}</h2>
              </div>
              <button
                aria-label="Luk"
                className="close-button"
                onClick={() => setActiveLegalPanel(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="legal-summary">{activeLegal.summary}</p>
            <div className="legal-section-list">
              {activeLegal.sections.map((section) => (
                <article key={section.heading}>
                  <h3>{section.heading}</h3>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {!cookieChoice || cookieSettingsOpen ? (
        <aside className="cookie-banner" aria-label="Cookieindstillinger">
          <div>
            <strong>Cookies</strong>
            <p>
              Vi bruger kun nødvendig lokal lagring til at huske dit valg. Ingen
              marketingcookies. Ingen skjult statistik.
            </p>
            {cookieSettingsOpen ? (
              <div className="cookie-settings">
                <p>
                  <span>Nødvendig</span>
                  Altid aktiv
                </p>
                <p>
                  <span>Statistik</span>
                  Ikke aktiv
                </p>
                <p>
                  <span>Marketing</span>
                  Ikke aktiv
                </p>
              </div>
            ) : null}
          </div>
          <div className="cookie-actions">
            <button type="button" onClick={() => setCookieSettingsOpen(true)}>
              Indstillinger
            </button>
            <button type="button" onClick={saveCookieChoice}>
              OK
            </button>
          </div>
        </aside>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Træningsmester",
            applicationCategory: "HealthApplication",
            operatingSystem: "Mobile",
            description:
              "Dansk træningsapp til program, log, historik og coach-samarbejde."
          })
        }}
      />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
