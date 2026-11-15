import { useEffect, useRef, useState } from "react";
import AccessForm, { focusAccessForm } from "./components/AccessForm";
import AnalyticsConsent from "./components/AnalyticsConsent";
import { recordMarketingVisit } from "./marketingAnalytics";
import "./training-story.css";

const frames = {
  program: {
    src: "revision-program",
    width: 960,
    height: 1250,
    title: "Dit program er klar.",
    alt: "Eksempel: Overkrop A med Bænkpres Med Stang, 3 sæt med 8 gentagelser.",
  },
  set: {
    src: "revision-set",
    width: 960,
    height: 1083,
    title: "Et sæt ad gangen.",
    alt: "Eksempel: Bænkpres Med Stang. Sidste gang 60 kg, nu 62,5 kg og 8 gentagelser.",
  },
  rest: {
    src: "revision-rest",
    width: 960,
    height: 1403,
    title: "Plads til en pause.",
    alt: "Eksempel: Første sæt er registreret med 62,5 kg og 8 gentagelser. Pausen har 1 minut og 42 sekunder tilbage.",
  },
  history: {
    src: "revision-history",
    width: 960,
    height: 939,
    title: "Tag det med til næste gang.",
    alt: "Eksempel: Den samme træning, Overkrop A, genfindes i historikken med Bænkpres Med Stang og 62,5 kg.",
  },
};
type Frame = keyof typeof frames;

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={down ? "M12 4v16m-6-6 6 6 6-6" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function SiteBrand() {
  return (
    <a className="story-brand" href="/" aria-label="Træningsmester forside">
      <img
        src="/brand/tm-logo-256.webp"
        width="42"
        height="42"
        alt="Træningsmester"
      />
      <span aria-hidden="true">Træningsmester</span>
    </a>
  );
}

function AccessLink({
  className = "",
  children = "Få besked om adgang",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      className={className}
      href="#adgang"
      onClick={(event) => {
        event.preventDefault();
        focusAccessForm();
      }}
    >
      {children}
      <Arrow />
    </a>
  );
}

function RawScreen({ frame }: { frame: Frame }) {
  return (
    <figure className={`chapter-mobile-screen mobile-${frame}`}>
      <img
        src={`/product/${frames[frame].src}.webp`}
        width={frames[frame].width}
        height={frames[frame].height}
        loading="lazy"
        decoding="async"
        alt={frames[frame].alt}
      />
      <figcaption>
        Eksempeldata ·{" "}
        {frame === "rest"
          ? "Under pausen"
          : frame === "history"
            ? "Efter træningen"
            : frame === "program"
              ? "Før træningen"
              : "Under træningen"}
      </figcaption>
    </figure>
  );
}

function ProductStory() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLElement>(null);
  const switchFrame = useRef<(frame: Frame) => void>(() => undefined);
  const [active, setActive] = useState<Frame>("program");
  const activeRef = useRef<Frame>("program");
  const selectFrame = (next: Frame) => {
    if (next === activeRef.current) return;
    activeRef.current = next;
    switchFrame.current(next);
    setActive(next);
  };
  const selectRef = useRef(selectFrame);
  selectRef.current = selectFrame;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (
      !window.matchMedia(
        "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    const loadMotion = () =>
      Promise.all([
        import("gsap"),
        import("gsap/Flip"),
        import("gsap/ScrollTrigger"),
      ]).then(([{ gsap }, { Flip }, { ScrollTrigger }]) => {
        if (disposed || !root.current || !stage.current) return;
        gsap.registerPlugin(Flip, ScrollTrigger);
        const media = gsap.matchMedia();
        media.add(
          "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
          () => {
            const element = stage.current!;
            switchFrame.current = (next) => {
              const state = Flip.getState(element, { props: "borderRadius" });
              element.dataset.frame = next;
              Flip.from(state, {
                duration: 0.55,
                ease: "power2.inOut",
                scale: true,
                absolute: false,
              });
            };
            const triggers = Array.from(
              root.current!.querySelectorAll<HTMLElement>("[data-chapter]"),
            ).map((chapter) =>
              ScrollTrigger.create({
                trigger: chapter,
                start: "top 55%",
                end: "bottom 55%",
                onEnter: () =>
                  selectRef.current(chapter.dataset.chapter as Frame),
                onEnterBack: () =>
                  selectRef.current(chapter.dataset.chapter as Frame),
              }),
            );
            return () => {
              switchFrame.current = () => {};
              triggers.forEach((trigger) => trigger.kill());
              gsap.killTweensOf(element);
            };
          },
        );
        cleanup = () => media.revert();
      });
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void loadMotion();
        }
      },
      { rootMargin: "300px" },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      disposed = true;
      observer.disconnect();
      cleanup();
    };
  }, []);

  function goTo(frame: Frame, id: string) {
    selectFrame(frame);
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: window.matchMedia("(min-width: 900px)").matches
        ? "center"
        : "start",
    });
  }
  return (
    <section
      id="traeningsforloeb"
      className="product-story section-shell"
      aria-labelledby="story-title"
    >
      <div className="section-heading">
        <p className="section-kicker">Et forløb i Træningsmester</p>
        <h2 id="story-title">
          Fra sidste sæt
          <br />
          til næste træning.
        </h2>
        <p className="section-intro">
          Fra planen for bænkpres til det sæt, du kan finde igen. Følg Overkrop
          A gennem én træning.
        </p>
      </div>
      <nav className="chapter-nav" aria-label="Træningsforløbets kapitler">
        <button
          aria-current={active === "program" ? "step" : undefined}
          onClick={() => goTo("program", "dit-program")}
        >
          <span>01</span> Program
        </button>
        <button
          aria-current={
            active === "set" || active === "rest" ? "step" : undefined
          }
          onClick={() => goTo("set", "dit-saet")}
        >
          <span>02</span> Sæt og pause
        </button>
        <button
          aria-current={active === "history" ? "step" : undefined}
          onClick={() => goTo("history", "din-historik")}
        >
          <span>03</span> Historik
        </button>
      </nav>
      <div ref={root} className="story-grid">
        <div className="story-chapters">
          <article
            className="story-chapter"
            id="dit-program"
            data-chapter="program"
          >
            <p className="chapter-number">01 / Programmet</p>
            <h3>
              Dit program
              <br />
              er klar.
            </h3>
            <p>
              Åbn Overkrop A. Bænkpres ligger klar med de sæt, gentagelser og
              pauser, du har planlagt.
            </p>
            <dl className="chapter-fact">
              <div>
                <dt>Bænkpres Med Stang</dt>
                <dd>
                  3 <span>×</span> 8
                </dd>
              </div>
              <div>
                <dt>Planlagt pause</dt>
                <dd>
                  2:00 <span>min.</span>
                </dd>
              </div>
            </dl>
            <RawScreen frame="program" />
          </article>
          <article className="story-chapter" id="dit-saet" data-chapter="set">
            <p className="chapter-number">02 / Sættet og pausen</p>
            <h3>
              Et sæt
              <br />
              ad gangen.
            </h3>
            <p>Registrér sættet. Hold styr på pausen.</p>
            <p>
              Sidst løftede du 60 kg. I dette eksempel registrerer du 62,5 kg ×
              8. Sættet markeres som udført, og pausen starter.
            </p>
            <div className="state-actions">
              <button
                aria-pressed={active === "set"}
                onClick={() => selectFrame("set")}
              >
                Se sættet
              </button>
              <button
                aria-pressed={active === "rest"}
                onClick={() => selectFrame("rest")}
              >
                Se pausen <Arrow />
              </button>
            </div>
            <RawScreen frame="set" />
            <RawScreen frame="rest" />
          </article>
          <article
            className="story-chapter"
            id="din-historik"
            data-chapter="history"
          >
            <p className="chapter-number">03 / Historikken</p>
            <h3>
              Tag det med
              <br />
              til næste gang.
            </h3>
            <p>Se dine tidligere træninger, når du skal videre.</p>
            <p>
              Åbn “Tidligere” ved bænkpres. Her ligger de 62,5 kg × 8 fra
              træningen, så du har noget konkret at tage udgangspunkt i.
            </p>
            <dl className="chapter-fact history-fact">
              <div>
                <dt>Registreret i eksemplet</dt>
                <dd>
                  62,5 <span>kg ×</span> 8
                </dd>
              </div>
            </dl>
            <RawScreen frame="history" />
          </article>
        </div>
        <div className="story-stage-wrap">
          <figure
            ref={stage}
            className="story-stage"
            data-frame={active}
            aria-label={frames[active].title}
          >
            {(Object.keys(frames) as Frame[]).map((frame) => (
              <img
                key={frame}
                className={`stage-image ${active === frame ? "is-active" : ""}`}
                src={`/product/${frames[frame].src}.webp`}
                alt={active === frame ? frames[frame].alt : ""}
                aria-hidden={active !== frame}
                width={frames[frame].width}
                height={frames[frame].height}
                loading="lazy"
                decoding="async"
              />
            ))}
            <figcaption>
              <span>Overkrop A</span>
              <span>Eksempeldata</span>
            </figcaption>
          </figure>
        </div>
      </div>
      <p className="media-note">
        Produktvisningerne er rekonstruktioner af appens skærme med
        sammenhængende eksempeldata.
      </p>
    </section>
  );
}

const featureGroups = [
  {
    title: "Find og vælg øvelser",
    description:
      "Udforsk øvelseskort i Match, afgræns efter muskler og træningsform, og gem øvelser i Dine valg. Adgang og grænser kan afhænge af medlemskab.",
    status: "I appen under udvikling",
  },
  {
    title: "Følg din progression",
    description:
      "Se historik og grafer over belastning, gentagelser og volumen. Kropsvægt og enheder kan indstilles til de øvelser, der bruger dem.",
    status: "Grafer bygger på dine registreringer",
  },
  {
    title: "Centre og programdeling",
    description:
      "Vælg træningscenter manuelt, eller aktivér lokationsgenkendelse. Programmer kan deles med en kode; kun ejeren kan redigere selve det delte program.",
    status: "Lokation kræver dit aktive valg og tilladelse",
  },

  {
    title: "Programmer og øvelser",
    description:
      "Opret egne programmer og træningsdage. Vælg øvelser, justér rækkefølge og planlæg sæt. Appen har også periodiserede programmer. Egne øvelser afhænger af Premium-adgang.",
    status: "I appen under udvikling",
  },
  {
    title: "Registrering og historik",
    description:
      "Registrér opvarmning og arbejdssæt med vægt og gentagelser, brug pausetimeren, og genfind tidligere træninger. Mere detaljeret registrering omfatter blandt andet RIR, RPE og tempo.",
    status: "I appen under udvikling",
  },
  {
    title: "Styrke og kondition",
    description:
      "Saml styrketræning og aktiviteter som løb, gang og cykling. Udendørs aktiviteter kan bruge GPS, når du giver tilladelse.",
    status: "iPhone og Android · enhedstilladelser kræves",
  },
  {
    title: "Import og AI",
    description:
      "Importér programindhold og gennemgå resultatet før brug. AI kan hjælpe med at oprette og tilpasse programmer. Import og AI kræver Premium, forbindelse og dit valg af AI-samtykke. Resultater skal kontrolleres; adgang og kapacitet kan være begrænset.",
    status: "Under udvikling · ikke en offentlig importer på denne side",
  },
  {
    title: "Træn sammen",
    description:
      "Venner, beskeder og deling af udvalgte træningsresuméer findes i appen. Deling sker gennem appens valg af modtager og synlighed.",
    status: "I appen under udvikling",
  },
  {
    title: "Apple og andre integrationer",
    description:
      "Apple Sundhed og Apple Watch er knyttet til Apple-enheder. Strava er en valgfri integration under udvikling. Tilslutning kræver opsætning og tilladelser; tilgængeligheden afhænger af platform og release.",
    status: "Platform og enhed afgør tilgængeligheden",
  },
];
const questions = [
  [
    "Hvornår kan jeg prøve appen?",
    "Træningsmester er under udvikling. Der er endnu ikke en offentlig dato for adgang. Skriv dig op, så får du besked, når der er nyt om at prøve appen.",
  ],
  [
    "Hvilke enheder understøttes?",
    "Appen udvikles til iPhone og Android. Apple Watch og Apple Sundhed hører til Apple-platformen. Tilgængelighed og konkrete krav oplyses, når adgang åbner.",
  ],
  [
    "Hvad kommer det til at koste?",
    "Der er endnu ikke offentliggjort en endelig pris her. Tilmelding er gratis og er ikke et køb eller et abonnement. Du får besked om adgang og vilkår, før du skal tage stilling.",
  ],
  [
    "Hvad sker der med min e-mail?",
    "Den gemmes med dit samtykke og bruges til e-mails om Træningsmesters lancering og adgangsrunder. Du kan altid afmelde dig gratis via linket i mails. Læs mere i privatlivspolitikken.",
  ],
];

export default function MarketingHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useEffect(() => {
    document.title = "Træningsmester — Træn videre fra sidste gang.";
    recordMarketingVisit();
  }, []);
  return (
    <div className="training-site" id="top">
      <a className="story-skip" href="#main-content">
        Gå til hovedindhold
      </a>
      <header className="story-header">
        <SiteBrand />
        <nav aria-label="Hovednavigation">
          <a href="#traeningsforloeb">Se træningen</a>
          <a href="#funktioner">Funktioner</a>
          <AccessLink className="header-access" />
        </nav>
      </header>
      <main id="main-content">
        <section
          className="story-hero section-shell"
          aria-labelledby="hero-title"
        >
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>Træn videre</span>
              <span>fra sidste gang.</span>
            </h1>
            <p className="hero-intro">
              Dit program, dine sæt og dine pauser samlet i én app. Se, hvad du
              løftede sidst, og hold fokus på den træning, du er i gang med.
            </p>
            <div className="hero-mobile-action">
              <AccessLink className="primary-link" />
              <p>Under udvikling. Få besked, når der er nyt om adgang.</p>
            </div>
          </div>
          <figure className="hero-product">
            <div className="hero-product-composition">
              <img
                className="hero-full-screen"
                src="/product/revision-full-set.webp"
                srcSet="/product/revision-full-set-640.webp 640w, /product/revision-full-set.webp 960w"
                sizes="(max-width: 480px) 170px, (max-width: 899px) 224px, 274px"
                width="960"
                height="2088"
                fetchPriority="high"
                alt="Overkrop A i Træningsmester. Bænkpres Med Stang er åben med tre planlagte sæt."
              />
              <div className="hero-detail">
                <p>Sidste gang. Næste sæt.</p>
                <div className="hero-detail-crop">
                  <img
                    src="/product/revision-detail-set.webp"
                    width="1200"
                    height="510"
                    alt="Forstørret udsnit: Sidste sæt var 60 kg × 8. Første sæt er nu indstillet til 62,5 kg × 8."
                  />
                </div>
              </div>
            </div>
            <figcaption>
              Overkrop A · Bænkpres Med Stang
              <span>Eksempeldata · rekonstrueret appvisning</span>
            </figcaption>
          </figure>
          <div className="hero-signup">
            <AccessForm />
            <a className="story-text-link" href="#traeningsforloeb">
              Se et træningsforløb <Arrow down />
            </a>
          </div>
        </section>
        <ProductStory />
        <section
          id="funktioner"
          className="possibilities section-shell"
          aria-labelledby="possibilities-title"
        >
          <div className="possibilities-heading">
            <figure className="training-photo">
              <img
                src="/product/athlete.webp"
                width="1000"
                height="1000"
                alt="En atlet gør sig klar ved vægtstangen i træningscenteret."
                loading="lazy"
                decoding="async"
              />
              <figcaption>Træningsfoto: Victor Freitas / Unsplash</figcaption>
            </figure>
            <h2 id="possibilities-title">
              Til din måde
              <br />
              at træne på.
            </h2>
          </div>
          <div className="possibilities-content">
            <div className="feature-row">
              <h3>Dit eget program</h3>
              <p>
                Byg træningsdage med de øvelser og sæt, du vil følge. Tilpas
                programmet, når din træning ændrer sig.
              </p>
            </div>
            <div className="feature-row">
              <h3>Styrke og kondition</h3>
              <p>
                Fra sættene i træningscenteret til løbeturen udenfor. Saml
                forskellige aktiviteter i samme app.
              </p>
            </div>
            <div className="feature-row">
              <h3>Apple Sundhed og Strava</h3>
              <p>
                Apple Sundhed er knyttet til iPhone. Strava er en valgfri
                forbindelse under udvikling. Tilgængelighed afhænger af platform
                og release.
              </p>
            </div>
            <details className="all-features">
              <summary>
                Se alle funktioner <span aria-hidden="true">+</span>
              </summary>
              <div className="feature-overview">
                <p>
                  Dette er funktioner i appen under udvikling. Oversigten er
                  ikke et løfte om offentlig adgang eller om, at alle funktioner
                  indgår i samme abonnement.
                </p>
                {featureGroups.map((group) => (
                  <section key={group.title}>
                    <h4>{group.title}</h4>
                    <p>{group.description}</p>
                    <p className="feature-status">{group.status}</p>
                  </section>
                ))}
              </div>
            </details>
          </div>
        </section>
        <section
          className="human-section section-shell"
          aria-labelledby="human-title"
        >
          <div className="human-heading">
            <p className="section-kicker">Bag Træningsmester</p>
            <h2 id="human-title">
              Udviklet af
              <br />
              Christian Kristensen.
            </h2>
          </div>
          <div className="human-copy">
            <p>
              Træningsmester udvikles af Christian Kristensen under KRISTENSON i
              Næstved.
            </p>
            <p>
              Projektet samler programmet, registreringen og historikken, så du
              kan holde fokus på træningen. Har du spørgsmål eller noget, du
              savner, er du velkommen til at skrive.
            </p>
            <a className="story-text-link" href="/support">
              Kontakt og support <Arrow />
            </a>
          </div>
        </section>
        <section
          id="faq"
          className="questions section-shell"
          aria-labelledby="questions-title"
        >
          <h2 id="questions-title">Inden du skriver dig op.</h2>
          <div className="question-list">
            {questions.map(([question, answer], index) => (
              <div className="question" key={question}>
                <h3>
                  <button
                    aria-expanded={openFaq === index}
                    aria-controls={`answer-${index}`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    {question}
                    <span aria-hidden="true">
                      {openFaq === index ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div id={`answer-${index}`} hidden={openFaq !== index}>
                  <p>
                    {answer}
                    {index === 3 && (
                      <>
                        {" "}
                        <a href="/privatliv">Se privatlivspolitikken.</a>
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="closing section-shell">
          <p>Dit program. Din næste træning.</p>
          <h2>Træn videre.</h2>
          <AccessLink className="closing-action" />
          <span>Under udvikling · Ingen offentlig adgangsdato endnu</span>
        </section>
      </main>
      <footer className="story-footer section-shell">
        <div className="footer-top">
          <SiteBrand />
          <a href="/app">
            Har du allerede adgang? Log ind <Arrow />
          </a>
        </div>
        <div className="footer-bottom">
          <p>
            KRISTENSON · CVR 40679456
            <br />
            Blomstergården 13, 4700 Næstved
          </p>
          <nav aria-label="Praktiske og juridiske links">
            <a href="/support">Support</a>
            <a href="/slet-konto">Slet konto</a>
            <a href="/privatliv">Privatliv</a>
            <a href="/vilkaar">Vilkår</a>
            <a href="/afmeld">Afmelding</a>
            <a href="/cookies">Cookies</a>
            <a href="/tilgaengelighed">Tilgængelighed</a>
          </nav>
        </div>
        <AnalyticsConsent />
      </footer>
    </div>
  );
}
