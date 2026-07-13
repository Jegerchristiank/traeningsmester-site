import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type {
  BearHatSceneController,
  BearInteractionTarget,
} from "../three/createBearHatScene";

const DEFAULT_POSTER = "/animation/bear-hat-poster.png";

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
  const reducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = useState<SceneStatus>("poster");
  const [interaction, setInteraction] = useState<BearInteractionTarget>();
  const statusId = useId();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || reducedMotion) {
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
              if (!cancelled) setStatus("ready");
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
  }, [reducedMotion]);

  const handleInteraction = (target: BearInteractionTarget) => {
    controllerRef.current?.react(target);
    setInteraction(target);
  };

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
      aria-label="Interaktiv træningsbjørn"
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
        src={posterSrc}
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
      <span aria-live="polite" className="mk-sr-only" id={statusId}>
        {(interaction ? INTERACTION_COPY[interaction] : undefined) ??
          "Tryk på hovedet, maven eller armene for at få bjørnen til at reagere."}
      </span>
    </div>
  );
}
