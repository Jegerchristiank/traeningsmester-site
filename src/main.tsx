import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const appMoments = [
  {
    step: "01",
    kicker: "Før passet",
    title: "Dagens træning ligger klar.",
    text: "Program, øvelser, sæt og noter er samlet, så du ikke starter med at lede.",
    image: "/app/home-training.jpg",
    alt: "Dagens træning i Træningsmester"
  },
  {
    step: "02",
    kicker: "Under passet",
    title: "Loggen følger tempoet.",
    text: "Skriv vægt, gentagelser og hvordan sættet føltes, mens du stadig er i gang.",
    image: "/app/exercises.jpg",
    alt: "Øvelseskatalog i Træningsmester"
  },
  {
    step: "03",
    kicker: "Efter passet",
    title: "Historikken gør næste valg lettere.",
    text: "Se hvad du lavede sidst, hvad der flyttede sig, og hvad der bør justeres.",
    image: "/app/programs.jpg",
    alt: "Programmer i Træningsmester"
  },
  {
    step: "04",
    kicker: "Med coach",
    title: "Træneren får arbejdsro.",
    text: "Klienter, planer og opfølgning bor samme sted, uden at hverdagen bliver tungere.",
    image: "/app/coach.jpg",
    alt: "Coach-overblik i Træningsmester"
  }
];

const audiences = [
  {
    name: "Begynder",
    line: "Vil vide præcis, hvad der skal ske i dag.",
    image:
      "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1400&q=80"
  },
  {
    name: "Selvøvet",
    line: "Vil bygge programmer og skifte øvelser uden at miste strukturen.",
    image:
      "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?auto=format&fit=crop&w=1400&q=80"
  },
  {
    name: "Logger",
    line: "Vil have sæt, PR, cardio og historik samlet uden regneark.",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1400&q=80"
  },
  {
    name: "Træner",
    line: "Vil styre klienter, planer og opfølgning uden at miste overblik.",
    image:
      "https://images.unsplash.com/photo-1602233158242-3ba0ac4d2167?auto=format&fit=crop&w=1400&q=80"
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
    label: "kerneflader",
    note: "Program, træning, historik og coach"
  }
];

const principles = [
  "Næste træning skal være tydelig.",
  "Data skal give ro, ikke støj.",
  "Trænerarbejde skal føles praktisk.",
  "Socialt indhold skal være optjent."
];

function App() {
  return (
    <>
      <header className="site-header" aria-label="Hovednavigation">
        <a className="brand-mark" href="#top" aria-label="Træningsmester top">
          <img src="/brand/tm-logo.png" alt="" />
          <span>Træningsmester</span>
        </a>
        <nav>
          <a href="#appen">Appen</a>
          <a href="#hverdagen">Hverdagen</a>
          <a href="#for-hvem">For hvem</a>
          <a href="#team">Team</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">Dansk træningsapp</p>
            <h1 id="hero-title">Træning uden gætteri.</h1>
            <p>
              Byg programmet. Start dagens pas. Log sættene. Se hvad der
              flytter sig. Få coachen med, når strukturen skal holde.
            </p>
          </div>
          <div className="hero-screens" aria-label="Skærme fra Træningsmester">
            <img src="/app/home-training.jpg" alt="Dagens træning" />
            <img src="/app/programs.jpg" alt="Programoversigt" />
          </div>
          <div className="hero-baseline" aria-hidden="true">
            <span>Plan</span>
            <span>Log</span>
            <span>Historik</span>
            <span>Coach</span>
          </div>
        </section>

        <section className="opening section-band">
          <p>
            Det svære er ikke at træne hårdt. Det svære er at vide, hvad der
            skal ske næste gang.
          </p>
        </section>

        <section className="day-system section-band dark" id="appen">
          <div className="section-head">
            <p className="eyebrow">Appen</p>
            <h2>Før. Under. Efter.</h2>
            <p>
              Træningsmester er bygget rundt om selve træningsdagen, ikke rundt
              om forklaringer.
            </p>
          </div>

          <div className="moment-stack" id="hverdagen">
            {appMoments.map((moment) => (
              <article className="moment-row" key={moment.step}>
                <div className="moment-number">{moment.step}</div>
                <div className="moment-text">
                  <p className="moment-kicker">{moment.kicker}</p>
                  <h3>{moment.title}</h3>
                  <p>{moment.text}</p>
                </div>
                <div className="phone-frame">
                  <img src={moment.image} alt={moment.alt} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="audiences" id="for-hvem" aria-labelledby="audiences-title">
          <div className="audiences-intro">
            <p className="eyebrow">For hvem</p>
            <h2 id="audiences-title">Fire måder at bruge den på.</h2>
          </div>
          <div className="audience-wall">
            {audiences.map((audience, index) => (
              <article
                className="audience-panel"
                key={audience.name}
                style={{ "--bg": `url(${audience.image})` } as React.CSSProperties}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{audience.name}</h3>
                <p>{audience.line}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="evidence section-band dark" id="fakta">
          <div className="section-head">
            <p className="eyebrow">Fakta</p>
            <h2>Tal skal kunne holde vægt.</h2>
            <p>
              Øvelser, import og kerneflader. Kun tal, der peger på brug i
              hverdagen.
            </p>
          </div>
          <div className="evidence-table" aria-label="Fakta om Træningsmester">
            {evidence.map((item) => (
              <div className="evidence-row" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="principles section-band">
          <div className="principles-copy">
            <p className="eyebrow">Retning</p>
            <h2>Rolig i hånden. Skarp i brug.</h2>
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

        <section className="team section-band dark" id="team">
          <div className="team-photo" aria-hidden="true" />
          <div className="team-copy">
            <p className="eyebrow">Team</p>
            <h2>Bygget tæt på træningen.</h2>
            <p>
              Vi bygger Træningsmester som et arbejdsredskab, ikke en kampagne.
              Først skal kernen føles stabil i centret. Derefter kan resten
              vokse.
            </p>
            <p>
              Fokus er enkelt: programmer der kan bruges, en log der er hurtig,
              og et overblik der holder.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <img src="/brand/tm-logo.png" alt="" />
        <p>Træningsmester · program, log, historik og coach.</p>
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
