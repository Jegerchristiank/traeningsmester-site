import React, { FormEvent, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import "./styles.css";

type AudienceId = "begynder" | "selvtraenende" | "traener" | "nysgerrig";
type LegalPanelId = "terms" | "privacy" | "cookies" | "accessibility";
type CookieChoice = "necessary";

type WaitlistState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "submitted"; message: string }
  | { type: "error"; message: string };

type WaitlistFormState = {
  email: string;
  consent: boolean;
};

const siteUrl = "https://www.traeningsmester.dk/";
const defaultSupabaseUrl = "https://rbplnybmjwcoigiwtkuh.supabase.co";
const defaultSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicGxueWJtandjb2lnaXd0a3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzNDQyNDUsImV4cCI6MjAzMDkyMDI0NX0.12xSasN9rsx8JzJLN_BImCvYu_7oFP_sXHdGWrnN5CM";
const supabaseUrl =
  ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? defaultSupabaseUrl).replace(
    /\/+$/,
    ""
  );
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  defaultSupabaseAnonKey;

const company = {
  legalName: "KRISTENSON",
  cvr: "40679456",
  form: "Personligt ejet Mindre Virksomhed",
  address: "Blomstergården 13, 4700 Næstved",
  source: "CVR/Virk via Proff"
};

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

const navItems = [
  { href: "#venteliste", label: "Venteliste" },
  { href: "#for-hvem", label: "For hvem" },
  { href: "#appen", label: "Appen" },
  { href: "#traener", label: "Trænere" },
  { href: "#faq", label: "FAQ" }
];

const audienceOptions: {
  id: AudienceId;
  title: string;
  label: string;
  description: string;
}[] = [
  {
    id: "begynder",
    title: "Begynder",
    label: "Jeg vil i gang",
    description: "Dagens pas, færre valg og en rolig start i centeret."
  },
  {
    id: "selvtraenende",
    title: "Selvtrænende",
    label: "Jeg træner allerede",
    description: "Program, log, historik og progression uden løse noter."
  },
  {
    id: "traener",
    title: "Træner",
    label: "Jeg arbejder med klienter",
    description: "Klienter, planer og opfølgning i et mere samlet flow."
  },
  {
    id: "nysgerrig",
    title: "Nysgerrig",
    label: "Jeg vil bare høre mere",
    description: "Få besked, når der er nyt om appen og åbningen."
  }
];

const productPillars = [
  {
    title: "Programmet før passet",
    text: "Se dagens træning uden at lede gennem gamle noter, screenshots og halve planer.",
    image: "/app/programs.jpg",
    imageAlt: "Programmer i Træningsmester"
  },
  {
    title: "Loggen undervejs",
    text: "Sæt, reps, vægt og noter ligger tæt på øvelsen, så træningen ikke bliver til administration.",
    image: "/app/home-training.jpg",
    imageAlt: "Dagens træning i Træningsmester"
  },
  {
    title: "Historikken bagefter",
    text: "Når du kommer tilbage, skal sidste løft og næste beslutning være nemme at finde.",
    image: "/app/exercises.jpg",
    imageAlt: "Øvelseskatalog i Træningsmester"
  }
];

const launchSteps = [
  {
    label: "Nu",
    title: "Pre-launch",
    text: "Siden samler interesserede, så de rigtige brugere kan få besked først."
  },
  {
    label: "Næste",
    title: "Første adgang",
    text: "Ventelisten bruges til at prioritere begyndere, selvtrænende og trænere med tydelige behov."
  },
  {
    label: "Efter åbning",
    title: "Produktfeedback",
    text: "De første brugere hjælper med at gøre program, logging og coach-flow skarpere."
  }
];

const faqRows = [
  {
    question: "Hvornår kommer appen?",
    answer:
      "Der er ikke låst en offentlig dato endnu. Skriv dig op, så får du besked, når der åbnes for adgang eller nyt om lanceringen."
  },
  {
    question: "Er Træningsmester kun for øvede?",
    answer:
      "Nej. Siden er også lavet til begyndere, der vil have en rolig vej ind i træning uden at skulle forstå hele programteorien først."
  },
  {
    question: "Kan trænere bruge appen?",
    answer:
      "Ja, trænerdelen er tænkt som et arbejdsrum til klienter, programmer og opfølgning. Ventelisten hjælper med at finde de rigtige trænerbehov før åbning."
  },
  {
    question: "Hvad sker der med min mail?",
    answer:
      "Mailen bruges til at kontakte dig om Træningsmester. Siden bruger ikke marketingcookies eller statistikværktøjer."
  }
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
    text: "Rammen for appadgang, køb og digitale funktioner.",
    scope: "Køb og adgang"
  },
  {
    id: "privacy",
    title: "Privatliv",
    text: "Hvordan websitet, ventelisten og appens data adskilles.",
    scope: "Data"
  },
  {
    id: "cookies",
    title: "Cookiepolitik",
    text: "Kun nødvendig lagring til at huske dit cookievalg.",
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
      "Hjemmesiden er en pre-launch side. Den henter ikke dine træningsdata og beder ikke om konto, helbred, lokation eller betaling.",
    sections: [
      {
        heading: "Ansvarlig virksomhed",
        body: `${company.legalName}, CVR ${company.cvr}, er den offentligt registrerede virksomhed bag siden. Kilde: ${company.source}.`
      },
      {
        heading: "Ventelisten",
        body:
          "Når du sender ventelisteformularen, gemmes din email i Træningsmesters Supabase-database, så du kan få besked, når appen åbner. Siden sender ikke bekræftelsesmail og åbner ikke din mailklient."
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
          "Links, knapper, dokumenter, cookieindstillinger, formular og modaler kan nås med tastatur og har synlig fokusmarkering."
      },
      {
        heading: "Kontrast",
        body:
          "Siden bruger tydelige mørke og lyse flader med markante knapper, linjer og statusmarkeringer."
      },
      {
        heading: "Bevægelse",
        body:
          "Siden respekterer reduceret bevægelse i browseren og bruger ikke animationer, som er nødvendige for at forstå indholdet."
      },
      {
        heading: "Billeder",
        body:
          "App-skærme og centrale billeder har tekstalternativer, mens rene dekorative billeder holdes uden læst tekst."
      }
    ]
  }
};

const initialWaitlistForm: WaitlistFormState = {
  email: "",
  consent: false
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const saveWaitlistSignup = async (email: string) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/prelaunch_waitlist_signups`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      email,
      audience: "nysgerrig",
      audience_label: "Pre-launch signup",
      source: siteUrl,
      consent: true,
      submitted_at: new Date().toISOString(),
      metadata: {
        capture: "prelaunch-site"
      }
    })
  });

  if (response.ok) return;

  const responseText = await response.text().catch(() => "");
  if (response.status === 409 && responseText.includes("23505")) return;

  throw new Error(`Waitlist insert failed: ${response.status}`);
};

function App() {
  const [activeLegalPanel, setActiveLegalPanel] = useState<LegalPanelId | null>(null);
  const [cookieChoice, setCookieChoice] = useState<CookieChoice | null>(null);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waitlistForm, setWaitlistForm] =
    useState<WaitlistFormState>(initialWaitlistForm);
  const [waitlistState, setWaitlistState] = useState<WaitlistState>({ type: "idle" });
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
    setMobileMenuOpen(false);
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
    setMobileMenuOpen(false);
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
      setMobileMenuOpen(false);
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
    if (!activeLegalPanel && !cookieSettingsOpen && !mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          return;
        }

        if (activeLegalPanel) {
          closeLegalPanel();
          return;
        }

        closeCookieSettings();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeLegalPanel, cookieSettingsOpen, mobileMenuOpen]);

  const saveCookieChoice = () => {
    storeCookieChoice("necessary");
    setCookieChoice("necessary");
    closeCookieSettings();
  };

  const updateWaitlistField = <Key extends keyof WaitlistFormState>(
    key: Key,
    value: WaitlistFormState[Key]
  ) => {
    setWaitlistForm((current) => ({ ...current, [key]: value }));
    if (waitlistState.type !== "idle" && waitlistState.type !== "submitting") {
      setWaitlistState({ type: "idle" });
    }
  };

  const handleWaitlistSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = waitlistForm.email.trim().toLowerCase();
    if (!emailPattern.test(email)) {
      setWaitlistState({
        type: "error",
        message: "Skriv en gyldig emailadresse."
      });
      return;
    }

    if (!waitlistForm.consent) {
      setWaitlistState({
        type: "error",
        message: "Accepter kontakt om Træningsmester for at skrive dig op."
      });
      return;
    }

    setWaitlistState({ type: "submitting" });

    try {
      await saveWaitlistSignup(email);
      setWaitlistState({
        type: "submitted",
        message: "Tak. Din email er skrevet op."
      });
      setWaitlistForm(initialWaitlistForm);
    } catch {
      setWaitlistState({
        type: "error",
        message: "Kunne ikke skrive dig op lige nu. Prøv igen om lidt."
      });
    }
  };

  return (
    <>
      <header className="site-header" aria-label="Hovednavigation">
        <a className="brand-mark" href="#top" aria-label="Træningsmester top">
          <img src="/brand/tm-logo.png" alt="" />
          <span>Træningsmester</span>
        </a>
        <button
          aria-controls="site-nav"
          aria-expanded={mobileMenuOpen}
          className="menu-toggle"
          onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          Menu
        </button>
        <nav className={mobileMenuOpen ? "is-open" : ""} id="site-nav">
          {navItems.map((item) => (
            <a href={item.href} key={item.href} onClick={() => setMobileMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-copy">
            <img className="hero-logo" src="/brand/tm-logo.png" alt="" />
            <h1 id="hero-title">Træningsmester kommer snart</h1>
            <p>
              En dansk træningsapp til program, logging, historik og coach-arbejde.
              Skriv dig op og få besked, når appen åbner.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#venteliste">
                Skriv mig op
              </a>
              <a className="button-secondary" href="#appen">
                Se hvad der bygges
              </a>
            </div>
          </div>

          <section className="signup-panel" id="venteliste" aria-labelledby="waitlist-title">
            <div className="signup-head">
              <span>Pre-launch liste</span>
              <h2 id="waitlist-title">Få besked ved åbning.</h2>
              <p>
                Skriv din email op, så får du besked, når Træningsmester åbner.
              </p>
            </div>

            <form className="waitlist-form" onSubmit={handleWaitlistSubmit}>
              <label>
                Email
                <input
                  autoComplete="email"
                  inputMode="email"
                  name="email"
                  onChange={(event) => updateWaitlistField("email", event.target.value)}
                  placeholder="din@email.dk"
                  required
                  type="email"
                  value={waitlistForm.email}
                />
              </label>

              <label className="consent-row">
                <input
                  checked={waitlistForm.consent}
                  onChange={(event) =>
                    updateWaitlistField("consent", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  I må kontakte mig om Træningsmester. Jeg kan altid svare og bede om
                  at blive fjernet.
                </span>
              </label>

              <button
                className="button-primary form-submit"
                disabled={waitlistState.type === "submitting"}
                type="submit"
              >
                {waitlistState.type === "submitting" ? "Sender..." : "Skriv mig op"}
              </button>

              {waitlistState.type !== "idle" && waitlistState.type !== "submitting" ? (
                <p className={`form-message ${waitlistState.type}`}>
                  {waitlistState.message}
                </p>
              ) : null}
            </form>
          </section>

          <div className="hero-device" aria-label="App-preview">
            <img src="/app/home-training.jpg" alt="Dagens træning i appen" />
          </div>
        </section>

        <section className="audience-section section-band" id="for-hvem">
          <div className="section-head compact">
            <span>For hvem</span>
            <h2>Træning ser forskellig ud, men behovet er det samme: næste handling skal være klar.</h2>
          </div>
          <div className="audience-grid">
            {audienceOptions.map((option) => (
              <article key={option.id}>
                <span>{option.title}</span>
                <h3>{option.label}</h3>
                <p>{option.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="preview-section section-band dark" id="appen">
          <div className="preview-copy">
            <span>Appen</span>
            <h2>Bygget omkring det, der sker før, under og efter træningen.</h2>
            <p>
              Træningsmester skal samle programmet, træningspasset og historikken i en
              rolig arbejdsgang, så appen hjælper uden at overtage fokus.
            </p>
          </div>
          <div className="phone-stack" aria-label="Skærmbilleder fra Træningsmester">
            <img src="/app/programs.jpg" alt="Programmer i Træningsmester" />
            <img src="/app/home-training.jpg" alt="Dagens træning i Træningsmester" />
            <img src="/app/exercises.jpg" alt="Øvelser i Træningsmester" />
          </div>
        </section>

        <section className="pillar-section section-band">
          <div className="pillar-list">
            {productPillars.map((pillar, index) => (
              <article key={pillar.title}>
                <div>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </div>
                <img src={pillar.image} alt={pillar.imageAlt} />
              </article>
            ))}
          </div>
        </section>

        <section className="coach-section section-band" id="traener">
          <div className="coach-photo" aria-hidden="true" />
          <div className="coach-copy">
            <span>Trænere</span>
            <h2>Coach-arbejdet skal være et arbejdsrum, ikke endnu en beskedtråd.</h2>
            <p>
              Træningsmester er også rettet mod trænere, der vil samle klienter,
              programmer og opfølgning tættere på selve træningen.
            </p>
            <a className="button-secondary dark-button" href="#venteliste">
              Skriv dig op som træner
            </a>
          </div>
          <div className="coach-device">
            <img src="/app/coach.jpg" alt="Coach-overblik i Træningsmester" />
          </div>
        </section>

        <section className="launch-section section-band dark">
          <div className="section-head">
            <span>Pre-launch</span>
            <h2>Ventelisten hjælper med at åbne appen i den rigtige rækkefølge.</h2>
          </div>
          <div className="launch-steps">
            {launchSteps.map((step) => (
              <article key={step.label}>
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section section-band" id="faq">
          <div className="section-head">
            <span>FAQ</span>
            <h2>Kort om lancering, målgruppe og kontakt.</h2>
          </div>
          <div className="faq-list">
            {faqRows.map((row) => (
              <article key={row.question}>
                <h3>{row.question}</h3>
                <p>{row.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="official section-band">
          <div className="official-head">
            <span>Praktisk</span>
            <h2>Vilkår, privatliv og cookies ligger samlet her.</h2>
          </div>

          <div className="document-list" aria-label="Dokumenter">
            {documentRows.map((row) => (
              <article key={row.id}>
                <div>
                  <span>{row.scope}</span>
                  <h3>{row.title}</h3>
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
        </section>
      </main>

      <footer>
        <div>
          <img src="/brand/tm-logo.png" alt="" />
          <p>Træningsmester · pre-launch venteliste.</p>
          <small>
            {company.legalName} · CVR {company.cvr}
          </small>
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
                <p>{activeLegal.kicker}</p>
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
                <p>Cookieindstillinger</p>
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
              <button type="button" onClick={() => openLegalPanel("cookies")}>
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
            <p>Kun nødvendig lagring til at huske dit valg.</p>
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
                operatingSystem: "iOS, Android, watchOS",
                url: siteUrl,
                description:
                  "Dansk træningsapp på vej til program, log, historik og coach-samarbejde.",
                applicationSubCategory: "FitnessApplication",
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

const rootElement = document.getElementById("root")!;
const windowWithRoot = window as Window & { __traeningsmesterRoot?: Root };
const root = windowWithRoot.__traeningsmesterRoot ?? createRoot(rootElement);
windowWithRoot.__traeningsmesterRoot = root;
root.render(<App />);
