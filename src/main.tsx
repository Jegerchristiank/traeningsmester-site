import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

const WebApp = lazy(() => import("./App"));
const MarketingSite = lazy(() => import("./MarketingSite"));

const isWebAppRoute = window.location.pathname === "/app" || window.location.pathname.startsWith("/app/");
const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
if (isWebAppRoute) {
  document.title = "Træningsmester webapp";
  if (robotsMeta) robotsMeta.content = "noindex, nofollow";
  const appUrl = "https://www.traeningsmester.dk/app";
  const appDescription =
    "Log ind på Træningsmester-webappen og hent dine programmer, øvelser og træningshistorik.";
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = appUrl;
  const metaUpdates: Array<[string, string, string]> = [
    ["property", "og:title", "Træningsmester webapp"],
    ["property", "og:description", appDescription],
    ["property", "og:url", appUrl],
    ["name", "twitter:title", "Træningsmester webapp"],
    ["name", "twitter:description", appDescription],
    ["name", "description", appDescription]
  ];
  metaUpdates.forEach(([attribute, name, content]) => {
    const meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
    if (meta) meta.content = content;
  });
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f4f7fb"
      }}
    >
      <img src="/brand/tm-logo.png" alt="" width="64" height="64" />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      {isWebAppRoute ? <WebApp /> : <MarketingSite />}
    </Suspense>
  </StrictMode>
);
