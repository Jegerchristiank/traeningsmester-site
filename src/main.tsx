import React, { useMemo, useState } from "react";
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

const modes: Mode[] = [
  {
    id: "begynder",
    name: "Begynder",
    mood: "Mindre usikkerhed",
    promise: "Du skal kunne åbne appen og vide, hvad næste sæt er.",
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
    promise: "Du kan bygge, importere og justere uden at ødelægge planen.",
    before: "Programmer, noter og center-varianter bliver hurtigt til rod.",
    after: "Planen bliver ved med at hænge sammen, selv når du ændrer den.",
    first: ["Programmer", "Import", "Skift og justering"],
    image:
      "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=1500&q=82",
    screen: "/app/programs.jpg",
    screenAlt: "Programmer i Træningsmester"
  },
  {
    id: "logger",
    name: "Logger",
    mood: "Mere præcision",
    promise: "Tallene skal være hurtige at skrive og lette at stole på.",
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
    promise: "Klienter, planer og opfølgning skal kunne styres uden støj.",
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
    title: "Vælg retning",
    text: "Programmet ligger klar, men kan stadig ændres, når virkeligheden ændrer sig."
  },
  {
    label: "Pas",
    title: "Træn uden jagt",
    text: "Dagens øvelser, sæt og noter ligger samlet, så starten ikke kræver forklaring."
  },
  {
    label: "Log",
    title: "Skriv det vigtige",
    text: "Vægt, reps og oplevelse gemmes tæt på selve træningen."
  },
  {
    label: "Fremgang",
    title: "Se næste valg",
    text: "Historikken hjælper dig med at vælge rigtigt næste gang."
  }
];

const evidence = [
  {
    value: "389",
    label: "øvelser i kataloget",
    note: "Aktuelt katalogtal, 1. juni 2026"
  },
  {
    value: "50.000",
    label: "tegn til programimport",
    note: "Plads til lange planer og gamle noter"
  },
  {
    value: "4",
    label: "måder at bruge appen på",
    note: "Start, byg, log og coach"
  }
];

const principles = [
  "Første skærm skal give retning.",
  "Loggen må ikke stjæle træningen.",
  "Tal skal gøre næste valg lettere.",
  "Coach-delen skal spare opmærksomhed."
];

function App() {
  const [activeMode, setActiveMode] = useState<ModeId>("begynder");
  const selectedMode = useMemo(
    () => modes.find((mode) => mode.id === activeMode) ?? modes[0],
    [activeMode]
  );

  return (
    <>
      <header className="site-header" aria-label="Hovednavigation">
        <a className="brand-mark" href="#top" aria-label="Træningsmester top">
          <img src="/brand/tm-logo.png" alt="" />
          <span>Træningsmester</span>
        </a>
        <nav>
          <a href="#for-hvem">For hvem</a>
          <a href="#flow">Flow</a>
          <a href="#fakta">Fakta</a>
          <a href="#team">Team</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">Træningsmester</p>
            <h1 id="hero-title">Færre løse ender i træningen.</h1>
            <p>
              Programmet før passet. Loggen undervejs. Historikken bagefter.
              Coachen, når strukturen skal holde.
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
            <span>Plan</span>
            <span>Pas</span>
            <span>Log</span>
            <span>Coach</span>
          </div>
        </section>

        <section className="thesis section-band">
          <p>
            En god træningsapp skal ikke føles som endnu en ting, du skal holde
            styr på. Den skal tage rod fra dig.
          </p>
        </section>

        <section className="mode-section" id="for-hvem">
          <div className="mode-intro section-band">
            <p className="eyebrow">For hvem</p>
            <h2>Fire brugere. Fire slags uro.</h2>
            <p>
              Nogle skal bare i gang. Nogle bygger selv. Nogle jagter tal.
              Nogle styrer klienter.
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
            <p className="eyebrow">Flow</p>
            <h2>Fra plan til næste valg.</h2>
            <p>
              Ikke en samling funktioner. En rytme, der følger træningen.
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
            <p className="eyebrow">Fakta</p>
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
            <p className="eyebrow">Retning</p>
            <h2>Rolig nok til hverdag. Skarp nok til progression.</h2>
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

        <section className="team section-band" id="team">
          <div className="team-photo" aria-hidden="true" />
          <div className="team-copy">
            <p className="eyebrow">Team</p>
            <h2>Bygget tæt på træningen.</h2>
            <p>
              Træningsmester bygges som et arbejdsredskab. Først skal kernen
              være solid: programmet, passet, loggen, historikken og coachens
              overblik.
            </p>
            <p>
              Det vi viser, skal kunne mærkes i produktet. Det vi lover, skal
              kunne bære en almindelig træningsuge.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <img src="/brand/tm-logo.png" alt="" />
        <p>Træningsmester · program, pas, log og coach.</p>
      </footer>

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
