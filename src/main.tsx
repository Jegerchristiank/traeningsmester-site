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

type LegalPanelId = "terms" | "privacy" | "cookies" | "accessibility";
type CookieChoice = "necessary";

const company = {
  legalName: "KRISTENSON",
  cvr: "40679456",
  form: "Personligt ejet Mindre Virksomhed",
  address: "Blomstergården 13, 4700 Næstved",
  source: "CVR/Virk via Proff"
};

const siteUrl = "https://traeningsmester.dk/";

const modes: Mode[] = [
  {
    id: "begynder",
    name: "Begynder",
    mood: "Mindre usikkerhed",
    promise: "Åbn appen, se dagens pas, start uden at forstå hele planen først.",
    before: "For mange valg gør træningen tung, før den overhovedet starter.",
    after: "Dagens pas står klart. Øvelserne er konkrete. Starten føles enkel.",
    first: ["Dagens træning", "Tydelige øvelser", "Færre valg ad gangen"],
    image: "/photos/beginner-training.jpg",
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
    image: "/photos/program-training.jpg",
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
    image: "/photos/logger-training.jpg",
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
    image: "/photos/coach-training.jpg",
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
    text: "Ingen marketingcookies, skjult statistik eller tredjepartsmedier."
  },
  {
    label: "Support",
    text: "Hjælp håndteres via appens konto- og indstillingsflader."
  }
];

const documentRows: {
  id: LegalPanelId;
  title: string;
  text: string;
  scope: string;
  status: string;
}[] = [
  {
    id: "terms",
    title: "Handelsbetingelser",
    text: "Ramme for køb, adgang, fortrydelse, opsigelse og reklamation.",
    scope: "Køb og adgang",
    status: "Gældende"
  },
  {
    id: "privacy",
    title: "Privatliv",
    text: "Hvad websitet gør, og hvad appen kan kræve for at fungere.",
    scope: "Data og konto",
    status: "Gældende"
  },
  {
    id: "cookies",
    title: "Cookies",
    text: "Nødvendig lagring, mediestatus og marketingstatus.",
    scope: "Website",
    status: "Gældende"
  },
  {
    id: "accessibility",
    title: "Tilgængelighed",
    text: "Tastatur, kontrast, bevægelse og læsbarhed på websitet.",
    scope: "Brugbarhed",
    status: "Gældende"
  }
];

const supportRoutes = [
  {
    label: "Konto",
    text: "Login, profil og sletning håndteres i appens kontoindstillinger."
  },
  {
    label: "Abonnement",
    text: "Pris, fornyelse og opsigelse vises i det købsflow, hvor købet sker."
  },
  {
    label: "Data",
    text: "Privatliv, cookies og adgang til appdata ligger samlet under dokumenterne."
  }
];

const faqs = [
  {
    question: "Kan jeg købe Træningsmester på denne side?",
    answer:
      "Nej. Denne side er lavet til at forklare produktet og de praktiske rammer. Køb og abonnementer håndteres ikke direkte på websitet."
  },
  {
    question: "Hvorfor er der et cookiepanel, hvis siden ikke tracker?",
    answer:
      "Fordi valget stadig skal være tydeligt. Siden bruger kun nødvendig lokal lagring til at huske, at banneret er lukket, og billederne serveres fra samme site."
  },
  {
    question: "Hvor finder jeg hjælp til konto eller abonnement?",
    answer:
      "Konto-, data- og abonnementsrelateret hjælp hører til appens konto- og indstillingsflader, hvor konteksten er rigtig."
  },
  {
    question: "Er tallene på siden pynt?",
    answer:
      "Nej. Tallene er begrænset til konkrete produktforhold, som øvelseskatalog, importgrænse og de fire brugssituationer."
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
        heading: "Virksomhed",
        body: `${company.legalName}, CVR ${company.cvr}, ${company.address}. Selskabsform: ${company.form}.`
      },
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
        heading: "Ansvarlig virksomhed",
        body: `${company.legalName}, CVR ${company.cvr}, er den offentligt registrerede virksomhed bag siden. Kilde: ${company.source}.`
      },
      {
        heading: "På websitet",
        body:
          "Websitet bruger kun lokal lagring til at huske cookievalget. Primære billeder og app-skærme serveres fra samme site. Der er ingen aktive marketing- eller statistikværktøjer."
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
      "Vi bruger ikke marketingcookies på denne side. Dit valg gemmes lokalt, så banneret ikke vises igen. Cookieindstillinger kan åbnes igen nederst på siden.",
    sections: [
      {
        heading: "Nødvendig lagring",
        body:
          "Cookievalget gemmes i browserens lokale lager. Det er nødvendigt for at huske, om banneret er lukket."
      },
      {
        heading: "Medier",
        body:
          "Primære billeder, app-screenshots, logo og ikon serveres fra samme site og kræver ikke tredjepartsmedier."
      },
      {
        heading: "Statistik",
        body:
          "Der er ingen aktiv statistik på websitet."
      },
      {
        heading: "Marketing",
        body:
          "Der er ingen aktive marketingcookies, pixels eller annonceringsværktøjer på websitet."
      }
    ]
  },
  accessibility: {
    title: "Tilgængelighed",
    kicker: "Brugbarhed",
    summary:
      "Websitet skal kunne bruges roligt med tastatur, tydelig kontrast, læsbare skærme og uden unødvendig bevægelse.",
    sections: [
      {
        heading: "Tastatur",
        body:
          "Links, knapper, dokumenter, cookieindstillinger og modaler kan nås med tastatur og har synlig fokusmarkering."
      },
      {
        heading: "Kontrast",
        body:
          "Siden bruger tydelige mørke og lyse flader med markante knapper, linjer og statusmarkeringer."
      },
      {
        heading: "Bevægelse",
        body:
          "Siden respekterer reduceret bevægelse i browseren og bruger ikke animationer som er nødvendige for at forstå indholdet."
      },
      {
        heading: "Billeder",
        body:
          "App-skærme og centrale billeder har tekstalternativer, mens rene dekorative billeder holdes uden læst tekst."
      },
      {
        heading: "Begrænsninger",
        body:
          "Hvis noget er svært at bruge, skal det håndteres via appens konto-, indstillings- eller supportflader, hvor den konkrete kontekst findes."
      }
    ]
  }
};

const cookieCategories = [
  {
    label: "Nødvendig",
    status: "Altid aktiv",
    text: "Husker dit cookievalg i denne browser."
  },
  {
    label: "Statistik",
    status: "Ikke aktiv",
    text: "Ingen skjult analyse eller besøgsstatistik."
  },
  {
    label: "Marketing",
    status: "Ikke aktiv",
    text: "Ingen annonceringscookies, pixels eller remarketing."
  },
  {
    label: "Medier",
    status: "Egen host",
    text: "Billeder, app-skærme, logo og ikon serveres fra samme site."
  }
];

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
    const scrollToHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const scrollToTarget = () => {
        const target = document.getElementById(decodeURIComponent(hash));
        if (!target) return;

        const html = document.documentElement;
        const previousScrollBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        target.scrollIntoView({ block: "start" });
        window.requestAnimationFrame(() => {
          html.style.scrollBehavior = previousScrollBehavior;
        });
      };

      window.setTimeout(scrollToTarget, 80);
      window.setTimeout(scrollToTarget, 420);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  useEffect(() => {
    const savedChoice = readStoredCookieChoice();
    if (savedChoice === "necessary") {
      setCookieChoice(savedChoice);
    }
  }, []);

  useEffect(() => {
    if (!activeLegalPanel && !cookieSettingsOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeLegalPanel) {
          setActiveLegalPanel(null);
          return;
        }

        setCookieSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeLegalPanel, cookieSettingsOpen]);

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
            <h2>Vilkår, cookies og de praktiske rammer.</h2>
          </div>
          <div className="trust-grid" aria-label="Praktisk status">
            {trustSignals.map((signal) => (
              <article className="trust-card" key={signal.label}>
                <span>{signal.label}</span>
                <p>{signal.text}</p>
              </article>
            ))}
          </div>

          <div className="document-desk" aria-label="Dokumenter">
            <div className="document-desk-head">
              <div>
                <p className="eyebrow">Dokumenter</p>
                <h3>Det, der skal være nemt at finde.</h3>
              </div>
              <span>Opdateret 1. juni 2026</span>
            </div>
            <div className="document-list">
              {documentRows.map((row) => (
                <article key={row.id}>
                  <div>
                    <span>{row.scope}</span>
                    <h4>{row.title}</h4>
                  </div>
                  <p>{row.text}</p>
                  <small>{row.status}</small>
                  <button type="button" onClick={() => setActiveLegalPanel(row.id)}>
                    Åbn
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="legal-console" aria-label="Juridiske oplysninger">
            <div>
              <p className="eyebrow">Officielt</p>
              <h3>Vilkår, privatliv, cookies og tilgængelighed samlet ét sted.</h3>
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
              <button type="button" onClick={() => setActiveLegalPanel("accessibility")}>
                Tilgængelighed
              </button>
            </div>
          </div>

          <div className="support-routes" aria-label="Supportveje">
            {supportRoutes.map((route) => (
              <article key={route.label}>
                <span>{route.label}</span>
                <p>{route.text}</p>
              </article>
            ))}
          </div>

          <div className="faq-block" aria-label="Hurtige svar">
            <div className="faq-head">
              <p className="eyebrow">Svar</p>
              <h3>Spørgsmål der ikke skal gemmes væk.</h3>
            </div>
            <div className="faq-list">
              {faqs.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
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
          <small>
            {company.legalName} · CVR {company.cvr}
          </small>
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
          <button type="button" onClick={() => setActiveLegalPanel("accessibility")}>
            Tilgængelighed
          </button>
          <button type="button" onClick={() => setCookieSettingsOpen(true)}>
            Cookieindstillinger
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

      {cookieSettingsOpen ? (
        <div
          aria-labelledby="cookie-title"
          aria-modal="true"
          className="legal-overlay cookie-overlay"
          role="dialog"
        >
          <button
            aria-label="Luk cookieindstillinger"
            className="overlay-backdrop"
            onClick={() => setCookieSettingsOpen(false)}
            type="button"
          />
          <section className="cookie-panel">
            <div className="cookie-panel-head">
              <div>
                <p className="eyebrow">Cookieindstillinger</p>
                <h2 id="cookie-title">Kun det nødvendige.</h2>
              </div>
              <button
                aria-label="Luk"
                className="close-button"
                onClick={() => setCookieSettingsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="cookie-panel-summary">
              Siden bruger nødvendig lokal lagring til at huske dit valg. Statistik og
              marketing er ikke aktive.
            </p>
            <div className="cookie-preference-list">
              {cookieCategories.map((category) => (
                <article key={category.label}>
                  <div>
                    <span>{category.label}</span>
                    <p>{category.text}</p>
                  </div>
                  <strong>{category.status}</strong>
                </article>
              ))}
            </div>
            <div className="cookie-panel-actions">
              <button
                type="button"
                onClick={() => {
                  setCookieSettingsOpen(false);
                  setActiveLegalPanel("cookies");
                }}
              >
                Se cookiepolitik
              </button>
              <button type="button" onClick={saveCookieChoice}>
                Gem valg
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {!cookieChoice ? (
        <aside className="cookie-banner" aria-label="Cookieindstillinger">
          <div>
            <strong>Cookies</strong>
            <p>
              Vi bruger kun nødvendig lokal lagring til at huske dit valg. Ingen
              marketingcookies. Ingen skjult statistik.
            </p>
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
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${siteUrl}#organization`,
                name: "Træningsmester",
                legalName: company.legalName,
                taxID: company.cvr,
                url: siteUrl,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Blomstergården 13",
                  postalCode: "4700",
                  addressLocality: "Næstved",
                  addressCountry: "DK"
                }
              },
              {
                "@type": "WebSite",
                "@id": `${siteUrl}#website`,
                name: "Træningsmester",
                url: siteUrl,
                publisher: {
                  "@id": `${siteUrl}#organization`
                },
                inLanguage: "da-DK",
                accessibilityFeature: [
                  "alternativeText",
                  "highContrastDisplay",
                  "keyboardNavigation",
                  "reducedMotion"
                ]
              },
              {
                "@type": "SoftwareApplication",
                "@id": `${siteUrl}#app`,
                name: "Træningsmester",
                applicationCategory: "HealthApplication",
                operatingSystem: "Mobile",
                url: siteUrl,
                description:
                  "Dansk træningsapp til program, log, historik og coach-samarbejde.",
                publisher: {
                  "@id": `${siteUrl}#organization`
                }
              }
            ]
          })
        }}
      />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
