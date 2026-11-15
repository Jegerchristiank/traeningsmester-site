export type MarketingEvent =
  | "visitor"
  | "attempt"
  | "confirmed"
  | "error"
  | "share_attempt";
export type MarketingProperties = {
  reason?: "email" | "consent" | "rate_limit" | "service" | "network";
  method?: "native" | "copy";
};

const consentKey = "tm-marketing-statistics-v1";
const events = new Set<MarketingEvent>([
  "visitor",
  "attempt",
  "confirmed",
  "error",
  "share_attempt",
]);
const reasons = new Set([
  "email",
  "consent",
  "rate_limit",
  "service",
  "network",
]);

type AnalyticsOptions = {
  token?: string;
  host?: string;
  send?: typeof fetch;
  storage?: Pick<Storage, "getItem" | "setItem">;
  uuid?: () => string;
  isActivePage?: () => boolean;
  environment?: "production" | "preview";
};

/** Explicit events only. No SDK, DOM capture, cookies, replay or person profiles. */
export function createMarketingAnalytics(options: AnalyticsOptions) {
  let endpoint: string | null = null;
  try {
    const host = new URL(options.host ?? "");
    if (
      host.protocol === "https:" &&
      /^phc_[A-Za-z0-9]+$/.test(options.token ?? "")
    ) {
      endpoint = `${host.origin}/i/v0/e/`;
    }
  } catch {
    /* Missing configuration leaves measurement off. */
  }

  let allowed = false;
  try {
    allowed = options.storage?.getItem(consentKey) === "allowed";
  } catch {
    /* Storage may be unavailable. */
  }
  let pageId: string | null = null;
  let visited = false;

  const capture = (
    event: MarketingEvent,
    properties: MarketingProperties = {},
  ) => {
    if (
      !allowed ||
      !endpoint ||
      !events.has(event) ||
      options.isActivePage?.() === false
    )
      return;
    if (event === "visitor" && visited) return;
    // Build the payload afresh: callers cannot smuggle emails, URLs or free text in.
    const safeProperties: Record<string, string | boolean> = {
      source: "traeningsmester-site",
      page: "/",
      environment: options.environment ?? "preview",
      $process_person_profile: false,
      $geoip_disable: true,
    };
    if (
      event === "error" &&
      properties.reason &&
      reasons.has(properties.reason)
    )
      safeProperties.reason = properties.reason;
    if (
      event === "share_attempt" &&
      (properties.method === "native" || properties.method === "copy")
    )
      safeProperties.method = properties.method;
    try {
      const uuid = options.uuid ?? (() => crypto.randomUUID());
      pageId ??= uuid();
      if (event === "visitor") visited = true;
      void (options.send ?? fetch)(endpoint, {
        method: "POST",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          api_key: options.token,
          event: `marketing_${event}`,
          distinct_id: pageId,
          uuid: uuid(),
          properties: safeProperties,
        }),
      }).catch(() => {
        /* Analytics never changes the signup outcome. */
      });
    } catch {
      /* Keep core controls usable if a browser blocks tracking. */
    }
  };

  return {
    configured: Boolean(endpoint),
    isAllowed: () => allowed,
    capture,
    setConsent(next: boolean) {
      allowed = next;
      try {
        options.storage?.setItem(consentKey, next ? "allowed" : "denied");
      } catch {
        /* The current choice still applies. */
      }
      if (next) capture("visitor");
      else pageId = null;
    },
  };
}

let storage: Storage | undefined;
try {
  storage = typeof window === "undefined" ? undefined : window.localStorage;
} catch {
  /* Private browsers may deny access. */
}
const environment = import.meta.env ?? {};
const analytics = createMarketingAnalytics({
  token: environment.VITE_POSTHOG_PROJECT_TOKEN,
  host: environment.VITE_POSTHOG_HOST,
  storage,
  environment:
    typeof window !== "undefined" &&
    /^(www\.)?traeningsmester\.dk$/.test(window.location.hostname)
      ? "production"
      : "preview",
  isActivePage: () =>
    typeof window !== "undefined" && window.location.pathname === "/",
});

export const marketingAnalyticsConfigured = analytics.configured;
export const getMarketingAnalyticsConsent = analytics.isAllowed;
export const setMarketingAnalyticsConsent = analytics.setConsent;
export const trackMarketingEvent = analytics.capture;
export const recordMarketingVisit = () => analytics.capture("visitor");
