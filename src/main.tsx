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

const legalHashIds: Record<LegalPanelId, string> = {
  terms: "handelsbetingelser",
  privacy: "privatliv",
  cookies: "cookies",
  accessibility: "tilgaengelighed"
};

const legalPanelByHash: Record<string, LegalPanelId> = {
  handelsbetingelser: "terms",
  privatliv: "privacy",
  cookies: "cookies",
  tilgaengelighed: "accessibility"
};

const cookieSettingsHash = "cookieindstillinger";

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

const platformRows = [
  {
    label: "iPhone",
    text: "Dagens pas, tracker, historik og programredigering."
  },
  {
    label: "Android",
    text: "Samme kerneflow: plan, træning, log og historik."
  },
  {
    label: "Apple Watch",
    text: "Træning tættere på håndleddet, når telefonen ligger væk."
  },
  {
    label: "Træner",
    text: "Klienter, programmer og opfølgning samlet omkring arbejdet."
  }
];

const coreRows = [
  {
    label: "Programmer",
    title: "Byg planen, og ret den, når hverdagen ændrer sig.",
    text: "Træningsdage, øvelser, centre og gamle noter skal kunne samles uden at starte forfra.",
    image: "/app/programs.jpg",
    imageAlt: "Programmer i Træningsmester"
  },
  {
    label: "Tracker",
    title: "Log sæt uden at miste fokus på passet.",
    text: "Vægt, reps, noter og seneste løft ligger tæt på øvelsen, så næste valg bliver lettere.",
    image: "/app/home-training.jpg",
    imageAlt: "Dagens træning i Træningsmester"
  },
  {
    label: "Fremgang",
    title: "Historikken skal hjælpe næste træning.",
    text: "PR, øvelseshistorik og tidligere valg skal være synlige, når du står med vægten igen.",
    image: "/app/exercises.jpg",
    imageAlt: "Øvelseskatalog i Træningsmester"
  },
  {
    label: "Træner",
    title: "Klientarbejde skal leve samme sted som træningen.",
    text: "Programmer, opfølgning og klientoverblik skal ligge tættere på arbejdet end en beskedtråd.",
    image: "/app/coach.jpg",
    imageAlt: "Coach-overblik i Træningsmester"
  }
];

const evidence = [
  {
    value: "389",
    label: "øvelser i kataloget",
    note: "Et konkret udgangspunkt, når programmet skal bygges eller ændres."
  },
  {
    value: "4",
    label: "måder at bruge appen på",
    note: "Begynder, selvøvet, logger og træner har forskellige behov."
  },
  {
    value: "1",
    label: "samlet træningsflow",
    note: "Plan, pas, log og historik skal hænge sammen."
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

const documentRows: {
  id: LegalPanelId;
  title: string;
  text: string;
  scope: string;
}[] = [
  {
    id: "terms",
    title: "Handelsbetingelser",
    text: "Køb, adgang, fortrydelse, opsigelse og reklamation.",
    scope: "Køb og adgang"
  },
  {
    id: "privacy",
    title: "Privatliv",
    text: "Hvad siden gør, og hvad appen kan kræve for at fungere.",
    scope: "Data"
  },
  {
    id: "cookies",
    title: "Cookiepolitik",
    text: "Den korte forklaring på nødvendig lagring i browseren.",
    scope: "Website"
  },
  {
    id: "accessibility",
    title: "Tilgængelighed",
    text: "Tastatur, kontrast, reduceret bevægelse og læsbarhed.",
    scope: "Brugbarhed"
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
    title: "Cookiepolitik",
    kicker: "Website",
    summary:
      "Siden bruger kun nødvendig lokal lagring til at huske dit valg i denne browser.",
    sections: [
      {
        heading: "Hvad gemmes",
        body:
          "Dit cookievalg gemmes lokalt, så banneret ikke vises igen efter accept."
      },
      {
        heading: "Hvad bruges ikke",
        body:
          "Der er ingen aktive marketingcookies, annoncepixels eller statistikværktøjer på websitet."
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

  const cleanHash = () => decodeURIComponent(window.location.hash.slice(1));

  const setAddressHash = (hash: string | null, method: "push" | "replace" = "push") => {
    const nextUrl = hash
      ? `${window.location.pathname}${window.location.search}#${hash}`
      : `${window.location.pathname}${window.location.search}`;
    if (method === "replace") {
      window.history.replaceState(null, "", nextUrl);
      return;
    }

    window.history.pushState(null, "", nextUrl);
  };

  const openLegalPanel = (panel: LegalPanelId) => {
    setCookieSettingsOpen(false);
    setActiveLegalPanel(panel);
    setAddressHash(legalHashIds[panel]);
  };

  const closeLegalPanel = () => {
    setActiveLegalPanel(null);
    if (legalPanelByHash[cleanHash()]) {
      setAddressHash(null, "replace");
    }
  };

  const openCookieSettings = () => {
    setActiveLegalPanel(null);
    setCookieSettingsOpen(true);
    setAddressHash(cookieSettingsHash);
  };

  const closeCookieSettings = () => {
    setCookieSettingsOpen(false);
    if (cleanHash() === cookieSettingsHash) {
      setAddressHash(null, "replace");
    }
  };

  useEffect(() => {
    const handleLocationHash = () => {
      const hash = cleanHash();
      if (!hash) {
        setActiveLegalPanel(null);
        setCookieSettingsOpen(false);
        return;
      }

      const legalPanel = legalPanelByHash[hash];
      if (legalPanel) {
        setCookieSettingsOpen(false);
        setActiveLegalPanel(legalPanel);
        return;
      }

      if (hash === cookieSettingsHash) {
        setActiveLegalPanel(null);
        setCookieSettingsOpen(true);
        return;
      }

      setActiveLegalPanel(null);
      setCookieSettingsOpen(false);

      const scrollToTarget = () => {
        const target = document.getElementById(hash);
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

    handleLocationHash();
    window.addEventListener("hashchange", handleLocationHash);
    window.addEventListener("popstate", handleLocationHash);
    return () => {
      window.removeEventListener("hashchange", handleLocationHash);
      window.removeEventListener("popstate", handleLocationHash);
    };
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
          closeLegalPanel();
          return;
        }

        closeCookieSettings();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeLegalPanel, cookieSettingsOpen]);

  const saveCookieChoice = () => {
    storeCookieChoice("necessary");
    setCookieChoice("necessary");
    closeCookieSettings();
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
          <a href="#kerne">Kerne</a>
          <a href="#fakta">Fakta</a>
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
              <strong>Plan, sæt og log</strong>
              <p>samlet i samme træningsflow</p>
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

        <section className="platform-strip" aria-label="Platforme">
          {platformRows.map((item) => (
            <p key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.text}</span>
            </p>
          ))}
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

        <section className="core section-band" id="kerne">
          <div className="core-head">
            <p className="eyebrow">Kerne</p>
            <h2>Det er her, en træningsapp bliver målt.</h2>
          </div>
          <div className="core-rows">
            {coreRows.map((row, index) => (
              <article className="core-row" key={row.label}>
                <div className="core-row-copy">
                  <span>{String(index + 1).padStart(2, "0")} · {row.label}</span>
                  <h3>{row.title}</h3>
                  <p>{row.text}</p>
                </div>
                <div className="core-row-media">
                  <img src={row.image} alt={row.imageAlt} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="evidence section-band" id="fakta">
          <div className="evidence-head">
            <p className="eyebrow">Fakta</p>
            <h2>Det appen samler.</h2>
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
            <h2>Mindre rod. Mere træning.</h2>
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
            <h2>Det formelle skal være nemt at finde. Ikke fylde det hele.</h2>
          </div>

          <div className="document-desk" aria-label="Dokumenter">
            <div className="document-desk-head">
              <div>
                <p className="eyebrow">Dokumenter</p>
                <h3>Vilkår, privatliv og ansvar.</h3>
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
                  <button
                    aria-label={`Læs ${row.title}`}
                    type="button"
                    onClick={() => openLegalPanel(row.id)}
                  >
                    Læs
                  </button>
                </article>
              ))}
            </div>
          </div>

          <p className="official-note">
            Konto, køb og support håndteres i appen, hvor konteksten er rigtig.
          </p>
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
          <button type="button" onClick={() => openLegalPanel("terms")}>
            Handelsbetingelser
          </button>
          <button type="button" onClick={() => openLegalPanel("privacy")}>
            Privatliv
          </button>
          <button type="button" onClick={() => openLegalPanel("cookies")}>
            Cookiepolitik
          </button>
          <button type="button" onClick={() => openLegalPanel("accessibility")}>
            Tilgængelighed
          </button>
          <button type="button" onClick={openCookieSettings}>
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
            aria-label="Luk dokumentvisning"
            className="overlay-backdrop"
            onClick={closeLegalPanel}
            type="button"
          />
          <section className="legal-panel">
            <div className="legal-panel-head">
              <div>
                <p className="eyebrow">{activeLegal.kicker}</p>
                <h2 id="legal-title">{activeLegal.title}</h2>
              </div>
              <button
                aria-label="Luk dokument"
                className="close-button"
                onClick={closeLegalPanel}
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
            aria-label="Luk cookiepanel"
            className="overlay-backdrop"
            onClick={closeCookieSettings}
            type="button"
          />
          <section className="cookie-panel">
            <div className="cookie-panel-head">
              <div>
                <p className="eyebrow">Cookieindstillinger</p>
                <h2 id="cookie-title">Cookievalg</h2>
              </div>
              <button
                aria-label="Luk cookieindstillinger"
                className="close-button"
                onClick={closeCookieSettings}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="cookie-panel-summary">
              Vi gemmer kun dit valg i denne browser. Ingen statistik. Ingen marketing.
            </p>
            <div className="cookie-minimal">
              <span>Nødvendig lagring</span>
              <strong>Altid aktiv</strong>
            </div>
            <div className="cookie-panel-actions">
              <button
                type="button"
                onClick={() => openLegalPanel("cookies")}
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
              Kun nødvendig lagring til at huske dit valg.
            </p>
          </div>
          <div className="cookie-actions">
            <button type="button" onClick={openCookieSettings}>
              Læs
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
