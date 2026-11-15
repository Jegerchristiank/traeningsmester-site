import { useEffect, useRef, useState, type FormEvent } from "react";
import { trackMarketingEvent } from "../marketingAnalytics";

const siteUrl = "https://www.traeningsmester.dk/";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AccessError = "email" | "consent" | "rate_limit" | "service" | "network";
type AccessState =
  | { type: "idle" | "submitting" }
  | { type: "error"; reason: AccessError; message: string }
  | { type: "success"; email: string };

/** The existing endpoint acknowledges stored signups, not delivery or double opt-in. */
export async function requestAccess(
  payload: { email: string; consent: boolean; website: string; source: string },
  send: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; reason: AccessError }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await send("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      referrerPolicy: "origin",
      signal: controller.signal,
      body: JSON.stringify({
        ...payload,
        audience: "nysgerrig",
        audienceLabel: "Pre-launch signup",
        submittedAt: new Date().toISOString(),
      }),
    });
    const body: unknown = await response.json().catch(() => null);
    const data =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    if (response.ok && data.ok === true && data.confirmation === "accepted")
      return { ok: true };
    if (data.code === "INVALID_EMAIL") return { ok: false, reason: "email" };
    if (data.code === "CONSENT_REQUIRED")
      return { ok: false, reason: "consent" };
    if (response.status === 429 || data.code === "RATE_LIMITED")
      return { ok: false, reason: "rate_limit" };
    return { ok: false, reason: "service" };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

const errorMessages: Record<AccessError, string> = {
  email: "Skriv en gyldig e-mailadresse, fx navn@eksempel.dk.",
  consent:
    "Sæt kryds, hvis KRISTENSON må sende dig e-mails om lancering og adgang.",
  rate_limit:
    "Der er sendt for mange tilmeldinger herfra. Din e-mail er bevaret. Prøv igen om lidt.",
  service:
    "Tilmeldingen kunne ikke bekræftes lige nu. Din e-mail er bevaret. Prøv igen om lidt.",
  network:
    "Vi kunne ikke få svar. Din e-mail er bevaret. Kontrollér forbindelsen og prøv igen.",
};

export function focusAccessForm() {
  const section = document.getElementById("adgang");
  const target = document.getElementById("access-email") ?? section;
  target?.focus({ preventScroll: true });
  section?.scrollIntoView({
    block: "center",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}

export default function AccessForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<AccessState>({ type: "idle" });
  const [shareMessage, setShareMessage] = useState("");
  const [showShareLink, setShowShareLink] = useState(false);
  const inFlight = useRef(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.type === "success")
      successRef.current?.focus({ preventScroll: true });
    if (state.type !== "error") return;
    if (state.reason === "email") emailRef.current?.focus();
    if (state.reason === "consent") consentRef.current?.focus();
  }, [state]);

  function fail(reason: AccessError) {
    setState({ type: "error", reason, message: errorMessages[reason] });
    trackMarketingEvent("error", { reason });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || state.type === "success") return;
    trackMarketingEvent("attempt");
    const submittedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(submittedEmail) || submittedEmail.length > 180)
      return fail("email");
    if (!consent) return fail("consent");

    inFlight.current = true;
    setState({ type: "submitting" });
    const result = await requestAccess({
      email: submittedEmail,
      consent,
      website,
      source: `${window.location.origin}${window.location.pathname}`,
    });
    inFlight.current = false;
    if (!result.ok) return fail(result.reason);
    setState({ type: "success", email: submittedEmail });
    trackMarketingEvent("confirmed");
  }

  async function share() {
    const nativeShare =
      typeof navigator.share === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    trackMarketingEvent("share_attempt", {
      method: nativeShare ? "native" : "copy",
    });
    setShareMessage("");
    setShowShareLink(false);
    if (nativeShare) {
      try {
        await navigator.share({
          title: "Træningsmester — Træn videre fra sidste gang.",
          url: siteUrl,
        });
        // Resolving Web Share does not prove that another person received the link.
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setShareMessage(
          "Delingsmenuen kunne ikke åbnes. Du kan kopiere linket her:",
        );
        setShowShareLink(true);
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(siteUrl);
      setShareMessage("Linket er kopieret.");
    } catch {
      setShareMessage("Kopiér linket her:");
      setShowShareLink(true);
    }
  }

  const error = state.type === "error" ? state : null;
  const submitting = state.type === "submitting";

  return (
    <section
      className="access-form"
      id="adgang"
      tabIndex={-1}
      aria-label="Få besked om adgang"
    >
      {state.type === "success" ? (
        <div className="access-success">
          <div>
            <h2
              ref={successRef}
              tabIndex={-1}
              aria-describedby="access-success-description"
            >
              Du er skrevet op.
            </h2>
            <p id="access-success-description">
              Vi skriver til <strong>{state.email}</strong>, når der er nyt om
              adgang.
            </p>
          </div>
          <button className="access-share" type="button" onClick={share}>
            Del Træningsmester <span aria-hidden="true">↗</span>
          </button>
          <p className="access-share-status" role="status">
            {shareMessage}
          </p>
          {showShareLink && (
            <a className="access-share-link" href={siteUrl}>
              {siteUrl}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={submit} noValidate aria-busy={submitting}>
          <p className="access-intro">
            Træningsmester er under udvikling. Skriv dig op, og få besked om
            adgang.
          </p>
          <label className="access-label" htmlFor="access-email">
            Din e-mail
          </label>
          <div className="access-input-row">
            <input
              ref={emailRef}
              className="access-email"
              id="access-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={180}
              placeholder="navn@eksempel.dk"
              value={email}
              readOnly={submitting}
              required
              aria-invalid={error?.reason === "email"}
              aria-describedby={
                error && error.reason !== "consent"
                  ? "access-error access-support"
                  : "access-support"
              }
              onChange={(event) => {
                setEmail(event.target.value);
                if (error?.reason !== "consent") setState({ type: "idle" });
              }}
            />
            <button
              className="access-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Sender…" : "Få besked om adgang"}
              <span aria-hidden="true">{submitting ? "" : "↗"}</span>
            </button>
          </div>
          {error && error.reason !== "consent" && (
            <p className="access-error" id="access-error" role="status">
              {error.message}
            </p>
          )}
          <label className="access-consent" htmlFor="access-consent">
            <input
              ref={consentRef}
              id="access-consent"
              name="consent"
              type="checkbox"
              checked={consent}
              disabled={submitting}
              required
              aria-invalid={error?.reason === "consent"}
              aria-describedby={
                error?.reason === "consent" ? "access-consent-error" : undefined
              }
              onChange={(event) => {
                setConsent(event.target.checked);
                if (error?.reason === "consent") setState({ type: "idle" });
              }}
            />
            <span>
              Jeg giver KRISTENSON (CVR 40679456) samtykke til at sende mig
              e-mails om Træningsmesters lancering og adgangsrunder. Jeg kan
              altid afmelde mig gratis via linket i mails.
            </span>
          </label>
          {error?.reason === "consent" && (
            <p className="access-error" id="access-consent-error" role="status">
              {error.message}
            </p>
          )}
          <p className="access-support" id="access-support">
            Vi skriver, når der er nyt om adgang. Du kan afmelde dig igen.
          </p>
          <a className="access-privacy" href="/privatliv">
            Se privatlivspolitikken
          </a>
          <div hidden inert aria-hidden="true">
            <label htmlFor="access-website">Lad dette felt stå tomt</label>
            <input
              id="access-website"
              name="website"
              type="text"
              value={website}
              tabIndex={-1}
              autoComplete="off"
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
          <span className="mk-sr-only" role="status">
            {submitting ? "Din tilmelding sendes." : ""}
          </span>
        </form>
      )}
    </section>
  );
}
