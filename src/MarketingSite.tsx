import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import BearHatScene from "./components/BearHatScene";
import "./marketing.css";

type WaitlistState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; message: string }
  | { type: "error"; field: "email" | "consent" | "network"; message: string };

type WaitlistResponse = {
  ok?: boolean;
  code?: string;
  confirmation?: "accepted";
};

type LegalRoute = "privatliv" | "vilkaar" | "cookies" | "tilgaengelighed";

const siteUrl = "https://www.traeningsmester.dk/";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const company = {
  legalName: "KRISTENSON",
  cvr: "40679456",
  address: "Blomstergården 13, 4700 Næstved",
  email: "christiankristensen123@gmail.com",
  phoneDisplay: "53 63 73 60",
  phoneHref: "+4553637360"
};

const legalRoutes: Record<string, LegalRoute> = {
  "/privatliv": "privatliv",
  "/vilkaar": "vilkaar",
  "/cookies": "cookies",
  "/tilgaengelighed": "tilgaengelighed"
};

const legalDocuments: Record<
  LegalRoute,
  {
    title: string;
    intro: string;
    updated: string;
    sections: Array<{ title: string; body: ReactNode }>;
  }
> = {
  privatliv: {
    title: "Privatliv",
    intro:
      "Her kan du se, hvilke oplysninger marketinghjemmesiden, ventelisten og den nuværende webapp behandler, hvorfor de bruges, og hvilke valg du har.",
    updated: "13. juli 2026",
    sections: [
      {
        title: "Dataansvarlig",
        body: (
          <>
            {company.legalName}, CVR {company.cvr}, {company.address}, er virksomheden bag
            Træningsmester. Du kan kontakte den dataansvarlige på{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a> eller{" "}
            <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>.
          </>
        )
      },
      {
        title: "Ventelisten: data, formål og grundlag",
        body:
          "Når du skriver dig op, gemmer vi din email, et generelt målgruppemærke, siden og en eventuel referrer, samtykkets tekst/version og tidspunkt samt status for bekræftelse og levering. En pseudonymiseret tokenværdi gør sikker afmelding mulig. Formålet er alene at sende e-mails om Træningsmesters lancering og adgangsrunder. Retsgrundlaget er dit samtykke efter GDPR artikel 6, stk. 1, litra a."
      },
      {
        title: "Sikkerhed og misbrug",
        body:
          "Ved tilmelding bruges en envejs-hash af forbindelsens IP-adresse midlertidigt til at begrænse automatiseret misbrug. Den rå IP-adresse gemmes ikke i ventelistedatabasen, og den midlertidige rate-limitværdi udløber senest efter 10 minutter i den aktive serverproces. Tekniske drifts- og sikkerhedslogs kan behandles af hostingudbyderen. Grundlaget er den legitime interesse i stabil og sikker drift efter GDPR artikel 6, stk. 1, litra f."
      },
      {
        title: "Når du bruger webappen",
        body:
          "Webappen bruger Supabase til konto og session og kan hente eller gemme profiloplysninger, programmer, sæt, noter, kropsvægt samt trænings- og aktivitetshistorik. De valgte funktioner leveres på grundlag af GDPR artikel 6, stk. 1, litra b. Ved oprettelse af en ny konto indhentes et særskilt, udtrykkeligt samtykke til oplysninger, der kan afsløre helbred eller fysisk tilstand, efter GDPR artikel 9, stk. 2, litra a. Eksisterende konti uden den aktuelle samtykkeversion bliver bedt om samme valg, før appens dataflader åbnes; version, tidspunkt og valg gemmes med kontoen. Appen gemmer også en lokal kopi på din enhed, så tilstand og igangværende arbejde kan huskes. Der træffes ikke afgørelser alene ved automatiseret behandling, som har retsvirkning eller tilsvarende væsentlig betydning for dig."
      },
      {
        title: "Databehandlere og overførsler",
        body:
          "Supabase bruges til database og login; Træningsmester-projektet ligger i Supabases EU-region eu-central-1 (Frankfurt). Vercel bruges til hosting og serverfunktioner, og Resend bruges til at levere ventelistemails. Hvis en leverandør eller underdatabehandler behandler oplysninger uden for EU/EØS, skal overførslen være omfattet af et gyldigt grundlag efter GDPR kapitel V, eksempelvis en tilstrækkelighedsafgørelse eller EU-Kommissionens standardkontraktbestemmelser. Du kan bede om oplysninger om det aktuelle grundlag og de relevante garantier via kontaktmailen ovenfor."
      },
      {
        title: "Opbevaring",
        body:
          "Ventelistetilmeldingen slettes, når ventelistens formål er afsluttet, eller når du gennemfører afmelding. Webappens aktuelle lokale appkopi ryddes ved logout; data kan også fjernes via browserens indstillinger. Konto- og træningsdata opbevares, mens kontoen er aktiv, og slettes eller anonymiseres efter en gyldig sletteanmodning, medmindre oplysninger skal bevares i en begrænset periode af hensyn til dokumentation, sikkerhed eller et retskrav. Leverandørers backups og sikkerhedslogs udfases efter deres gældende slettecyklusser."
      },
      {
        title: "Dine rettigheder",
        body: (
          <>
            Du kan bede om indsigt, rettelse, sletning, begrænsning og dataportabilitet og kan
            gøre indsigelse, når behandlingen bygger på en legitim interesse. Samtykke kan
            altid trækkes tilbage med virkning for fremtiden; ventelistesamtykket trækkes
            gratis tilbage via afmeldingslinket i mails. Skriv til{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a>. Hvis du er utilfreds med
            behandlingen, kan du klage til{" "}
            <a href="https://www.datatilsynet.dk/borger/klage" rel="noreferrer">
              Datatilsynet
            </a>
            .
          </>
        )
      }
    ]
  },
  vilkaar: {
    title: "Vilkår",
    intro:
      "Hjemmesiden er en pre-launch side. Den sælger ikke abonnementer eller andre digitale ydelser direkte.",
    updated: "13. juli 2026",
    sections: [
      {
        title: "Ventelisten",
        body:
          "En tilmelding er gratis og forpligter ikke til køb. Der er endnu ingen offentlig lanceringsdato, og en plads på ventelisten er ikke en garanti for adgang på et bestemt tidspunkt."
      },
      {
        title: "Webappen",
        body:
          "Webappen er en separat produktflade. Funktioner kan ændre sig under udvikling, og lokale ændringer er ikke nødvendigvis synkroniseret til serveren."
      },
      {
        title: "Fremtidige køb",
        body:
          "Hvis betalte funktioner åbner, skal pris, periode, fornyelse, opsigelse og eventuelle fortrydelsesvilkår fremgå i det konkrete betalingsflow før køb."
      },
      {
        title: "Virksomhed og kontakt",
        body: (
          <>
            Træningsmester drives af {company.legalName}, CVR {company.cvr},{" "}
            {company.address}. Kontakt{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a> eller{" "}
            <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>.
          </>
        )
      }
    ]
  },
  cookies: {
    title: "Cookiepolitik",
    intro:
      "Marketinghjemmesiden bruger ingen markedsførings- eller statistikcookies og sætter ikke unødvendig lokal lagring.",
    updated: "13. juli 2026",
    sections: [
      {
        title: "På hjemmesiden",
        body:
          "Forsiden, produktinformationen og ventelisten kræver ikke cookies. Appskærme, logo og animation leveres fra samme website."
      },
      {
        title: "Nødvendig lagring i webappen",
        body:
          "Webappen bruger lokal browserlagring til Supabase-login, cache og appens tilstand. Det kan omfatte konto-id/email, profil og kontaktoplysninger, indstillinger, kropsvægt, programmer, sæt, noter, historik og igangværende træning. Lagringen bruges for at holde dig logget ind og huske dit arbejde på enheden; den bruges ikke til annoncer eller statistik."
      },
      {
        title: "Varighed og sletning",
        body:
          "Lokal appdata har ingen automatisk udløbsdato, mens du er logget ind. Logout rydder webappens aktuelle lokale appkopi og Supabase-session. Browseren kan desuden ryddes manuelt via dens indstillinger, hvilket anbefales efter brug på en delt enhed."
      },
      {
        title: "Ingen skjult tracking",
        body:
          "Der er ikke tilføjet annoncepixels, tredjepartsanalyse eller marketingprofiler på marketinghjemmesiden. Hvis ikke-nødvendig tracking, embeds eller lagring tilføjes senere, skal den blokeres, indtil du har fået tydelig information og har valgt den til."
      }
    ]
  },
  tilgaengelighed: {
    title: "Tilgængelighed",
    intro:
      "Træningsmester arbejder for, at siden kan forstås og bruges med tastatur, hjælpemidler og reduceret bevægelse.",
    updated: "13. juli 2026",
    sections: [
      {
        title: "Tastatur og fokus",
        body:
          "Navigation, formularer, FAQ og links er bygget med navngivne standardelementer og synlig fokusmarkering. Mobilmenuen lukker med Escape, låser baggrunden, mens den er åben, og fører fokus tilbage til en logisk placering."
      },
      {
        title: "Bevægelse og grafik",
        body:
          "Hjemmesiden respekterer indstillingen Reducer bevægelse. Den animerede bjørn skifter i så fald til et statisk billede, uden at information går tabt."
      },
      {
        title: "Kontrast og tekst",
        body: (
          <>
            Siden bruger tydelig kontrast, fleksibel tekststørrelse og responsive layouts. Hvis
            du oplever en barriere, kan du skrive til{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a> og beskrive siden og
            problemet.
          </>
        )
      }
    ]
  }
};

const phases = [
  {
    number: "01",
    label: "Før træningen",
    title: "Dagens program er klart",
    body: "Se dagens træning, rækkefølgen og de mål, du allerede har sat."
  },
  {
    number: "02",
    label: "Undervejs",
    title: "Log uden at miste fokus",
    body: "Sæt, gentagelser, vægt og pausetid ligger tæt på den øvelse, du er i gang med."
  },
  {
    number: "03",
    label: "Bagefter",
    title: "Se udviklingen i sammenhæng",
    body: "Historik, cardio og progression samles, så næste træning kan begynde med overblik."
  }
];

const featureRows = [
  {
    number: "01",
    title: "Programmer, der kan ændres",
    body: "Byg dit eget program, importér det du allerede følger, eller tilpas en træningsdag undervejs."
  },
  {
    number: "02",
    title: "Sæt, reps, vægt og timere",
    body: "Vælg enkel registrering eller det fulde overblik. Træningen skal passe til din måde at logge på."
  },
  {
    number: "03",
    title: "Styrke, cardio og historik",
    body: "Følg styrketræning og kondition i samme personlige historik uden at blande dine data med et offentligt feed."
  }
];

const heroSignals = [
  { label: "Planlæg", value: "Dit eget program" },
  { label: "Log", value: "Sæt, vægt og pauser" },
  { label: "Følg", value: "Styrke og cardio samlet" }
];

const faqRows = [
  {
    question: "Hvornår åbner Træningsmester?",
    answer:
      "Der er endnu ingen offentlig lanceringsdato. Ventelisten får besked, når næste adgangsrunde åbner."
  },
  {
    question: "Hvem er appen til?",
    answer:
      "Træningsmester er til personlig træning: fra den første strukturerede træningsuge til programmer, progression og detaljeret logning."
  },
  {
    question: "Hvad sker der med min email?",
    answer:
      "Den gemmes med dit samtykke og bruges kun til e-mails om lancering og adgangsrunder. Du får en neutral bekræftelse og kan altid afmelde dig gratis via linket i mails."
  },
  {
    question: "Kan jeg bruge den til cardio?",
    answer:
      "Ja. Træningsmester samler styrketræning med blandt andet løb, gang og cykling, så aktiviteterne kan ses i samme historik."
  }
];

function Arrow({ direction = "right" }: { direction?: "right" | "left" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === "right" ? "M5 12h14M14 7l5 5-5 5" : "M19 12H5m5-5-5 5 5 5"} />
    </svg>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="mk-brand">
      <img src="/brand/tm-logo.png" alt="" width="46" height="46" />
      {!compact ? <strong>Træningsmester</strong> : null}
    </span>
  );
}

function WaitlistForm({ idPrefix, dark = false }: { idPrefix: string; dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<WaitlistState>({ type: "idle" });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!emailPattern.test(cleanEmail)) {
      setState({ type: "error", field: "email", message: "Skriv en gyldig emailadresse." });
      return;
    }
    if (!consent) {
      setState({
        type: "error",
        field: "consent",
        message: "Sæt kryds, hvis KRISTENSON må sende dig e-mails om lancering og adgang."
      });
      return;
    }

    setState({ type: "submitting" });
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        referrerPolicy: "origin",
        body: JSON.stringify({
          email: cleanEmail,
          audience: "nysgerrig",
          audienceLabel: "Pre-launch signup",
          consent: true,
          source: `${window.location.origin}${window.location.pathname}`,
          submittedAt: new Date().toISOString(),
          website
        })
      });
      const payload = (await response.json().catch(() => ({}))) as WaitlistResponse;
      if (!response.ok) {
        if (payload.code === "RATE_LIMITED") {
          throw new Error("rate limited");
        }
        throw new Error("waitlist rejected");
      }
      setEmail("");
      setConsent(false);
      setWebsite("");
      setState({
        type: "success",
        message:
          "Tak. Din tilmelding er registreret. Hvis adressen er ny, har vi sendt en neutral bekræftelsesmail."
      });
    } catch (error) {
      setState({
        type: "error",
        field: "network",
        message:
          error instanceof Error && error.message === "rate limited"
            ? "Der er sendt for mange tilmeldinger herfra. Prøv igen om lidt."
            : "Tilmeldingen kunne ikke gemmes lige nu. Prøv igen om lidt."
      });
    }
  };

  const messageId = `${idPrefix}-waitlist-message`;
  return (
    <form className={`mk-waitlist ${dark ? "is-dark" : ""}`} onSubmit={submit} noValidate>
      <div className="mk-waitlist-row">
        <label className="mk-sr-only" htmlFor={`${idPrefix}-email`}>
          Email
        </label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="din@email.dk"
          value={email}
          aria-invalid={state.type === "error" && state.field === "email"}
          aria-describedby={state.type === "error" && state.field === "email" ? messageId : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state.type !== "submitting") setState({ type: "idle" });
          }}
          data-testid={`${idPrefix}-waitlist-email`}
        />
        <button type="submit" disabled={state.type === "submitting"} data-testid={`${idPrefix}-waitlist-submit`}>
          <span>{state.type === "submitting" ? "Sender…" : "Skriv mig op"}</span>
          <Arrow />
        </button>
      </div>
      <div className="mk-honeypot" aria-hidden="true">
        <label htmlFor={`${idPrefix}-website`}>Lad dette felt stå tomt</label>
        <input
          id={`${idPrefix}-website`}
          name="website"
          type="text"
          value={website}
          tabIndex={-1}
          autoComplete="off"
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      <label className="mk-consent">
        <input
          type="checkbox"
          checked={consent}
          aria-invalid={state.type === "error" && state.field === "consent"}
          aria-describedby={state.type === "error" && state.field === "consent" ? messageId : undefined}
          onChange={(event) => {
            setConsent(event.target.checked);
            if (state.type !== "submitting") setState({ type: "idle" });
          }}
          data-testid={`${idPrefix}-waitlist-consent`}
        />
        <span>
          Jeg giver KRISTENSON (CVR {company.cvr}) samtykke til at sende mig e-mails om
          Træningsmesters lancering og adgangsrunder. Jeg kan altid afmelde mig gratis via
          linket i mails.
        </span>
      </label>
      <p className="mk-consent-privacy">
        <a href="/privatliv">Se privatlivspolitikken.</a>
      </p>
      {state.type === "success" || state.type === "error" ? (
        <p id={messageId} className={`mk-form-message ${state.type}`} role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !open) return;
      setOpen(false);
      menuRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    const main = window.document.querySelector<HTMLElement>(".tm-marketing main");
    const footer = window.document.querySelector<HTMLElement>(".tm-marketing footer");
    const previousOverflow = window.document.body.style.overflow;
    const background = [main, footer, brandRef.current].filter(Boolean) as HTMLElement[];

    if (open) {
      background.forEach((element) => element.setAttribute("inert", ""));
      window.document.body.style.overflow = "hidden";
    } else {
      background.forEach((element) => element.removeAttribute("inert"));
    }

    return () => {
      background.forEach((element) => element.removeAttribute("inert"));
      window.document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const closeForDestination = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const selector = event.currentTarget.getAttribute("href");
    setOpen(false);
    if (!selector?.startsWith("#")) return;
    window.requestAnimationFrame(() => {
      const target = window.document.querySelector<HTMLElement>(selector);
      if (!target) return;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    });
  };

  return (
    <header className="mk-header">
      <a ref={brandRef} className="mk-brand-link" href="#top" aria-label="Træningsmester forside">
        <Brand />
      </a>
      <button
        ref={menuRef}
        className="mk-menu"
        type="button"
        aria-label={open ? "Luk menu" : "Åbn menu"}
        aria-expanded={open}
        aria-controls="mk-primary-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
      </button>
      <nav
        id="mk-primary-navigation"
        className={`mk-nav ${open ? "is-open" : ""}`}
        aria-label="Hovednavigation"
      >
        <a href="#saadan" onClick={closeForDestination}>
          Sådan virker det
        </a>
        <a href="#funktioner" onClick={closeForDestination}>
          Funktioner
        </a>
        <a href="#faq" onClick={closeForDestination}>
          FAQ
        </a>
        <a className="mk-nav-cta" href="#venteliste" onClick={closeForDestination}>
          Skriv mig op <Arrow />
        </a>
      </nav>
    </header>
  );
}

function PhoneFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <figure className={`mk-phone ${className}`}>
      <span className="mk-phone-speaker" aria-hidden="true" />
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  );
}

function MarketingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-brand">
        <Brand />
        <address>
          {company.legalName} · CVR {company.cvr}
          <br />
          {company.address}
          <br />
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <br />
          <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>
        </address>
      </div>
      <nav aria-label="Juridiske links">
        <a href="/privatliv">Privatliv</a>
        <a href="/cookies">Cookiepolitik</a>
        <a href="/tilgaengelighed">Tilgængelighed</a>
        <a href="/vilkaar">Vilkår</a>
      </nav>
    </footer>
  );
}

function MarketingHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Træningsmester — træning med retning. Uden støj.";
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-mk-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 }
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="tm-marketing" ref={rootRef}>
      <MarketingHeader />
      <main id="top">
        <section className="mk-hero mk-wrap" aria-labelledby="mk-hero-title">
          <div className="mk-hero-copy" data-mk-reveal>
            <p className="mk-hero-kicker">
              <span aria-hidden="true" />
              Din personlige træningsapp
            </p>
            <h1 id="mk-hero-title">Træning med retning. Uden støj.</h1>
            <p className="mk-hero-lead">
              Program før træningen. Rolig logning undervejs. Historik, cardio og progression
              samlet bagefter.
            </p>
            <WaitlistForm idPrefix="hero" />
            <a className="mk-text-link" href="#saadan">
              Se hvordan det virker <Arrow />
            </a>
          </div>
          <div className="mk-hero-visual" data-mk-reveal>
            <BearHatScene />
          </div>
        </section>

        <section className="mk-signal-strip mk-wrap" aria-label="Kort om Træningsmester">
          {heroSignals.map((signal, index) => (
            <article key={signal.label}>
              <span aria-hidden="true">0{index + 1}</span>
              <div>
                <small>{signal.label}</small>
                <strong>{signal.value}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="mk-intro mk-wrap" id="saadan" data-mk-reveal>
          <div className="mk-intro-heading">
            <p className="mk-section-kicker">Fra plan til progression</p>
            <h2>Én træning ad gangen.</h2>
          </div>
          <p>
            Træningsmester gør det enkelt at planlægge, gennemføre og følge din udvikling.
            Det hele bor ét sted, så næste handling er tydelig uden at fylde hele skærmen.
          </p>
        </section>

        <section className="mk-flow mk-wrap" aria-labelledby="mk-flow-title">
          <div className="mk-flow-copy" data-mk-reveal>
            <p className="mk-section-kicker">Sådan hænger det sammen</p>
            <h2 id="mk-flow-title">Før, under og efter.</h2>
            <div className="mk-phase-line" aria-hidden="true" />
            <div className="mk-phases">
              {phases.map((phase) => (
                <article key={phase.number}>
                  <span>{phase.number}</span>
                  <small>{phase.label}</small>
                  <h3>{phase.title}</h3>
                  <p>{phase.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mk-phone-stage" data-mk-reveal>
            <PhoneFrame
              src="/app/home-training.jpg"
              alt="Dagens træning i Træningsmester"
              className="is-back"
            />
            <PhoneFrame src="/app/programs.jpg" alt="Programmer i Træningsmester" className="is-main" />
            <PhoneFrame src="/app/exercises.jpg" alt="Øvelseskatalog i Træningsmester" className="is-front" />
          </div>
        </section>

        <section className="mk-feature-band mk-wrap" id="funktioner" data-mk-reveal>
          <div className="mk-feature-device" aria-hidden="true">
            <PhoneFrame src="/app/home-training.jpg" alt="" />
          </div>
          <div className="mk-feature-intro">
            <p className="mk-section-kicker is-light">Dit samlede overblik</p>
            <h2>Styrke og cardio i samme rytme.</h2>
            <p>
              Træningen må gerne skifte form. Overblikket skal stadig føles som dit eget.
            </p>
          </div>
          <div className="mk-feature-list">
            {featureRows.map((feature) => (
              <article key={feature.number}>
                <span>{feature.number}</span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="mk-privacy-note mk-wrap" data-mk-reveal>
          <span aria-hidden="true">✓</span>
          <p>
            Dit træningsoverblik er personligt. Hjemmesiden bruger ingen markedsførings- eller
            statistikcookies.
          </p>
          <a href="/privatliv">
            Læs om data og privatliv <Arrow />
          </a>
        </aside>

        <section className="mk-faq mk-wrap" id="faq" aria-labelledby="mk-faq-title">
          <div className="mk-faq-intro" data-mk-reveal>
            <p className="mk-section-kicker">Før du skriver dig op</p>
            <h2 id="mk-faq-title">Det er fair at spørge.</h2>
            <p>Her er svar på det, vi oftest bliver spurgt om før åbningen.</p>
          </div>
          <div className="mk-faq-list" data-mk-reveal>
            {faqRows.map((row, index) => {
              const open = openFaq === index;
              const answerId = `faq-answer-${index}`;
              return (
                <article className={open ? "is-open" : ""} key={row.question}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(open ? null : index)}
                  >
                    <span>{row.question}</span>
                    <i aria-hidden="true" />
                  </button>
                  <div id={answerId} className="mk-faq-answer" hidden={!open}>
                    <p>{row.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mk-final mk-wrap" id="venteliste" aria-labelledby="mk-final-title">
          <div data-mk-reveal>
            <p className="mk-section-kicker is-light">Ventelisten er åben</p>
            <h2 id="mk-final-title">Vær med fra første træning.</h2>
            <p>Skriv dig op og få besked, når Træningsmester åbner.</p>
          </div>
          <div data-mk-reveal>
            <WaitlistForm idPrefix="footer" dark />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function LegalPage({ route }: { route: LegalRoute }) {
  const document = legalDocuments[route];
  useEffect(() => {
    window.scrollTo(0, 0);
    window.document.title = `${document.title} — Træningsmester`;
    const canonicalUrl = new URL(`/${route}`, siteUrl).href;
    const canonical = window.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;
    const metaUpdates: Array<[string, string, string]> = [
      ["property", "og:title", `${document.title} — Træningsmester`],
      ["property", "og:description", document.intro],
      ["property", "og:url", canonicalUrl],
      ["name", "twitter:title", `${document.title} — Træningsmester`],
      ["name", "twitter:description", document.intro],
      ["name", "description", document.intro]
    ];
    metaUpdates.forEach(([attribute, name, content]) => {
      const meta = window.document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (meta) meta.content = content;
    });
  }, [document.intro, document.title, route]);

  return (
    <div className="tm-marketing mk-legal-page">
      <header className="mk-legal-header">
        <a href="/" aria-label="Tilbage til Træningsmester">
          <Brand />
        </a>
        <a className="mk-back-link" href="/">
          <Arrow direction="left" /> Tilbage
        </a>
      </header>
      <main>
        <div className="mk-legal-hero">
          <h1>{document.title}</h1>
          <p>{document.intro}</p>
          <p className="mk-legal-updated">Senest opdateret {document.updated}</p>
        </div>
        <div className="mk-legal-content">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

function UnsubscribePage() {
  const fragmentToken = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
  const token = fragmentToken ?? new URLSearchParams(window.location.search).get("token") ?? "";
  const validToken = /^[A-Za-z0-9_-]{43}$/.test(token);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    window.scrollTo(0, 0);
    window.document.title = "Afmeld ventelisten — Træningsmester";
    const robots = window.document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (robots) robots.content = "noindex, nofollow, noarchive";
    let referrer = window.document.querySelector<HTMLMetaElement>('meta[name="referrer"]');
    if (!referrer) {
      referrer = window.document.createElement("meta");
      referrer.name = "referrer";
      window.document.head.appendChild(referrer);
    }
    referrer.content = "no-referrer";
    const canonical = window.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = new URL("/afmeld", siteUrl).href;
  }, []);

  const withdraw = async (event: FormEvent) => {
    event.preventDefault();
    if (!validToken || state === "submitting") return;
    setState("submitting");
    try {
      const response = await fetch("/api/waitlist-withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (!response.ok) throw new Error("withdrawal rejected");
      window.history.replaceState({}, "", "/afmeld");
      setState("success");
    } catch {
      setState("error");
    }
  };

  const heading = state === "success" ? "Du er afmeldt." : "Afmeld ventelisten";
  const body =
    state === "success"
      ? "Din tilmelding er slettet, og du modtager ikke flere ventelistemails fra Træningsmester."
      : validToken
        ? "Bekræft herunder, hvis du ikke længere vil modtage e-mails om Træningsmesters lancering og adgangsrunder."
        : "Afmeldingslinket er ugyldigt, allerede brugt eller mangler. Brug det fulde link fra din bekræftelsesmail.";

  return (
    <div className="tm-marketing mk-legal-page mk-unsubscribe-page">
      <header className="mk-legal-header">
        <a href="/" aria-label="Tilbage til Træningsmester">
          <Brand />
        </a>
        <a className="mk-back-link" href="/">
          <Arrow direction="left" /> Tilbage
        </a>
      </header>
      <main>
        <div className="mk-legal-hero">
          <p className="mk-eyebrow">Samtykke</p>
          <h1>{heading}</h1>
          <p>{body}</p>
        </div>
        <div className="mk-unsubscribe-action">
          {state === "success" ? (
            <a className="mk-unsubscribe-link" href="/">
              Tilbage til forsiden <Arrow />
            </a>
          ) : validToken ? (
            <form onSubmit={withdraw}>
              <button type="submit" disabled={state === "submitting"}>
                {state === "submitting" ? "Afmelder…" : "Ja, slet min tilmelding"}
              </button>
              {state === "error" ? (
                <p role="alert">Afmeldingen kunne ikke gennemføres lige nu. Prøv igen om lidt.</p>
              ) : null}
            </form>
          ) : (
            <a className="mk-unsubscribe-link" href="/privatliv">
              Læs privatlivspolitikken <Arrow />
            </a>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

function MarketingSite() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  if (pathname === "/afmeld") return <UnsubscribePage />;
  const route = legalRoutes[pathname];
  return route ? <LegalPage route={route} /> : <MarketingHome />;
}

export default MarketingSite;
