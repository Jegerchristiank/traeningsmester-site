import { useEffect, useRef, useState } from "react";

const directory = "/product/cover";
const portraitQuery = "(max-aspect-ratio: 1/1)";
type Playback = "poster" | "playing" | "paused" | "blocked";
type DataConnection = EventTarget & { saveData?: boolean };

export default function CoverMotion() {
  const poster = useRef<HTMLImageElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const toggle = useRef<() => void>(() => {});
  const [playback, setPlayback] = useState<Playback>("poster");

  useEffect(() => {
    if (!video.current || !poster.current || !window.IntersectionObserver)
      return;
    const player = video.current;
    const image = poster.current;

    const portrait = window.matchMedia(portraitQuery);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const save = window.matchMedia("(prefers-reduced-data: reduce)");
    const connection = (
      navigator as Navigator & { connection?: DataConnection }
    ).connection;
    let inView = false;
    // A user pause or an autoplay refusal lasts until the next explicit play.
    let needsGesture = false;
    let hasFrame = false;
    let attempt = 0;

    function display() {
      if (!player.hasAttribute("src") || player.error) setPlayback("poster");
      else if (hasFrame) setPlayback(player.paused ? "paused" : "playing");
      else setPlayback(needsGesture ? "blocked" : "poster");
    }

    function pausePlayer() {
      ++attempt;
      player.pause();
    }

    function sync() {
      const suppressed = reduce.matches || save.matches || connection?.saveData;
      const source =
        directory +
        (portrait.matches ? "/saet-portraet.mp4" : "/saet-landskab.mp4");
      const previous = player.getAttribute("src");
      if (previous && (suppressed || previous !== source)) {
        ++attempt;
        hasFrame = false;
        player.removeAttribute("src");
        player.load();
        setPlayback("poster");
      }

      if (
        suppressed ||
        !inView ||
        document.hidden ||
        document.querySelector("dialog[open]")
      ) {
        pausePlayer();
        return;
      }
      if (needsGesture) {
        setPlayback(hasFrame ? "paused" : "blocked");
        return;
      }
      if (!image.complete || player.error) return;
      if (player.getAttribute("src") !== source) {
        player.muted = true;
        player.src = source;
      }
      if (!player.paused) return;
      const activeAttempt = ++attempt;
      void player.play().catch((error: unknown) => {
        if (
          activeAttempt !== attempt ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;
        needsGesture = true;
        display();
      });
    }

    function showFrame() {
      if (player.paused || !player.hasAttribute("src") || player.error) return;
      hasFrame = true;
      display();
    }
    function playing() {
      // Keep the still in front while the decoder presents its first frame.
      if (!hasFrame && player.requestVideoFrameCallback)
        player.requestVideoFrameCallback(showFrame);
      else showFrame();
    }
    toggle.current = () => {
      if (player.paused) {
        needsGesture = false;
        sync();
      } else {
        needsGesture = true;
        pausePlayer();
      }
    };

    const viewport = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    viewport.observe(image);
    const dialogs = new MutationObserver(sync);
    document.querySelectorAll("dialog").forEach((dialog) =>
      dialogs.observe(dialog, {
        attributes: true,
        attributeFilter: ["open"],
      }),
    );
    const events = new AbortController();
    const options = { signal: events.signal };
    for (const query of [portrait, reduce, save])
      query.addEventListener("change", sync, options);
    connection?.addEventListener?.("change", sync, options);
    document.addEventListener("visibilitychange", sync, options);
    window.addEventListener("pageshow", sync, options);
    window.addEventListener("pagehide", pausePlayer, options);
    image.addEventListener("load", sync, options);
    image.addEventListener("error", sync, options);
    player.addEventListener("playing", playing, options);
    player.addEventListener("pause", display, options);
    player.addEventListener("error", display, options);
    return () => {
      events.abort();
      viewport.disconnect();
      dialogs.disconnect();
      pausePlayer();
      if (player.hasAttribute("src")) {
        player.removeAttribute("src");
        player.load();
      }
    };
  }, []);

  const isPlaying = playback === "playing";
  const label = isPlaying
    ? "Sæt baggrundsfilmen på pause"
    : "Afspil baggrundsfilmen";
  return (
    <>
      <div
        className="cover-visual"
        data-has-frame={isPlaying || playback === "paused" || undefined}
        aria-hidden="true"
      >
        <picture>
          <source
            media={portraitQuery}
            srcSet={directory + "/saet-portraet.webp"}
          />
          <img
            ref={poster}
            className="focus-photo"
            src={directory + "/saet-landskab.webp"}
            fetchPriority="high"
            alt=""
          />
        </picture>
        <video
          id="cover-film"
          className="cover-video"
          ref={video}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
        />
      </div>
      <button
        type="button"
        className="cover-motion-toggle"
        hidden={playback === "poster"}
        aria-controls="cover-film"
        aria-label={label}
        title={label}
        onClick={() => toggle.current()}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          {isPlaying ? (
            <path d="M4 2.5h2.5v11H4zm5.5 0H12v11H9.5z" />
          ) : (
            <path d="M4 2.3a.6.6 0 0 1 .9-.5l8 5.7a.6.6 0 0 1 0 1l-8 5.7a.6.6 0 0 1-.9-.5z" />
          )}
        </svg>
      </button>
    </>
  );
}
