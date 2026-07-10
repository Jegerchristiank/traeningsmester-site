import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { BearHatSceneController } from "../three/createBearHatScene";

const DEFAULT_POSTER = "/animation/bear-hat-poster.png";

type SceneStatus = "fallback" | "loading" | "poster" | "ready";

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
 * Decorative hero art. The poster is always present, so reduced-motion users,
 * no-JS visits and WebGL failures get the same composed final scene.
 */
export default function BearHatScene({
  className,
  posterSrc = DEFAULT_POSTER,
  style,
}: BearHatSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = useState<SceneStatus>("poster");

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
        } catch {
          if (!cancelled) setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });

    return () => {
      cancelled = true;
      controller?.dispose();
    };
  }, [reducedMotion]);

  const wrapperStyle: CSSProperties = {
    aspectRatio: "1 / 1",
    isolation: "isolate",
    overflow: "hidden",
    position: "relative",
    width: "100%",
    ...style,
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <div
      aria-hidden="true"
      className={className}
      data-bear-scene-status={status}
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
    </div>
  );
}
