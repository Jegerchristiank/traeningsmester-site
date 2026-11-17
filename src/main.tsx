import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

const Account = lazy(() => import("./Account"));
const AiAssistants = lazy(() => import("./AiAssistants"));
import MarketingSite from "./MarketingSite";

const isAiRoute = ["/ai/connect", "/ai/connections", "/ai/help"].includes(window.location.pathname);
const isAccountRoute =
  window.location.pathname === "/app" ||
  window.location.pathname.startsWith("/app/");
const robotsMeta = document.querySelector<HTMLMetaElement>(
  'meta[name="robots"]',
);
if (isAccountRoute) {
  document.title = "Din konto · Træningsmester";
  if (robotsMeta) robotsMeta.content = "noindex, nofollow";
  const appUrl = "https://www.traeningsmester.dk/app";
  const appDescription =
    "Log ind på din Træningsmester-konto og administrer de værktøjer, du har forbundet.";
  const canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (canonical) canonical.href = appUrl;
  const metaUpdates: Array<[string, string, string]> = [
    ["property", "og:title", document.title],
    ["property", "og:description", appDescription],
    ["property", "og:url", appUrl],
    ["name", "twitter:title", document.title],
    ["name", "twitter:description", appDescription],
    ["name", "description", appDescription],
  ];
  metaUpdates.forEach(([attribute, name, content]) => {
    const meta = document.querySelector<HTMLMetaElement>(
      `meta[${attribute}="${name}"]`,
    );
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
        background: "#f6f5f1",
      }}
    >
      <img src="/brand/tm-logo-256.webp" alt="" width="64" height="64" />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      {isAiRoute ? <AiAssistants /> : isAccountRoute ? <Account /> : <MarketingSite />}
    </Suspense>
  </StrictMode>,
);
