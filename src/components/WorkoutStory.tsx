import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Flip } from "gsap/Flip";
import "../workout-story.css";

const frames = {
  program: {
    height: 1250,
    moment: "I programmet",
    date: "15. november",
    value: "3 × 8",
    unit: "",
    label: "Sæt × gentagelser",
    note: "Planlagt pause",
    detail: "2:00 min.",
    alt: "Overkrop A i Mit styrkeprogram. Bænkpres Med Stang er planlagt med tre sæt af otte gentagelser, 60 kg og to minutters pause.",
  },
  set: {
    height: 1083,
    moment: "Første arbejdssæt",
    date: "15. november",
    value: "62,5",
    unit: "kg",
    label: "Vægt i første sæt",
    note: "Sidste gang",
    detail: "60 kg × 8",
    alt: "Første sætrække er aktiv. Der står 62,5 kg og otte gentagelser. Ovenover står sidste sæt fra tre dage tidligere, 60 kg × 8.",
  },
  rest: {
    height: 1403,
    moment: "Efter første sæt",
    date: "15. november",
    value: "01:42",
    unit: "",
    label: "Tilbage af pausen",
    note: "Næste arbejdssæt",
    detail: "2 af 3",
    alt: "62,5 kg × 8 er markeret udført med grønt. Andet sæt er aktivt, og pausefeltet nederst viser et minut og 42 sekunder tilbage.",
  },
  history: {
    height: 939,
    moment: "I næste træning",
    date: "17. november",
    value: "62,5",
    unit: "kg",
    label: "Vægt sidste gang",
    note: "15. november",
    detail: "1 sæt · 8 gent.",
    alt: "Tidligere for Bænkpres Med Stang. Den 15. november ligger ét registreret sæt med 62,5 kg × 8, og den 12. november ligger en tidligere træning.",
  },
} as const;

type Frame = keyof typeof frames;
type Chapter = Exclude<Frame, "rest">;

const chapters = [
  {
    frame: "program",
    id: "dit-program",
    number: "01",
    title: "Dit program er klar.",
    summary: "Overkrop A · Bænkpres · 3 × 8",
    copy: "Åbn Overkrop A. Bænkpres står klar med tre sæt af otte og to minutters pause mellem sættene.",
  },
  {
    frame: "set",
    id: "dit-saet",
    number: "02",
    title: "Et sæt ad gangen.",
    summary: "62,5 kg × 8 · Pause 01:42",
    copy: "Registrér sættet. Hold styr på pausen.",
  },
  {
    frame: "history",
    id: "din-historik",
    number: "03",
    title: "Tag det med til næste gang.",
    summary: "15. november · 62,5 kg × 8 gemt i historikken",
    copy: "Se dine tidligere træninger, når du skal videre.",
  },
] as const;

const reduceQuery = "(prefers-reduced-motion: reduce)";
function watchMotion(listener: () => void) {
  const media = window.matchMedia(reduceQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function WorkoutSheet({ frame }: { frame: Frame }) {
  const item = frames[frame];
  return (
    <figure className="ws-sheet" data-frame={frame}>
      <figcaption className="ws-sheet-heading">
        <span>Overkrop A</span>
        <span>{item.date}</span>
      </figcaption>
      <div className="ws-sheet-body">
        <div className="ws-readout">
          <span className="ws-readout-label">{item.label}</span>
          <span className="ws-value">
            {item.value}
            {item.unit && <small>{item.unit}</small>}
          </span>
          <span className="ws-note">
            {item.note}
            <strong>{item.detail}</strong>
          </span>
        </div>
        <div className="ws-window" data-flip-id="workout-screen">
          <img
            src={`/product/revision-${frame}.webp`}
            width={960}
            height={item.height}
            loading="lazy"
            decoding="async"
            alt={item.alt}
          />
        </div>
      </div>
      <div className="ws-sheet-footer">
        <span>Bænkpres med stang</span>
        <span>{item.moment}</span>
      </div>
    </figure>
  );
}

export default function WorkoutStory() {
  const allStates = useSyncExternalStore(
    watchMotion,
    () => window.matchMedia(reduceQuery).matches,
    () => false,
  );
  const [frame, setFrame] = useState<Frame>("program");
  const activeChapter: Chapter = frame === "rest" ? "set" : frame;
  const root = useRef<HTMLElement>(null);
  const flip = useRef<typeof Flip | null>(null);
  const previousWindow = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const mobileTarget = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (
      allStates ||
      !root.current ||
      !window.matchMedia("(min-width: 960px)").matches
    )
      return;
    const section = root.current;
    let disposed = false;
    let release = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void Promise.all([
          import("gsap"),
          import("gsap/Flip"),
          import("gsap/ScrollTrigger"),
        ])
          .then(([{ gsap }, { Flip }, { ScrollTrigger }]) => {
            if (disposed) return;
            gsap.registerPlugin(Flip, ScrollTrigger);
            flip.current = Flip;
            // Warm the upcoming app frames when the reader reaches the spread.
            const trigger = ScrollTrigger.create({
              trigger: section,
              start: "top bottom",
              once: true,
              onEnter: () => {
                for (const state of ["set", "rest", "history"]) {
                  const image = new Image();
                  image.src = `/product/revision-${state}.webp`;
                  void image.decode().catch(() => {});
                }
              },
            });
            release = () => trigger.kill();
          })
          .catch(() => {}); // Chapter controls and static sheets work without the motion bundle.
      },
      { rootMargin: "200px" },
    );
    observer.observe(section);
    return () => {
      disposed = true;
      observer.disconnect();
      release();
      flip.current = null;
      previousWindow.current = null;
    };
  }, [allStates]);

  function select(next: Frame, button?: HTMLButtonElement) {
    if (next === frame) return;
    const current = root.current?.querySelector<HTMLElement>(".ws-window");
    const wide = window.matchMedia("(min-width: 960px)").matches;
    if (wide && !allStates && current && flip.current) {
      flip.current.killFlipsOf(current);
      previousWindow.current = flip.current.getState(current);
    }
    if (!wide && button) mobileTarget.current = button;
    setFrame(next);
  }

  useLayoutEffect(() => {
    const next = root.current?.querySelector<HTMLElement>(".ws-window");
    if (previousWindow.current && flip.current && next) {
      flip.current.from(previousWindow.current, {
        targets: next,
        scale: true,
        duration: 0.4,
        ease: "power2.out",
      });
    }
    previousWindow.current = null;
    // A chapter above may have closed. Keep the button the visitor just chose in sight.
    const button = mobileTarget.current;
    if (button && button.getBoundingClientRect().top < 0)
      button.scrollIntoView({ block: "start", behavior: "instant" });
    mobileTarget.current = null;
  }, [frame]);

  return (
    <section
      ref={root}
      id="traeningsforloeb"
      className="workout-story"
      aria-labelledby="workout-story-heading"
    >
      <div className="ws-inner">
        <header className="ws-masthead">
          <h2 id="workout-story-heading">
            Fra sidste sæt
            <br />
            <em>til næste træning.</em>
          </h2>
          <p>
            Følg bænkpres gennem én træning i Overkrop A, fra programmet til det
            sæt, du finder igen næste gang.
          </p>
        </header>
        <div className="ws-book" data-all-states={allStates || undefined}>
          {chapters.map((chapter) => {
            const open = allStates || chapter.frame === activeChapter;
            const displayFrame =
              chapter.frame === "set" && frame === "rest" && !allStates
                ? "rest"
                : chapter.frame;
            return (
              <section
                key={chapter.id}
                className="ws-chapter"
                id={chapter.id}
                data-current={open || undefined}
              >
                <h3 className="ws-tab-heading">
                  {allStates ? (
                    <span className="ws-tab">
                      <span className="ws-index">{chapter.number}</span>
                      {chapter.title}
                    </span>
                  ) : (
                    <button
                      className="ws-tab"
                      type="button"
                      aria-expanded={open}
                      aria-disabled={open || undefined}
                      aria-controls={`workout-${chapter.frame}`}
                      aria-describedby={
                        open ? undefined : `summary-${chapter.frame}`
                      }
                      onClick={(event) => {
                        if (!open) select(chapter.frame, event.currentTarget);
                      }}
                    >
                      <span className="ws-index" aria-hidden="true">
                        {chapter.number}
                      </span>
                      <span>
                        {chapter.title}
                        {!open && (
                          <small
                            className="ws-summary"
                            aria-hidden="true"
                            id={`summary-${chapter.frame}`}
                          >
                            {chapter.summary}
                          </small>
                        )}
                      </span>
                      <svg
                        className="ws-pointer"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d={
                            open ? "M4 10h12M10 4l6 6-6 6" : "M4 10h12M10 4v12"
                          }
                          stroke="currentColor"
                          strokeWidth="1.65"
                        />
                      </svg>
                    </button>
                  )}
                </h3>
                <div
                  className="ws-chapter-body"
                  id={`workout-${chapter.frame}`}
                  hidden={!open}
                >
                  <div className="ws-copy">
                    <p>{chapter.copy}</p>
                    {chapter.frame === "set" && (
                      <p>
                        Sidst løftede du 60 kg. Denne gang skriver du 62,5 kg ×
                        8. Når du markerer sættet som udført, starter pausen.
                      </p>
                    )}
                    {chapter.frame === "history" && (
                      <p>
                        Åbn “Tidligere” ved bænkpres. Her ligger de 62,5 kg × 8
                        fra den 15. november.
                      </p>
                    )}
                    {chapter.frame === "set" && !allStates && (
                      <div
                        className="ws-steps"
                        role="group"
                        aria-label="Tidspunkter i andet kapitel"
                      >
                        <button
                          type="button"
                          aria-pressed={frame === "set"}
                          onClick={() => select("set")}
                        >
                          Se sættet
                        </button>
                        <button
                          type="button"
                          aria-pressed={frame === "rest"}
                          onClick={() => select("rest")}
                        >
                          Se pausen
                        </button>
                      </div>
                    )}
                  </div>
                  {open && <WorkoutSheet frame={displayFrame} />}
                  {allStates && chapter.frame === "set" && (
                    <WorkoutSheet frame="rest" />
                  )}
                </div>
              </section>
            );
          })}
        </div>
        <p className="ws-disclosure">
          Eksempeldata · rekonstruerede appvisninger
        </p>
      </div>
    </section>
  );
}
