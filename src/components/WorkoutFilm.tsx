import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import "../workout-film.css";

const asset = "/product/film/";
const portraitQuery = "(max-aspect-ratio: 4/5)";
const demoAnchors = new Set([
  "#baenkpres-log",
  "#dit-program",
  "#dit-saet",
  "#din-pause",
  "#din-historik",
]);

export type FilmControl = { play: () => void };

export default function WorkoutFilm({
  control,
  children,
  accessLink,
}: {
  control: Ref<FilmControl>;
  children: ReactNode;
  accessLink: ReactNode;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const practice = useRef<HTMLDetailsElement>(null);
  const [state, setState] = useState<"poster" | "player" | "error">("poster");
  const [ended, setEnded] = useState(false);
  const [format, setFormat] = useState<"bred" | "hoej">("bred");

  function play() {
    const video = player.current;
    if (!video) return;
    const chosen = window.matchMedia(portraitQuery).matches ? "hoej" : "bred";
    if (
      !video.getAttribute("src") ||
      video.error ||
      (video.ended && chosen !== format)
    ) {
      setFormat(chosen);
      video.poster = asset + "kridt-" + chosen + ".webp";
      video.src = asset + "baenkpres-" + chosen + ".mp4";
    } else if (video.ended) {
      video.currentTime = 0;
    }
    // Keep play inside the initiating tap so iOS can start the voice track.
    video.hidden = false;
    setEnded(false);
    setState("player");
    void video.play().catch(() => {
      if (video.error) setState("error");
      // Browsers that require a second tap display their own accessible controls.
    });
  }

  useImperativeHandle(control, () => ({ play }));

  useEffect(() => {
    const video = player.current;
    if (!video) return;
    let seen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) seen = true;
        else if (seen) {
          video.pause();
          seen = false;
        }
      },
      { threshold: 0.02 },
    );
    observer.observe(video.parentElement!);
    const onHidden = () => {
      if (document.hidden) video.pause();
    };
    const followFragment = () => {
      if (!demoAnchors.has(window.location.hash) || !practice.current) return;
      practice.current.open = true;
      requestAnimationFrame(() =>
        document
          .getElementById(window.location.hash.slice(1))
          ?.scrollIntoView(),
      );
    };
    followFragment();
    window.addEventListener("hashchange", followFragment);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", followFragment);
      document.removeEventListener("visibilitychange", onHidden);
      video.pause();
    };
  }, []);

  return (
    <>
      <section
        id="traeningsforloeb"
        className="workout-cinema"
        tabIndex={-1}
        aria-labelledby="onsite-film-title"
      >
        <div
          className="cinema-frame"
          data-state={state}
          data-format={state === "player" ? format : undefined}
        >
          <picture className="cinema-poster" aria-hidden="true">
            <source
              media={portraitQuery}
              srcSet={asset + "kridt-hoej.webp"}
              width="720"
              height="1280"
            />
            <img
              src={asset + "kridt-bred.webp"}
              width="1600"
              height="900"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </picture>
          <div className="cinema-intro">
            <p>Overkrop A · Bænkpres med stang</p>
            <h2 id="onsite-film-title">
              Hvad løftede <span>jeg sidst?</span>
            </h2>
            <a
              className="cinema-start"
              href={asset + "baenkpres-bred.mp4"}
              aria-controls="workout-film"
              onClick={(event) => {
                if (
                  event.button ||
                  event.metaKey ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.shiftKey
                )
                  return;
                event.preventDefault();
                play();
                player.current?.focus({ preventScroll: true });
              }}
            >
              <span className="cinema-play-shape" aria-hidden="true" />
              {state === "error" ? "Prøv at afspille igen" : "Afspil filmen"}
              <span aria-hidden="true" className="cinema-length">
                0:40
              </span>
            </a>
            {state === "error" && (
              <p className="cinema-error" role="alert">
                Filmen kunne ikke indlæses. Du kan også prøve sættet nedenfor.
              </p>
            )}
          </div>
          <video
            ref={player}
            id="workout-film"
            controls
            playsInline
            preload="none"
            hidden={state !== "player"}
            tabIndex={0}
            aria-label="Bænkpres i Træningsmester, 40 sekunder med dansk tale"
            aria-describedby="onsite-film-info"
            onError={() => setState("error")}
            onEnded={() => setEnded(true)}
            onPlay={() => setEnded(false)}
          >
            <track
              kind="captions"
              srcLang="da"
              label="Dansk"
              src={asset + "baenkpres-da.vtt"}
            />
          </video>
        </div>
        <div className="cinema-credits" id="onsite-film-info">
          <span>
            40 sek. <i>·</i> Dansk AI-stemme <i>·</i> Danske undertekster
          </span>
          {ended ? accessLink : <span>Træningsmester · Eksempeltræning</span>}
        </div>
      </section>
      <details
        ref={practice}
        className="bench-disclosure"
        onToggle={(event) => {
          if (event.currentTarget.open) player.current?.pause();
        }}
      >
        <summary>
          <span>Prøv sættet selv</span>
          <span className="bench-expand" aria-hidden="true">
            +
          </span>
        </summary>
        {children}
      </details>
    </>
  );
}
