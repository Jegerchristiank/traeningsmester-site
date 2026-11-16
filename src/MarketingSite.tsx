import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import MarketingHome from "./MarketingHome";
import "./marketing.css";

type LegalRoute =
  | "privatliv"
  | "vilkaar"
  | "cookies"
  | "tilgaengelighed"
  | "support"
  | "slet-konto";

const siteUrl = "https://www.traeningsmester.dk/";
const company = {
  legalName: "KRISTENSON",
  cvr: "40679456",
  address: "Blomstergården 13, 4700 Næstved",
  email: "christiankristensen123@gmail.com",
  phoneDisplay: "53 63 73 60",
  phoneHref: "+4553637360",
};

const legalRoutes: Record<string, LegalRoute> = {
  "/privatliv": "privatliv",
  "/vilkaar": "vilkaar",
  "/cookies": "cookies",
  "/tilgaengelighed": "tilgaengelighed",
  "/support": "support",
  "/slet-konto": "slet-konto",
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
      "Her kan du se, hvilke oplysninger hjemmesiden, ventelisten, webappen og Træningsmester til iPhone, Apple Watch og Android behandler, hvorfor de bruges, og hvilke valg du har.",
    updated: "15. november 2026",
    sections: [
      {
        title: "Valgfri statistik på hjemmesiden",
        body: "Kun hvis du aktivt tillader Statistik i sidens footer, bruger vi PostHog i EU til afgrænsede hændelser om besøg, tilmeldingsforsøg, bekræftet tilmelding, fejltype og delingsforsøg. Vi sender ikke din e-mailadresse, træningsdata, fritekst eller personprofiler. Der er ingen skærmoptagelse eller automatisk kliksporing. Dit valg gemmes i browseren og kan trækkes tilbage i footer, hvilket stopper fremtidig indsamling. Det er uafhængigt af samtykket til ventelistemails. Læs flere tekniske oplysninger og om lokal lagring i cookiepolitikken.",
      },

      {
        title: "Dataansvarlig",
        body: (
          <>
            {company.legalName}, CVR {company.cvr}, {company.address}, er
            virksomheden bag Træningsmester. Du kan kontakte den dataansvarlige
            på <a href={`mailto:${company.email}`}>{company.email}</a> eller{" "}
            <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>.
          </>
        ),
      },
      {
        title: "Ventelisten: data, formål og grundlag",
        body: "Når du skriver dig op, gemmer vi din email, et generelt målgruppemærke, siden og en eventuel referrer, samtykkets tekst/version og tidspunkt samt status for bekræftelse og levering. En pseudonymiseret tokenværdi gør sikker afmelding mulig. Formålet er alene at sende e-mails om Træningsmesters lancering og adgangsrunder. Retsgrundlaget er dit samtykke efter GDPR artikel 6, stk. 1, litra a.",
      },
      {
        title: "Sikkerhed og misbrug",
        body: "Ved tilmelding bruges en envejs-hash af forbindelsens IP-adresse midlertidigt til at begrænse automatiseret misbrug. Den rå IP-adresse gemmes ikke i ventelistedatabasen, og den midlertidige rate-limitværdi udløber senest efter 10 minutter i den aktive serverproces. Tekniske drifts- og sikkerhedslogs kan behandles af hostingudbyderen. Grundlaget er den legitime interesse i stabil og sikker drift efter GDPR artikel 6, stk. 1, litra f.",
      },
      {
        title: "Når du bruger Træningsmester",
        body:
          "Træningsmester bruger Supabase til konto og session og kan hente eller gemme email, profil- og appindstillinger, programmer, øvelser, sæt, gentagelser, vægt, intensitet, noter, kropsvægt, personlige rekorder samt trænings- og aktivitetshistorik. Oplysningerne bruges til login, synkronisering, historik, progression, abonnementstilstand og de funktioner, du vælger. Kernefunktionerne leveres på grundlag af GDPR artikel 6, stk. 1, litra b. Appen kan også gemme en lokal kopi på din enhed, så session og igangværende arbejde kan huskes. Der træffes ikke afgørelser alene ved automatiseret behandling, som har retsvirkning eller tilsvarende væsentlig betydning for dig."
      },
      {
        title: "Sundheds-, sensor- og lokationsdata",
        body:
          "Hvis du selv aktiverer de relevante funktioner og enhedstilladelser, kan iPhone-appen læse eller skrive kropsvægt, workouts, rute, distance, energi, puls, kadence og power via Apple Sundhed. Android-appen kan eksportere gennemførte aktiviteter til Health Connect. Kompatible Bluetooth-sensorer kan levere puls, kadence eller power under en aktivitet. Ved udendørs aktiviteter kan appen bruge omtrentlig eller præcis lokation, afhængigt af den tilladelse du vælger, også mens en aktiv session fortsætter i baggrunden. Det bruges til løbende tid, distance og din private GPS-rute og stopper, når sessionen afsluttes eller kasseres. Lokation kan desuden bruges til at foreslå eller skifte træningscenter, hvis du har slået det til. Disse funktioner er valgfrie; du kan tilbagekalde samtykke og systemtilladelser med virkning for fremtiden. Oplysninger, der kan afsløre helbred eller fysisk tilstand, behandles på grundlag af dit udtrykkelige valg efter GDPR artikel 6, stk. 1, litra a, og artikel 9, stk. 2, litra a. Sundhedsdata og importer deles ikke automatisk i Social."
      },
      {
        title: "Social, beskeder og brugerindhold",
        body:
          "Hvis du bruger Social, behandles vennekoder og -anmodninger, relationer, valgte profilnavne, buddy-invitationer, delte træningsresuméer, likes, kommentarer og direkte beskeder. Billeder eller videoer, som du selv uploader til en øvelse eller profilfunktion, gemmes som brugerindhold. Delte træningsopslag er enten private eller synlige for de venner, du vælger efter appens aktuelle delingsindstillinger. Et delt aktivitetsresumé kan indeholde en beskåret rutevisning, hvis du aktivt deler aktiviteten. Behandlingen sker for at levere de sociale funktioner, du har valgt, efter GDPR artikel 6, stk. 1, litra b."
      },
      {
        title: "Drift, diagnostik og produktanalyse",
        body:
          "For at holde appen stabil og forbedre centrale flows kan Træningsmester gemme bruger-ID, app- og buildversion, operativsystem, enhedsmodel, seneste aktivitet samt tekniske fejl med den aktive fane eller rute og relevante program-, workout- eller øvelses-ID'er. Førsteparts produktevents kan beskrive onboarding, træningsflow, import, progression, paywall og køb. De bruges ikke til annoncering eller sporing på tværs af andre virksomheders apps og websites, og appen bruger ikke IDFA eller annonce-SDK'er. Grundlaget er den legitime interesse i sikker drift og produktforbedring efter GDPR artikel 6, stk. 1, litra f; du kan gøre indsigelse via kontaktmailen."
      },
      {
        title: "AI, integrationer og køb",
        body:
          "Valgfrie AI- og importfunktioner kan sende programtekst, træningsintention, programsnapshots, importtekst og billedreferencer gennem Supabase til OpenAI for at analysere eller omskrive det indhold, du selv vælger. API-anmodningen bruger indstillingen store: false; OpenAI behandler fortsat det valgte input og det genererede svar for at levere funktionen. Hvis du vælger Apple- eller Google-login, Strava, Apple Sundhed, Health Connect, App Store- eller Google Play-køb, udveksles de nødvendige konto-, token-, aktivitets- eller transaktionsoplysninger med den valgte tjeneste. Træningsmester modtager ikke dine fulde betalingskortoplysninger."
      },
      {
        title: "Databehandlere og overførsler",
        body:
          "Supabase bruges til database, filer, realtime og login; Træningsmester-projektet ligger i Supabases EU-region eu-central-1 (Frankfurt). Vercel bruges til hosting og serverfunktioner, Resend til ventelistemails og OpenAI til de valgfrie AI-funktioner. Apple, Google og Strava behandler oplysninger, når du vælger deres login-, sundheds-, aktivitets- eller betalingstjenester, og kan i den forbindelse være selvstændigt dataansvarlige efter deres egne vilkår. Hvis en leverandør eller underdatabehandler behandler oplysninger uden for EU/EØS, skal overførslen være omfattet af et gyldigt grundlag efter GDPR kapitel V, eksempelvis en tilstrækkelighedsafgørelse eller EU-Kommissionens standardkontraktbestemmelser. Du kan bede om oplysninger om det aktuelle grundlag og de relevante garantier via kontaktmailen ovenfor."
      },
      {
        title: "Opbevaring",
        body:
          "Ventelistetilmeldingen slettes, når ventelistens formål er afsluttet, eller når du gennemfører afmelding. Logout afslutter din session, men fjerner ikke nødvendigvis enhver lokal cache. Lokale kopier kan ryddes via appens kontosletning, enhedens eller browserens lagerindstillinger eller ved at afinstallere appen. Konto-, profil-, trænings-, aktivitets-, rute-, social-, besked-, diagnostik- og produkteventdata opbevares, mens de er nødvendige for den aktive konto og de valgte funktioner, og slettes eller anonymiseres efter kontosletning eller en gyldig sletteanmodning, medmindre oplysninger skal bevares i en begrænset periode af hensyn til dokumentation, sikkerhed, køb eller et retskrav. Data, du har valgt at eksportere til Apple Sundhed, Health Connect eller Strava, er også under den pågældende tjenestes kontrol og skal eventuelt slettes dér. Indhold, du selv sletter i appen, fjernes fra de aktive produktflader. Leverandørers backups, transaktionsoplysninger og sikkerhedslogs udfases efter deres gældende slettecyklusser."
      },
      {
        title: "Dine rettigheder",
        body: (
          <>
            Du kan bede om indsigt, rettelse, sletning, begrænsning og
            dataportabilitet og kan gøre indsigelse, når behandlingen bygger på
            en legitim interesse. Samtykke kan altid trækkes tilbage med
            virkning for fremtiden; ventelistesamtykket trækkes gratis tilbage
            via afmeldingslinket i mails. Skriv til{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a>. Hvis du er
            utilfreds med behandlingen, kan du klage til{" "}
            <a href="https://www.datatilsynet.dk/borger/klage" rel="noreferrer">
              Datatilsynet
            </a>
            .
          </>
        ),
      },
    ],
  },
  vilkaar: {
    title: "Vilkår",
    intro:
      "Hjemmesiden er en pre-launch side. Den sælger ikke abonnementer eller andre digitale ydelser direkte.",
    updated: "13. juli 2026",
    sections: [
      {
        title: "Ventelisten",
        body: "En tilmelding er gratis og forpligter ikke til køb. Der er endnu ingen offentlig lanceringsdato, og en plads på ventelisten er ikke en garanti for adgang på et bestemt tidspunkt.",
      },
      {
        title: "Webappen",
        body: "Webappen er en separat produktflade. Funktioner kan ændre sig under udvikling, og lokale ændringer er ikke nødvendigvis synkroniseret til serveren.",
      },
      {
        title: "Fremtidige køb",
        body: "Hvis betalte funktioner åbner, skal pris, periode, fornyelse, opsigelse og eventuelle fortrydelsesvilkår fremgå i det konkrete betalingsflow før køb.",
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
        ),
      },
    ],
  },
  cookies: {
    title: "Cookiepolitik",
    intro:
      "Hjemmesiden kan bruges uden statistik. Dit valg om frivillig statistik gemmes i browseren; webappen har særskilt nødvendig lagring.",
    updated: "15. november 2026",
    sections: [
      {
        title: "På hjemmesiden",
        body: "Forsiden, produktinformationen og ventelisten kræver ikke cookies. Appskærme, logo og animation leveres fra samme website.",
      },
      {
        title: "Nødvendig lagring i webappen",
        body: "Webappen bruger lokal browserlagring til Supabase-login, cache og appens tilstand. Det kan omfatte konto-id/email, profil og kontaktoplysninger, indstillinger, kropsvægt, programmer, sæt, noter, historik og igangværende træning. Lagringen bruges for at holde dig logget ind og huske dit arbejde på enheden; den bruges ikke til annoncer eller statistik.",
      },
      {
        title: "Varighed og sletning",
        body: "Lokal appdata har ingen automatisk udløbsdato, mens du er logget ind. Logout rydder webappens aktuelle lokale appkopi og Supabase-session. Browseren kan desuden ryddes manuelt via dens indstillinger, hvilket anbefales efter brug på en delt enhed.",
      },
      {
        title: "Valgfri statistik",
        body: "Hvis du vælger Statistik i sidens footer, sender vi afgrænsede hændelser om besøg, tilmeldingsforsøg, serverbekræftet tilmelding, fejltype og delingsforsøg til PostHog i EU. Ingen hændelser sendes før dit valg. Vi sender ikke e-mailadresser, træningsindhold, fritekst, fulde sideadresser eller personprofiler og bruger ikke automatisk kliksporing eller skærmoptagelser. En tilfældig identifikator gælder kun den åbne side. PostHog modtager netværksanmodningen, men vi deaktiverer geografisk berigelse. Dit statistikvalg gemmes lokalt som tm-marketing-statistics-v1 og kan trækkes tilbage samme sted; du kan også rydde det i browseren. Tilbagetrækning stopper fremtidige hændelser. Dette valg er adskilt fra samtykket til ventelistemails.",
      },
    ],
  },
  tilgaengelighed: {
    title: "Tilgængelighed",
    intro:
      "Træningsmester arbejder for, at siden kan forstås og bruges med tastatur, hjælpemidler og reduceret bevægelse.",
    updated: "13. juli 2026",
    sections: [
      {
        title: "Tastatur og fokus",
        body: "Navigation, formularer, FAQ og links er bygget med navngivne standardelementer og synlig fokusmarkering. Mobilmenuen lukker med Escape, låser baggrunden, mens den er åben, og fører fokus tilbage til en logisk placering.",
      },
      {
        title: "Bevægelse og grafik",
        body: "Hjemmesiden respekterer indstillingen Reducer bevægelse. Den animerede bjørn skifter i så fald til et statisk billede, uden at information går tabt.",
      },
      {
        title: "Kontrast og tekst",
        body: (
          <>
            Siden bruger tydelig kontrast, fleksibel tekststørrelse og
            responsive layouts. Hvis du oplever en barriere, kan du skrive til{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a> og beskrive
            siden og problemet.
          </>
        ),
      },
    ],
  },
  support: {
    title: "Support",
    intro:
      "Få hjælp til Træningsmester på iPhone og Android, eller kontakt os om din konto og dine data.",
    updated: "15. juli 2026",
    sections: [
      {
        title: "Kontakt",
        body: (
          <>
            Skriv til <a href={`mailto:${company.email}`}>{company.email}</a>{" "}
            eller ring på{" "}
            <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>.
            Beskriv gerne om du bruger iPhone eller Android, appversionen og
            hvad du gjorde, da problemet opstod. Del ikke adgangskoder,
            betalingskort eller helbredsoplysninger, som ikke er nødvendige for
            at løse sagen.
          </>
        ),
      },
      {
        title: "Konto og login",
        body: "Hvis du ikke kan logge ind, skal du bruge den samme email og loginmetode, som kontoen blev oprettet med. Du kan bede om yderligere hjælp via kontaktmailen ovenfor. Træningsmester vil aldrig bede om din adgangskode.",
      },
      {
        title: "Slet konto og data",
        body: (
          <>
            Du kan slette kontoen permanent direkte i appens Indstillinger under
            Konto. Hvis du ikke længere har adgang til appen, kan du også{" "}
            <a href="/slet-konto">anmode om sletning her</a>.
          </>
        ),
      },
      {
        title: "Privatliv og vilkår",
        body: (
          <>
            Se <a href="/privatliv">privatlivspolitikken</a> og{" "}
            <a href="/vilkaar">vilkårene</a> for oplysninger om behandling,
            opbevaring og dine rettigheder.
          </>
        ),
      },
    ],
  },
  "slet-konto": {
    title: "Slet konto",
    intro:
      "Her kan du slette din Træningsmester-konto eller anmode om sletning, hvis du ikke længere kan åbne appen.",
    updated: "15. juli 2026",
    sections: [
      {
        title: "Slet direkte i appen",
        body: "Åbn Indstillinger, vælg Konto og tryk på Slet konto permanent. Bekræftelsen sletter Træningsmester-kontoen og dens tilknyttede data fra tjenesten, rydder appens lokale kontodata og logger dig ud. Handlingen kan ikke fortrydes. Et abonnement i App Store eller Google Play og data, du tidligere har eksporteret til en ekstern tjeneste, håndteres særskilt som beskrevet nedenfor.",
      },
      {
        title: "Anmod uden adgang til appen",
        body: (
          <>
            Send en email fra kontoens registrerede emailadresse til{" "}
            <a
              href={`mailto:${company.email}?subject=Slet%20min%20Tr%C3%A6ningsmester-konto`}
            >
              {company.email}
            </a>{" "}
            med emnet “Slet min Træningsmester-konto”. Vi kan bede dig bekræfte
            ejerskabet, før sletningen gennemføres. Send ikke din adgangskode.
          </>
        ),
      },
      {
        title: "Hvad slettes",
        body: "Sletningen omfatter konto, profil, indstillinger, programmer, træningslogs, aktivitetshistorik, ruter, sociale relationer, beskeder og andet indhold knyttet til brugeren i Træningsmester. Oplysninger, som lovligt skal bevares i en begrænset periode af hensyn til køb, dokumentation, sikkerhed eller retskrav, begrænses, frakobles kontoen hvor det er muligt og udfases efter det gældende formål. Leverandørers backups og sikkerhedslogs udfases efter deres slettecyklusser.",
      },
      {
        title: "Abonnementer og eksterne kopier",
        body: "Kontosletning opsiger ikke automatisk et aktivt abonnement og giver ikke i sig selv en refundering. Opsig først abonnementet under Abonnementer i App Store eller Google Play, så fremtidig fornyelse stopper. Trænings- eller sundhedsdata, som du allerede har eksporteret til Apple Sundhed, Health Connect eller Strava, kan fortsat ligge hos den valgte tjeneste og skal eventuelt slettes i dens app eller indstillinger.",
      },
      {
        title: "Har du kun brug for hjælp?",
        body: (
          <>
            En sletning kan ikke fortrydes. Hvis du i stedet har problemer med
            login eller appen, kan du gå til <a href="/support">support</a>.
          </>
        ),
      },
    ],
  },
};

function Arrow({ direction = "right" }: { direction?: "right" | "left" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={
          direction === "right"
            ? "M5 12h14M14 7l5 5-5 5"
            : "M19 12H5m5-5-5 5 5 5"
        }
      />
    </svg>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="mk-brand">
      <img src="/brand/tm-logo-256.webp" alt="" width="46" height="46" />
      {!compact ? <strong>Træningsmester</strong> : null}
    </span>
  );
}

function SkipLink() {
  return (
    <a className="mk-skip-link" href="#main-content">
      Gå til hovedindhold
    </a>
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
        <a href="/support">Support</a>
        <a href="/slet-konto">Slet konto</a>
        <a href="/privatliv">Privatliv</a>
        <a href="/cookies">Cookiepolitik</a>
        <a href="/tilgaengelighed">Tilgængelighed</a>
        <a href="/vilkaar">Vilkår</a>
        <a href="/afmeld">Afmelding</a>
      </nav>
    </footer>
  );
}

function LegalPage({ route }: { route: LegalRoute }) {
  const document = legalDocuments[route];
  useEffect(() => {
    window.scrollTo(0, 0);
    window.document.title = `${document.title} — Træningsmester`;
    const canonicalUrl = new URL(`/${route}`, siteUrl).href;
    const canonical = window.document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) canonical.href = canonicalUrl;
    const metaUpdates: Array<[string, string, string]> = [
      ["property", "og:title", `${document.title} — Træningsmester`],
      ["property", "og:description", document.intro],
      ["property", "og:url", canonicalUrl],
      ["name", "twitter:title", `${document.title} — Træningsmester`],
      ["name", "twitter:description", document.intro],
      ["name", "description", document.intro],
    ];
    metaUpdates.forEach(([attribute, name, content]) => {
      const meta = window.document.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      );
      if (meta) meta.content = content;
    });
  }, [document.intro, document.title, route]);

  return (
    <div className="tm-marketing mk-legal-page">
      <SkipLink />
      <header className="mk-legal-header">
        <a href="/" aria-label="Tilbage til Træningsmester">
          <Brand />
        </a>
        <a className="mk-back-link" href="/">
          <Arrow direction="left" /> Tilbage
        </a>
      </header>
      <main id="main-content">
        <div className="mk-legal-hero">
          <h1>{document.title}</h1>
          <p>{document.intro}</p>
          <p className="mk-legal-updated">
            Senest opdateret {document.updated}
          </p>
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
  const fragmentToken = new URLSearchParams(
    window.location.hash.replace(/^#/, ""),
  ).get("token");
  const token = fragmentToken ?? "";
  const validToken = /^[A-Za-z0-9_-]{43}$/.test(token);
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.document.title = "Afmeld ventelisten — Træningsmester";
    const robots = window.document.querySelector<HTMLMetaElement>(
      'meta[name="robots"]',
    );
    if (robots) robots.content = "noindex, nofollow, noarchive";
    let referrer = window.document.querySelector<HTMLMetaElement>(
      'meta[name="referrer"]',
    );
    if (!referrer) {
      referrer = window.document.createElement("meta");
      referrer.name = "referrer";
      window.document.head.appendChild(referrer);
    }
    referrer.content = "no-referrer";
    const canonical = window.document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) canonical.href = new URL("/afmeld", siteUrl).href;
  }, []);

  useEffect(() => {
    if (state !== "success") return;
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }, [state]);

  const withdraw = async (event: FormEvent) => {
    event.preventDefault();
    if (!validToken || state === "submitting") return;
    setState("submitting");
    try {
      const response = await fetch("/api/waitlist-withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
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
      <SkipLink />
      <header className="mk-legal-header">
        <a href="/" aria-label="Tilbage til Træningsmester">
          <Brand />
        </a>
        <a className="mk-back-link" href="/">
          <Arrow direction="left" /> Tilbage
        </a>
      </header>
      <main id="main-content">
        <div className="mk-legal-hero">
          <p className="mk-eyebrow">Samtykke</p>
          <h1 ref={headingRef} tabIndex={state === "success" ? -1 : undefined}>
            {heading}
          </h1>
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
                {state === "submitting"
                  ? "Afmelder…"
                  : "Ja, slet min tilmelding"}
              </button>
              {state === "error" ? (
                <p role="alert">
                  Afmeldingen kunne ikke gennemføres lige nu. Prøv igen om lidt.
                </p>
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
