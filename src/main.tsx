import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const proofPoints = [
  {
    value: "389",
    label: "øvelser i kataloget",
    source: "Aktuelt katalogtal, 1. juni 2026"
  },
  {
    value: "50.000",
    label: "tegn til gamle programmer",
    source: "Når noter og planer skal med"
  },
  {
    value: "10 sek.",
    label: "øvelsesvideo gjort let",
    source: "Korte klip, hurtig visning"
  },
  {
    value: "4",
    label: "måder at bruge appen på",
    source: "Start, byg, log, coach"
  }
];

const segments = [
  {
    name: "Begynder",
    text: "Start med en plan. Se dagens træning. Gør den færdig.",
    image:
      "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Selvøvet",
    text: "Byg programmer, juster øvelser, arbejd med centre og fremgang.",
    image:
      "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Logger",
    text: "Sæt, vægt, RIR, PR, cardio og historik uden regneark.",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Træner",
    text: "Klienter, planer, status og opfølgning i samme overblik.",
    image:
      "https://images.unsplash.com/photo-1602233158242-3ba0ac4d2167?auto=format&fit=crop&w=1200&q=80"
  }
];

const systemSteps = [
  "Vælg plan",
  "Se i dag",
  "Log sæt",
  "Følg fremgang",
  "Importér",
  "Coach"
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
          <a href="#system">Appen</a>
          <a href="#for-hvem">For hvem</a>
          <a href="#bevis">Fakta</a>
          <a href="#team">Om os</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-background" aria-hidden="true" />
          <div className="hero-content">
            <p className="eyebrow">Dansk træningssystem</p>
            <h1 id="hero-title">Træningsmester</h1>
            <p className="hero-line">Program. Log. Fremgang. Coach.</p>
            <p className="hero-copy">
              En app til dig, der vil vide hvad du skal lave i dag, hvad du
              lavede sidst, og hvad der skal justeres næste gang.
            </p>
          </div>
          <div className="screen-stack" aria-label="App screenshots">
            <img src="/app/home-training.jpg" alt="Træningsmester dagens træning" />
            <img src="/app/programs.jpg" alt="Træningsmester programoversigt" />
            <img src="/app/coach.jpg" alt="Træningsmester coach settings" />
          </div>
          <div className="hero-strip" aria-hidden="true">
            <span>Plan</span>
            <span>Log</span>
            <span>Historik</span>
            <span>Coach</span>
          </div>
        </section>

        <section className="manifest section-band">
          <div className="manifest-inner">
            <p>
              Træning bliver rodet, når planen ligger ét sted, noterne et
              andet, historikken et tredje og træneren på beskeder.
            </p>
            <p>
              Træningsmester samler det, så næste træning føles konkret i
              stedet for uklar.
            </p>
          </div>
        </section>

        <section className="system section-band dark" id="system">
          <div className="section-kicker">Produktet</div>
          <div className="system-layout">
            <div>
              <h2>En rolig base for seriøs træning.</h2>
              <p>
                Programmet følger med, når du skifter øvelse, træningscenter,
                uge eller mål. Du kan starte enkelt og bygge dybere, når du har
                brug for det.
              </p>
            </div>
            <div className="system-rail" aria-label="Produktflow">
              {systemSteps.map((step, index) => (
                <div className="rail-item" key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="product-weave">
            <figure>
              <img src="/app/exercises.jpg" alt="Øvelseskatalog i Træningsmester" />
              <figcaption>Find øvelsen hurtigt. Se det vigtigste. Videre.</figcaption>
            </figure>
            <figure>
              <img src="/app/home-training.jpg" alt="Dagens træning i Træningsmester" />
              <figcaption>Dagens træning uden jagt gennem menuer.</figcaption>
            </figure>
            <figure>
              <img src="/app/coach.jpg" alt="Træneroverblik i Træningsmester" />
              <figcaption>Klienter, planer og opfølgning samlet ét sted.</figcaption>
            </figure>
          </div>
        </section>

        <section className="segments section-band" id="for-hvem">
          <div className="section-kicker">For hvem</div>
          <h2>Samme ro. Forskellig hverdag.</h2>
          <div className="segment-board">
            {segments.map((segment, index) => (
              <article
                className="segment-lane"
                key={segment.name}
                style={{ "--lane-image": `url(${segment.image})` } as React.CSSProperties}
              >
                <span className="lane-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{segment.name}</h3>
                <p>{segment.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="proof section-band dark" id="bevis">
          <div className="section-kicker">Fakta</div>
          <div className="proof-head">
            <h2>Tal, der ikke er pynt.</h2>
            <p>
              Ikke “mere motivation”. Ikke tomme løfter. Bare konkrete ting i
              appen, der kan mærkes i træningen.
            </p>
          </div>
          <div className="proof-field" aria-label="Træningsmester bevispunkter">
            {proofPoints.map((point, index) => (
              <div className="proof-point" key={point.label}>
                <div className="proof-axis" style={{ "--level": `${70 + index * 8}%` } as React.CSSProperties}>
                  <span />
                </div>
                <strong>{point.value}</strong>
                <p>{point.label}</p>
                <small>{point.source}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="method section-band">
          <div className="method-copy">
            <div className="section-kicker">Metoden</div>
            <h2>Varmt nok til hverdagen. Hårdt nok til data.</h2>
          </div>
          <div className="method-grid">
            <p>Dine træningsdata skal give ro, ikke uro.</p>
            <p>Gamle programmer skal kunne genbruges uden at starte forfra.</p>
            <p>Trænere skal kunne se, hvem der kræver opmærksomhed.</p>
            <p>Socialt skal føles optjent, ikke opfundet.</p>
          </div>
        </section>

        <section className="team section-band dark" id="team">
          <div className="team-image" aria-hidden="true" />
          <div className="team-copy">
            <div className="section-kicker">Om os</div>
            <h2>Et lille dansk produktteam med en høj bar.</h2>
            <p>
              Træningsmester bygges tæt på den almindelige træningsdag:
              programmet før passet, loggen undervejs, overblikket bagefter og
              træneren, når der er brug for mere struktur.
            </p>
            <p>
              Vi åbner ikke alt på én gang. Først skal kernen føles stabil i
              centret og brugbar for de trænere, der faktisk arbejder med
              klienter.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <img src="/brand/tm-logo.png" alt="" />
        <p>Træningsmester · program, log, fremgang og coach.</p>
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
              "Dansk træningsapp til program, log, fremgang og coach-samarbejde."
          })
        }}
      />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
