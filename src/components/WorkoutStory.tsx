import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { Flip } from "gsap/Flip";
import "../workout-story.css";

const frames = {
  program: {
    anchor: "dit-program",
    src: "story-program-day",
    width: 932,
    height: 581,
    caption: "Dit program er klar. Overkrop A begynder med bænkpres.",
    alt: "Overkrop A i appen. Bænkpres Med Stang er planlagt med tre sæt af otte, 60 kg og to minutters pause.",
  },
  set: {
    anchor: "dit-saet",
    src: "revision-detail-set",
    width: 1200,
    height: 510,
    caption: "Se, hvad du løftede sidst, mens du registrerer det næste sæt.",
    alt: "Første arbejdssæt i appen. Der står 62,5 kg og otte gentagelser i den aktive række. Ovenover står det tidligere sæt, 60 kg × 8.",
  },
  rest: {
    anchor: "din-pause",
    src: "story-rest-detail",
    width: 932,
    height: 699,
    caption: "Sættet er registreret. Pausen er i gang, og næste sæt er klar.",
    alt: "Det første sæt har et grønt flueben ved 62,5 kg × 8. Andet sæt er aktivt. Under rækkerne viser pausetimeren 01:42.",
  },
  history: {
    anchor: "din-historik",
    src: "story-history-detail",
    width: 889,
    height: 454,
    caption: "Næste gang finder du sættet under Tidligere i den samme øvelse.",
    alt: "Tidligere sæt for Bænkpres Med Stang. Den 15. november er ét sæt registreret med 62,5 kg × 8. Herunder ligger træningen den 12. november med tre sæt.",
  },
} as const;
type Frame = keyof typeof frames;
const frameKeys = Object.keys(frames) as Frame[];
const nextSteps: Partial<Record<Frame, { frame: Frame; label: string }>> = {
  program: { frame: "set", label: "Se sættet" },
  set: { frame: "rest", label: "Se pausen" },
  rest: { frame: "history", label: "Se historikken" },
};
const chapters = [
  { name: "Program", frame: "program" },
  { name: "Sæt og pause", frame: "set" },
  { name: "Historik", frame: "history" },
] as const;
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const frameFromHash = () =>
  frameKeys.find((key) => `#${frames[key].anchor}` === window.location.hash);

export default function WorkoutStory() {
  const [frame, setFrame] = useState<Frame>("program");
  const [enhanced, setEnhanced] = useState(false);
  const section = useRef<HTMLElement>(null);
  const flip = useRef<typeof Flip | null>(null);
  const beforeChange = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const animation = useRef<ReturnType<typeof Flip.from> | null>(null);
  const focusPanel = useRef(false);
  const motionRequested = useRef(false);
  const disposed = useRef(false);

  useEffect(() => {
    disposed.current = false;
    setEnhanced(true);
    const followHash = () => {
      const next = frameFromHash();
      if (next) setFrame(next);
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    window.addEventListener("popstate", followHash);
    return () => {
      disposed.current = true;
      animation.current?.kill();
      window.removeEventListener("hashchange", followHash);
      window.removeEventListener("popstate", followHash);
    };
  }, []);

  // Only visitors who interact with the example download motion. The first
  // choice works immediately even while these optional modules are loading.
  function prepareMotion() {
    if (motionRequested.current || reducedMotion()) return;
    motionRequested.current = true;
    void Promise.all([import("gsap"), import("gsap/Flip")])
      .then(([{ gsap }, { Flip: plugin }]) => {
        if (disposed.current) return;
        gsap.registerPlugin(plugin);
        flip.current = plugin;
      })
      .catch(() => {
        // Every state remains available if motion cannot be loaded.
      });
  }

  useLayoutEffect(() => {
    if (!enhanced) return;
    const panel = section.current?.querySelector<HTMLElement>(
      `[data-frame="${frame}"]`,
    );
    const image = panel?.querySelector("img");
    if (beforeChange.current && flip.current && image && !reducedMotion()) {
      animation.current = flip.current.from(beforeChange.current, {
        targets: image,
        duration: 0.22,
        ease: "power2.out",
        scale: true,
      });
    }
    beforeChange.current = null;
    if (focusPanel.current) {
      panel?.focus({ preventScroll: true });
      focusPanel.current = false;
    }
  }, [frame, enhanced]);

  function showFrame(event: MouseEvent<HTMLAnchorElement>, next: Frame) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    prepareMotion();
    if (window.location.hash !== `#${frames[next].anchor}`) {
      window.history.pushState(null, "", `#${frames[next].anchor}`);
    }
    if (next === frame) return;
    animation.current?.kill();
    const image = section.current?.querySelector<HTMLImageElement>(
      `[data-frame="${frame}"] img`,
    );
    beforeChange.current =
      image && flip.current && !reducedMotion()
        ? flip.current.getState(image)
        : null;
    // Chapter links keep focus. A next-step link is about to be hidden, so
    // focus follows its destination instead of falling back to the body.
    focusPanel.current = Boolean(
      event.currentTarget.closest(".ws-description"),
    );
    setFrame(next);
  }

  return (
    <section
      id="traeningsforloeb"
      className="workout-story"
      aria-labelledby="workout-story-heading"
      tabIndex={-1}
      ref={section}
      data-enhanced={enhanced ? "true" : undefined}
    >
      <div className="ws-inner">
        <header className="ws-header">
          <h2 id="workout-story-heading">Sådan virker appen.</h2>
        </header>
        <nav
          className="ws-nav"
          aria-label="Se et træningsforløb"
          onPointerEnter={prepareMotion}
          onPointerDown={prepareMotion}
          onFocusCapture={prepareMotion}
        >
          {chapters.map((chapter) => (
            <a
              key={chapter.frame}
              href={`#${frames[chapter.frame].anchor}`}
              aria-controls={frames[chapter.frame].anchor}
              aria-current={
                enhanced &&
                (frame === chapter.frame ||
                  (frame === "rest" && chapter.frame === "set"))
                  ? "step"
                  : undefined
              }
              onClick={(event) => showFrame(event, chapter.frame)}
            >
              {chapter.name}
            </a>
          ))}
        </nav>
        <div className="ws-viewer">
          {frameKeys.map((key) => {
            const state = frames[key];
            return (
              <figure
                key={key}
                id={state.anchor}
                className="ws-panel"
                data-frame={key}
                data-active={frame === key ? "true" : undefined}
                aria-labelledby={`${state.anchor}-caption`}
                tabIndex={-1}
              >
                <div className="ws-product">
                  <img
                    src={`/product/${state.src}.webp`}
                    width={state.width}
                    height={state.height}
                    alt={state.alt}
                    loading="lazy"
                    decoding="async"
                    data-flip-id="overkrop-workout-window"
                  />
                </div>
              </figure>
            );
          })}
        </div>
        <div className="ws-descriptions">
          {frameKeys.map((key) => {
            const state = frames[key];
            const next = nextSteps[key];
            return (
              <div
                key={key}
                className="ws-description"
                data-description={key}
                data-active={frame === key ? "true" : undefined}
              >
                <p id={`${state.anchor}-caption`}>{state.caption}</p>
                {next && (
                  <a
                    href={`#${frames[next.frame].anchor}`}
                    onPointerEnter={prepareMotion}
                    onFocus={prepareMotion}
                    onClick={(event) => showFrame(event, next.frame)}
                  >
                    {next.label} <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
        <p className="ws-disclosure">
          Eksempeldata · Appvisningerne er rekonstrueret.
        </p>
      </div>
    </section>
  );
}
