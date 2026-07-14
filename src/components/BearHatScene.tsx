import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type {
  BearHatSceneController,
  BearInteractionTarget,
} from "../three/createBearHatScene";

const DEFAULT_POSTER = "/animation/bear-hat-poster-540.webp";
const MOTION_STORAGE_KEY = "tm-bear-motion-paused";
const INTERACTION_DURATION_MILLISECONDS = 1_400;

type SceneStatus = "fallback" | "loading" | "poster" | "ready";

const INTERACTION_COPY: Record<
  BearInteractionTarget,
  string
> = {
  head: "Hovedreaktion aktiveret.",
  belly: "Mavereaktion aktiveret.",
  leftArm: "Venstre armreaktion aktiveret.",
  rightArm: "Højre armreaktion aktiveret.",
};

const INTERACTION_TARGETS: Array<{
  className: string;
  label: string;
  target: BearInteractionTarget;
}> = [
  { className: "is-head", label: "Nus bjørnen på hovedet", target: "head" },
  { className: "is-belly", label: "Tryk bjørnen på maven", target: "belly" },
  { className: "is-left-arm", label: "Tryk på armen til venstre", target: "leftArm" },
  { className: "is-right-arm", label: "Tryk på armen til højre", target: "rightArm" },
];

export type BearHatSceneProps = {
  className?: string;
  posterSrc?: string;
  style?: CSSProperties;
};

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function connectionSavesData(): boolean {
  if (typeof navigator === "undefined") return true;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean };
  }).connection;
  return connection?.saveData === true;
}

function readStoredPause(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(MOTION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function storePause(paused: boolean) {
  try {
    if (paused) window.sessionStorage.setItem(MOTION_STORAGE_KEY, "1");
    else window.sessionStorage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    /* Session storage can be unavailable in restricted browser contexts. */
  }
}

/**
 * Interactive hero art. The poster is always present, so reduced-motion users,
 * no-JS visits and WebGL failures still get the same composed final scene.
 */
export default function BearHatScene({
  className,
  posterSrc = DEFAULT_POSTER,
  style,
}: BearHatSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<BearHatSceneController | undefined>(undefined);
  const interactionTimeoutRef = useRef<number | undefined>(undefined);
  const reducedMotion = usePrefersReducedMotion();
  const [saveData] = useState(connectionSavesData);
  const [status, setStatus] = useState<SceneStatus>("poster");
  const [shouldLoad, setShouldLoad] = useState(false);
  const [paused, setPaused] = useState(readStoredPause);
  const [interaction, setInteraction] = useState<BearInteractionTarget>();
  const pausedRef = useRef(paused);
  const statusId = useId();
  const canAnimate = !reducedMotion && !saveData;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !canAnimate || !shouldLoad) {
      setStatus("poster");
      return;
    }

    let cancelled = false;
    let controller: BearHatSceneController | undefined;
    setStatus("loading");

    void import("../three/createBearHatScene")
      .then(({ createBearHatScene }) => {
        if (cancelled || !mount.isConnected) return;

        try {
          controller = createBearHatScene(mount, {
            onFallback: () => {
              if (!cancelled) setStatus("fallback");
            },
            onReady: () => {
              if (cancelled) return;
              if (pausedRef.current) controller?.pause();
              setStatus("ready");
            },
          });
          controllerRef.current = controller;
        } catch {
          if (!cancelled) setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });

    return () => {
      cancelled = true;
      if (controllerRef.current === controller) controllerRef.current = undefined;
      controller?.dispose();
    };
  }, [canAnimate, shouldLoad]);

  useEffect(
    () => () => {
      if (interactionTimeoutRef.current) {
        window.clearTimeout(interactionTimeoutRef.current);
      }
    },
    []
  );

  const handleInteraction = (target: BearInteractionTarget) => {
    const controller = controllerRef.current;
    if (!controller || status !== "ready") return;
    controller.react(target);
    setInteraction(target);
    if (interactionTimeoutRef.current) {
      window.clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = window.setTimeout(
      () => setInteraction(undefined),
      INTERACTION_DURATION_MILLISECONDS
    );
  };

  const handlePlayback = () => {
    if (!canAnimate) return;
    if (status === "poster") {
      storePause(false);
      setPaused(false);
      setShouldLoad(true);
      return;
    }
    const controller = controllerRef.current;
    if (!controller || status !== "ready") return;
    if (paused) controller.play();
    else controller.pause();
    storePause(!paused);
    setPaused((current) => !current);
  };

  const playbackLabel =
    status === "loading"
      ? "Henter animation…"
      : status === "ready" && !paused
        ? "Pause animation"
        : "Afspil animation";
  const statusMessage = interaction
    ? INTERACTION_COPY[interaction]
    : status === "ready"
      ? paused
        ? "Bjørneanimationen er sat på pause."
        : "Bjørneanimationen afspilles. Tryk på bjørnen for en reaktion."
      : canAnimate
        ? "Animationen starter kun, hvis du vælger Afspil animation."
        : "En statisk træningsbjørn vises uden animation.";

  const wrapperStyle: CSSProperties = {
    aspectRatio: "1 / 1",
    isolation: "isolate",
    overflow: "hidden",
    position: "relative",
    width: "100%",
    ...style,
    userSelect: "none",
  };

  return (
    <div
      aria-describedby={statusId}
      aria-label={canAnimate ? "Træningsbjørn med valgfri animation" : "Træningsbjørn"}
      className={className}
      data-bear-reaction={interaction ?? "idle"}
      data-bear-scene-status={status}
      role="group"
      style={wrapperStyle}
    >
      <img
        alt=""
        decoding="async"
        draggable={false}
        fetchPriority="high"
        height="540"
        src={posterSrc}
        width="540"
        style={{
          display: "block",
          height: "100%",
          inset: 0,
          objectFit: "contain",
          opacity: status === "ready" ? 0 : 1,
          position: "absolute",
          transition: "opacity 180ms ease-out",
          width: "100%",
          zIndex: 0,
        }}
      />
      <div
        ref={mountRef}
        style={{
          height: "100%",
          inset: 0,
          opacity: status === "ready" ? 1 : 0,
          position: "absolute",
          transition: "opacity 180ms ease-out",
          width: "100%",
          zIndex: 1,
        }}
      />
      {status === "ready" ? (
        <>
          <span aria-hidden="true" className="bear-interaction-hint">
            Tryk på bjørnen
          </span>
          {INTERACTION_TARGETS.map((item) => (
            <button
              aria-label={item.label}
              aria-pressed={interaction === item.target}
              className={`bear-interaction-target ${item.className}`}
              data-testid={`bear-${item.target}`}
              key={item.target}
              onClick={() => handleInteraction(item.target)}
              type="button"
            />
          ))}
        </>
      ) : null}
      {canAnimate && status !== "fallback" ? (
        <button
          className="bear-motion-control"
          disabled={status === "loading"}
          onClick={handlePlayback}
          type="button"
        >
          <span aria-hidden="true">
            {status === "ready" && !paused ? "Ⅱ" : "▶"}
          </span>
          {playbackLabel}
        </button>
      ) : null}
      <span aria-live="polite" className="mk-sr-only" id={statusId}>
        {statusMessage}
      </span>
    </div>
  );
}
