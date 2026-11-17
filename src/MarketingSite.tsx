import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import MarketingHome from "./MarketingHome";
import { ArrowMark, Contents, ServiceShell } from "./components/ServiceLayout";
import "./marketing.css";

type LegalRoute =
  | "privatliv"
  | "vilkaar"
  | "cookies"
  | "tilgaengelighed"
  | "support"
  | "slet-konto";

export const siteUrl = "https://www.traeningsmester.dk/";
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

export const legalDocuments: Record<
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
      "Her kan du se, hvordan vi behandler dine oplysninger på hjemmesiden, på ventelisten og i Træningsmester til iPhone, Apple Watch og Android, og hvilke valg du har.",
    updated: "17. november 2026",
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
        title: "Når du logger ind på hjemmesiden",
        body: "Vi bruger Supabase til at oprette din konto og holde dig logget ind. På kontosiden kan du gå til dine forbundne AI-assistenter og se den adgang, du har givet dem. Når du logger ind, henter kontosiden ingen programmer, træningshistorik eller sociale oplysninger.",
      },
      {
        title: "Når du bruger mobilappen",
        body:
          "Træningsmester bruger Supabase til konto og session og kan hente eller gemme email, profil- og appindstillinger, programmer, øvelser, sæt, gentagelser, vægt, intensitet, noter, kropsvægt, personlige rekorder samt trænings- og aktivitetshistorik. Oplysningerne bruges til login, synkronisering, historik, progression, abonnementstilstand og de funktioner, du vælger. Kernefunktionerne leveres på grundlag af GDPR artikel 6, stk. 1, litra b. Appen kan også gemme en lokal kopi på din enhed, så session og igangværende arbejde kan huskes. Der træffes ikke afgørelser alene ved automatiseret behandling, som har retsvirkning eller tilsvarende væsentlig betydning for dig."
      },
      {
        title: "Sundheds-, sensor- og lokationsdata",
        body:
          "Hvis du selv aktiverer de relevante funktioner og enhedstilladelser, kan iPhone-appen læse eller skrive kropsvægt, workouts, rute, distance, energi, puls, kadence og power via Apple Sundhed. Bruger du et parret Apple Watch, kan Træningsmester på din iPhone modtage de målinger, som uret har til rådighed under aktiviteten, fx puls og effekt. De tilgængelige målinger afhænger af appversionen, enheden og aktiviteten. Ved udendørs aktiviteter kan appen bruge omtrentlig eller præcis lokation, afhængigt af den tilladelse du vælger, også mens en aktiv session fortsætter i baggrunden. Det bruges til løbende tid, distance og din private GPS-rute og stopper, når sessionen afsluttes eller kasseres. Lokation kan desuden bruges til at foreslå eller skifte træningscenter, hvis du har slået det til. Disse funktioner er valgfrie; du kan tilbagekalde samtykke og systemtilladelser med virkning for fremtiden. Oplysninger, der kan afsløre helbred eller fysisk tilstand, behandles på grundlag af dit udtrykkelige valg efter GDPR artikel 6, stk. 1, litra a, og artikel 9, stk. 2, litra a. Sundhedsdata og importer deles ikke automatisk i Social."
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
          "Valgfrie AI- og importfunktioner kan sende programtekst, træningsintention, programsnapshots, importtekst og billedreferencer gennem Supabase til OpenAI for at analysere eller omskrive det indhold, du selv vælger. API-anmodningen bruger indstillingen store: false; OpenAI behandler fortsat det valgte input og det genererede svar for at levere funktionen. Hvis du vælger Apple- eller Google-login, en integration som Strava eller Apple Sundhed, eller et køb i App Store eller Google Play, udveksles de nødvendige konto-, token-, aktivitets- eller transaktionsoplysninger med den valgte tjeneste. Hvilke integrationer du kan vælge, afhænger af din appversion og enhed. Træningsmester modtager ikke dine fulde betalingskortoplysninger."
      },
      {
        title: "Når du forbinder en AI-assistent",
        body:
          "Du kan selv forbinde din konto til eksempelvis ChatGPT, Claude eller Codex. Forbindelsen giver den valgte assistent adgang til synkroniserede træningsoplysninger inden for de viste rettigheder: programmer, øvelser, præferencer, træningspas, resultater, noter, statistik og struktureret import eller eksport. Med skriverettigheder kan assistenten også ændre og slette det tilknyttede indhold uden en ekstra godkendelse fra Træningsmester. Telefonen og assistenten skifter kontrollen over en igangværende træning gennem en bekræftet overdragelse. Usynkroniserede kladder på telefonen følger først med efter synkronisering."
      },
      {
        title: "AI-forbindelsens modtagere og opbevaring",
        body:
          "Oplysninger, som assistenten henter eller sender, behandles også af den AI-udbyder, du vælger, eksempelvis OpenAI eller Anthropic, efter udbyderens egne vilkår og privatlivspolitik. Indstillingen store: false for Træningsmesters indbyggede AI-funktioner er ikke et løfte om opbevaring i din eksterne assistents samtaler. Assistenten får et særskilt adgangstoken, ikke din Supabase-session eller adgangskode. Adgangstokens gælder i 15 minutter; fornyelsesadgang er begrænset til højst 30 dage. Træningsmester gemmer forbindelsens identitet, rettigheder, oprettelse, seneste brug, udløb og tilbagekaldelse samt krypteret protokoltilstand. Udløbet protokoltilstand ryddes automatisk, mens forbindelsesoplysninger beholdes til kontoens forbindelsesadministration. Midlertidige eksportfiler og snapshots udløber efter 24 timer og ryddes automatisk. Driftslogs for MCP-kald indeholder operationstype, udfald og korrelations-ID, ikke tokens, træningsfritekst eller komplette datapayloads."
      },
      {
        title: "Tilbagekald AI-adgang",
        body:
          "Du kan se og tilbagekalde forbindelser under Forbundne AI-assistenter i appen eller på sitet. Tilbagekaldelse stopper også allerede udstedte MCP-adgangstokens. Træninger og andre ændringer, som allerede er gemt på din konto, bevares. Oplysninger, der allerede er afleveret til en assistent eller downloadet som eksport, slettes ikke automatisk hos modtageren, når forbindelsen tilbagekaldes; brug den valgte tjenestes kontroller til at administrere dem."
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
    updated: "17. november 2026",
    sections: [
      {
        title: "Ventelisten",
        body: "En tilmelding er gratis og forpligter ikke til køb. Der er endnu ingen offentlig lanceringsdato, og en plads på ventelisten er ikke en garanti for adgang på et bestemt tidspunkt.",
      },
      {
        title: "Din konto og dine forbindelser",
        body: (
          <>
            På <a href="/app">din kontoside</a> kan du logge ind og gå til dine
            forbundne AI-assistenter. Du vælger selv, om du vil give et værktøj
            adgang til dine træningsdata. Du kan til enhver tid tilbagekalde
            adgangen. Dine programmer, træningspas og sociale funktioner finder
            du i mobilappen.
          </>
        ),
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
      "Hjemmesiden kan bruges uden statistik. Browseren gemmer dit valg. Login og godkendelse af værktøjer bruger særskilt nødvendig lagring.",
    updated: "17. november 2026",
    sections: [
      {
        title: "På hjemmesiden",
        body: "Forsiden, produktinformationen og ventelisten kræver ikke cookies. Appskærme, logo og animation leveres fra samme website.",
      },
      {
        title: "Login og godkendelse af værktøjer",
        body: "Browseren gemmer din Supabase-session, så du kan forblive logget ind på din konto. Når du forbinder et værktøj, bruger vi nødvendige cookies til at knytte din godkendelse til den rigtige anmodning. Kontosiden gemmer ingen træningspas, programmer eller sociale oplysninger.",
      },
      {
        title: "Varighed og sletning",
        body: "Når du logger ud på kontosiden, afsluttes din session i denne browser. Hvis du tidligere har brugt webappen, rydder udlogningen også den aktuelle lokale træningskopi og den pågældende kontos gamle cache. Du kan selv rydde webstedets øvrige data i browserens indstillinger. Adgang, som du har givet et værktøj, kan du tilbagekalde under Forbundne AI-assistenter.",
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
    updated: "17. november 2026",
    sections: [
      {
        title: "Tastatur og fokus",
        body: "Navigation, formularer, FAQ og links er bygget med navngivne standardelementer og synlig fokusmarkering. På mobil er login og tilmelding tilgængelige øverst på forsiden. Du kan gå direkte til et kapitel i træningsforløbet med kapitelknapperne.",
      },
      {
        title: "Bevægelse og grafik",
        body: "Hjemmesiden respekterer indstillingen Reducer bevægelse. Kapitelknapperne viser de enkelte trin i træningen direkte. Du kan også rulle gennem siden i dit eget tempo.",
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
    updated: "17. november 2026",
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
        body: (
          <>
            På <a href="/app">kontosiden</a> logger du ind med e-mail og
            adgangskode. I mobilappen skal du bruge den loginmetode, du
            oprettede kontoen med. Du kan også godkende en AI-assistent fra
            mobilappen. Følg <a href="/ai/help">vejledningen til AI-assistenter</a> eller
            se <a href="/ai/connections">dine forbindelser</a>. Har du brug
            for hjælp til login, kan du skrive til os på kontaktmailen ovenfor.
            Træningsmester vil aldrig bede dig sende din adgangskode.
          </>
        ),
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

function documentAnchor(title: string) {
  return title.toLocaleLowerCase("da-DK").replaceAll("æ", "ae").replaceAll("ø", "oe")
    .replaceAll("å", "aa").replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
}

function OperatorAddress() {
  return (
    <address>
      {company.legalName} · CVR {company.cvr}<br />{company.address}<br />
      <a href={`mailto:${company.email}`}>{company.email}</a><br />
      <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>
    </address>
  );
}

export function LegalPage({ route }: { route: LegalRoute }) {
  const document = legalDocuments[route];
  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (fragment) {
      window.document.getElementById(fragment)?.scrollIntoView({ behavior: "instant" });
    } else {
      window.scrollTo(0, 0);
    }
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

  const sections = document.sections.map((section) => ({ ...section, id: documentAnchor(section.title) }));
  const serviceRoute = route === "support" || route === "slet-konto";
  return (
    <ServiceShell area={serviceRoute ? "Hjælp og kontakt" : "Om hjemmesiden"}
      className="document-page" address={<OperatorAddress />}>
      <header className="document-masthead">
        <div className="document-heading">
          <h1 className={document.title.length > 12 ? "document-long-title" : undefined}>{document.title}</h1>
          <p className="service-lead">{document.intro}</p>
        </div>
        <div className="document-meta">
          {route === "support" ? (
            <>
              <a className="service-action" href={`mailto:${company.email}`}>Skriv til support <ArrowMark diagonal /></a>
              <a className="service-link" href={`tel:${company.phoneHref}`}>Ring {company.phoneDisplay}</a>
            </>
          ) : (
            <><span className="service-caption">Senest opdateret</span><span className="document-date">{document.updated}</span></>
          )}
        </div>
      </header>
      <div className="document-layout">
        <Contents entries={sections} />
        <article className="document-body" aria-label={document.title}>
          {sections.map((section, index) => (
            <section key={section.id} aria-labelledby={section.id} className="document-section">
              <span className="document-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2 id={section.id} tabIndex={-1}>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            </section>
          ))}
          {route === "support" && <p className="document-revision">Senest opdateret {document.updated}</p>}
          <a className="service-link document-top" href="#hovedindhold">Til toppen <span aria-hidden="true">↑</span></a>
        </article>
      </div>
    </ServiceShell>
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
    <ServiceShell area="Om hjemmesiden" className="unsubscribe-page" address={<OperatorAddress />}>
      <div className="unsubscribe-layout">
        <div className="unsubscribe-copy">
          <h1 ref={headingRef} tabIndex={state === "success" ? -1 : undefined}>{heading}</h1>
          <p className="service-lead">{body}</p>
        </div>
        <div className="unsubscribe-actions">
          {state === "success" ? (
            <a className="service-action" href="/">Tilbage til forsiden <ArrowMark /></a>
          ) : validToken ? (
            <form onSubmit={withdraw}>
              <button className="service-action" type="submit" disabled={state === "submitting"}>
                {state === "submitting" ? "Afmelder…" : "Ja, slet min tilmelding"} <ArrowMark />
              </button>
              {state === "error" && <p role="alert">Afmeldingen kunne ikke gennemføres lige nu. Prøv igen om lidt.</p>}
            </form>
          ) : (
            <a className="service-link" href="/privatliv">Læs privatlivspolitikken <ArrowMark /></a>
          )}
          {state !== "success" && <a className="service-link" href="/support">Kontakt support <ArrowMark /></a>}
        </div>
      </div>
    </ServiceShell>
  );
}

function MarketingSite() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  if (pathname === "/afmeld") return <UnsubscribePage />;
  const route = legalRoutes[pathname];
  return route ? <LegalPage route={route} /> : <MarketingHome />;
}

export default MarketingSite;
