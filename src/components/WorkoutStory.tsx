import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Flip } from "gsap/Flip";
import "../workout-story.css";

const chapters = [
  { number: "01", name: "Program", anchor: "dit-program", frame: "program" },
  { number: "02", name: "Sæt og pause", anchor: "dit-saet", frame: "set" },
  { number: "03", name: "Historik", anchor: "din-historik", frame: "history" },
] as const;

const frames = {
  program: {
    src: "story-program-day",
    width: 932,
    height: 581,
    alt: "Overkrop A i appen. Bænkpres Med Stang er planlagt med tre sæt af otte, 60 kg og to minutters pause.",
  },
  set: {
    src: "revision-detail-set",
    width: 1200,
    height: 510,
    alt: "Første arbejdssæt i appen. Der står 62,5 kg og otte gentagelser i den aktive række. Ovenover står det tidligere sæt, 60 kg × 8.",
  },
  rest: {
    src: "story-rest-detail",
    width: 932,
    height: 699,
    alt: "Det første sæt har et grønt flueben ved 62,5 kg × 8. Andet sæt er aktivt. Under rækkerne viser pausetimeren 01:42.",
  },
  history: {
    src: "revision-history",
    width: 960,
    height: 939,
    alt: "Tidligere for Bænkpres Med Stang. Den 15. november er ét sæt registreret med 62,5 kg × 8. Herunder ligger træningen den 12. november.",
  },
} as const;
type Frame = keyof typeof frames;
const wideQuery =
  "(min-width: 920px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)";
const readWide = () => window.matchMedia(wideQuery).matches;
const staticLayout = () => false;
function watchLayout(callback: () => void) {
  const media = window.matchMedia(wideQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function Prescription() {
  return (
    <dl className="ws-prescription">
      <div>
        <dt>Arbejdssæt</dt>
        <dd>3 × 8</dd>
      </div>
      <div>
        <dt>Planlagt vægt</dt>
        <dd>
          60 <small>kg</small>
        </dd>
      </div>
      <div>
        <dt>Pause</dt>
        <dd>
          2:00 <small>min.</small>
        </dd>
      </div>
    </dl>
  );
}

function SetComparison() {
  return (
    <div className="ws-set-proof">
      <dl className="ws-comparison">
        <div>
          <dt>
            <time dateTime="2026-11-12">12. november</time>
          </dt>
          <dd>
            60 <small>kg × 8</small>
          </dd>
        </div>
        <div>
          <dt>
            <time dateTime="2026-11-15">15. november</time>
          </dt>
          <dd>
            62,5 <small>kg × 8</small>
          </dd>
        </div>
      </dl>
      <p className="ws-change">
        <span>Forskel ved otte gentagelser</span>
        <strong>+2,5 kg</strong>
      </p>
    </div>
  );
}

function PauseScale() {
  return (
    <div className="ws-time-proof">
      <p className="ws-clock-label">Tilbage af pausen</p>
      <p className="ws-clock-value">01:42</p>
      <div
        className="ws-scale"
        role="meter"
        aria-label="Forløbet pausetid"
        aria-valuemin={0}
        aria-valuemax={120}
        aria-valuenow={18}
        aria-valuetext="18 af 120 sekunder er gået"
      >
        <span className="ws-scale-elapsed" aria-hidden="true" />
      </div>
      <div className="ws-scale-labels" aria-hidden="true">
        <span>0:00</span>
        <span>1:00</span>
        <span>2:00</span>
      </div>
      <p className="ws-elapsed-label">
        <strong>18 sek.</strong> af 120 er gået.
      </p>
    </div>
  );
}

function TrainingArchive() {
  return (
    <ol className="ws-archive" aria-label="Træningsdatoer i eksemplet">
      <li>
        <time dateTime="2026-11-12">
          <b>12</b> nov.
        </time>
        <div>
          <span>Forrige træning</span>
          <strong>60 kg × 8</strong>
        </div>
      </li>
      <li className="ws-saved">
        <time dateTime="2026-11-15">
          <b>15</b> nov.
        </time>
        <div>
          <span>Registreret sæt</span>
          <strong>62,5 kg × 8</strong>
        </div>
      </li>
      <li>
        <time dateTime="2026-11-17">
          <b>17</b> nov.
        </time>
        <div>
          <span>Næste træning</span>
          <strong>Se sættet fra den 15.</strong>
        </div>
      </li>
    </ol>
  );
}

function Scene({ frame }: { frame: Frame }) {
  const image = frames[frame];
  return (
    <figure className="ws-scene" data-frame={frame}>
      <figcaption className="ws-caption">
        <strong>Overkrop A</strong>
        <span>Bænkpres med stang</span>
      </figcaption>
      <div className="ws-layout">
        {frame === "program" && <Prescription />}
        {frame === "set" && <SetComparison />}
        {frame === "rest" && <PauseScale />}
        {frame === "history" && <TrainingArchive />}
        <div className="ws-window">
          <picture>
            {frame === "history" && (
              <source
                media="(max-width: 680px), (min-width: 1850px)"
                srcSet="/product/story-history-detail.webp"
                width="889"
                height="454"
              />
            )}
            <img
              data-flip-id="overkrop-workout-window"
              src={`/product/${image.src}.webp`}
              width={image.width}
              height={image.height}
              loading="lazy"
              decoding="async"
              alt={image.alt}
            />
          </picture>
        </div>
      </div>
    </figure>
  );
}

function StepLabel({ children }: { children: string }) {
  return <p className="ws-step-label">{children}</p>;
}

export default function WorkoutStory() {
  const wide = useSyncExternalStore(watchLayout, readWide, staticLayout);
  const root = useRef<HTMLElement>(null);
  const current = useRef<Frame>("program");
  const [frame, setFrame] = useState<Frame>("program");
  const flip = useRef<typeof Flip | null>(null);
  const previous = useRef<ReturnType<typeof Flip.getState> | null>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const steps = Array.from(
      section.querySelectorAll<HTMLElement>("[data-reading-step]"),
    );
    let raf = 0;
    let disposed = false;
    let releaseTrigger = () => {};

    function readPosition() {
      raf = 0;
      const line = Math.min(window.innerHeight * 0.43, 365);
      let next: Frame = "program";
      for (const step of steps) {
        if (step.getBoundingClientRect().top > line) break;
        next = step.dataset.readingStep as Frame;
      }
      if (current.current === next) return;
      const windowElement = section?.querySelector<HTMLElement>(
        ".ws-stage .ws-window img",
      );
      if (wide && windowElement && flip.current) {
        flip.current.killFlipsOf(windowElement);
        previous.current = flip.current.getState(windowElement);
      }
      current.current = next;
      setFrame(next);
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(readPosition);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    readPosition();

    const observer =
      wide && "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              observer?.disconnect();
              void Promise.all([
                import("gsap"),
                import("gsap/Flip"),
                import("gsap/ScrollTrigger"),
              ])
                .then(([{ gsap }, { Flip }, { ScrollTrigger }]) => {
                  if (disposed) return;
                  gsap.registerPlugin(Flip, ScrollTrigger);
                  flip.current = Flip;
                  const trigger = ScrollTrigger.create({
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    onUpdate: readPosition,
                    onRefresh: readPosition,
                  });
                  window.removeEventListener("scroll", schedule);
                  releaseTrigger = () => trigger.kill();
                  readPosition();
                })
                .catch(() => {}); // Native scrolling already selects each chapter.
            },
            { rootMargin: "180px" },
          )
        : null;
    observer?.observe(section);
    return () => {
      disposed = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      observer?.disconnect();
      releaseTrigger();
      previous.current = null;
      flip.current = null;
    };
  }, [wide]);

  useLayoutEffect(() => {
    const next = root.current?.querySelector<HTMLElement>(
      ".ws-stage .ws-window img",
    );
    if (previous.current && next && flip.current) {
      flip.current.from(previous.current, {
        targets: next,
        scale: true,
        duration: 0.38,
        ease: "power2.out",
      });
    }
    previous.current = null;
  }, [frame]);

  const inline = (state: Frame) => (wide ? null : <Scene frame={state} />);
  const chapter = frame === "rest" ? "set" : frame;
  return (
    <section
      id="traeningsforloeb"
      tabIndex={-1}
      className="workout-story"
      ref={root}
      aria-labelledby="workout-story-heading"
    >
      <div className="ws-inner">
        <header className="ws-masthead">
          <h2 id="workout-story-heading">
            Fra sidste sæt
            <br />
            <span>til næste træning.</span>
          </h2>
          <div className="ws-intro">
            <p>
              Følg én øvelse i Overkrop A, fra planen den 15. november til næste
              træning to dage senere.
            </p>
            <p className="ws-disclosure">
              Eksempeldata · rekonstruerede appvisninger
            </p>
          </div>
        </header>
        <nav className="ws-nav" aria-label="Træningsforløbets kapitler">
          {chapters.map((item) => (
            <a
              key={item.frame}
              href={`#${item.anchor}`}
              aria-current={chapter === item.frame ? "step" : undefined}
            >
              <span>{item.number}</span>
              {item.name}
            </a>
          ))}
        </nav>
        <div className="ws-spread" data-sticky={wide || undefined}>
          <div className="ws-reading">
            <article
              id="dit-program"
              className="ws-step"
              data-reading-step="program"
              aria-labelledby="ws-program-title"
            >
              <StepLabel>01 / Programmet</StepLabel>
              <h3 id="ws-program-title">Dit program er klar.</h3>
              <p>
                Åbn Overkrop A. Bænkpres med stang ligger klar med tre sæt af
                otte og to minutters pause.
              </p>
              {inline("program")}
            </article>
            <article id="dit-saet" aria-labelledby="ws-set-title">
              <div className="ws-step" data-reading-step="set">
                <StepLabel>02 / Første arbejdssæt</StepLabel>
                <h3 id="ws-set-title">Et sæt ad gangen.</h3>
                <p>Registrér sættet. Hold styr på pausen.</p>
                <p>
                  Sidst løftede du 60 kg. I dag skriver du 62,5 kg og otte
                  gentagelser i første sætrække.
                </p>
                {inline("set")}
              </div>
              <div
                id="din-pause"
                className="ws-step ws-pause-step"
                data-reading-step="rest"
              >
                <h4>Mellem sættene.</h4>
                <p>
                  Når du markerer sættet som udført, starter pausen. Andet sæt
                  ligger klar. Der er 1 minut og 42 sekunder tilbage.
                </p>
                {inline("rest")}
              </div>
            </article>
            <article
              id="din-historik"
              className="ws-step"
              data-reading-step="history"
              aria-labelledby="ws-history-title"
            >
              <StepLabel>03 / Historikken</StepLabel>
              <h3 id="ws-history-title">Tag det med til næste gang.</h3>
              <p>Se dine tidligere træninger, når du skal videre.</p>
              <p>
                Ved næste bænkpres åbner du “Tidligere”. Her ligger de 62,5 kg ×
                8 fra den 15. november.
              </p>
              {inline("history")}
            </article>
          </div>
          {wide && (
            <div className="ws-stage">
              <Scene frame={frame} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
