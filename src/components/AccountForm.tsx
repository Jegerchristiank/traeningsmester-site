import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Props = {
  client: SupabaseClient | null;
  inAssistant?: boolean;
};

export default function AccountForm({ client, inAssistant = false }: Props) {
  const [mode, setMode] = useState<"login" | "signup" | "confirm">("login");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signup = mode === "signup";
  const Heading = inAssistant ? "h2" : "h1";

  function changeMode(next: "login" | "signup") {
    setMode(next);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const fields = new FormData(event.currentTarget);
    const credentials = {
      email: email.trim().toLowerCase(),
      password: String(fields.get("password") ?? ""),
    };
    setBusy(true);
    setError("");
    try {
      if (signup) {
        const name = String(fields.get("name") ?? "").trim();
        if (name.length < 2 || !fields.has("consent")) {
          setError("Skriv dit navn og tag stilling til samtykket.");
          return;
        }
        const { data, error } = await client.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: new URL("/app", window.location.origin).href,
            data: {
              name,
              health_data_consent: true,
              health_data_consent_version: "health_activity_processing_v1",
              health_data_consented_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setEmail(credentials.email);
          setMode("confirm");
        }
      } else {
        const { error } = await client.auth.signInWithPassword(credentials);
        if (error) throw error;
      }
    } catch (cause) {
      const code = cause && typeof cause === "object" && "code" in cause ? cause.code : null;
      if (code === "invalid_credentials") setError("E-mail eller adgangskode er forkert.");
      else if (code === "email_not_confirmed") setError("Bekræft din e-mail via linket i din indbakke, og log ind igen.");
      else if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") setError("Der har været flere forsøg. Vent lidt og prøv igen.");
      else setError(signup ? "Kontoen kunne ikke oprettes. Prøv igen." : "Du kunne ikke logges ind. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "confirm") {
    return (
      <>
        <Heading>Tjek din indbakke</Heading>
        <p className="account-intro" role="status">
          Hvis <strong>{email}</strong> er en ny adresse, får du en mail med et link til at bekræfte kontoen.
        </p>
        <button className="account-text-action" onClick={() => changeMode("login")}>Tilbage til login</button>
      </>
    );
  }

  return (
    <>
      <Heading>{signup ? "Opret konto" : inAssistant ? "Log ind på Træningsmester" : "Log ind"}</Heading>
      {!inAssistant && (
        <p className="account-intro">
          {signup ? "Brug samme konto i mobilappen og i dine tilsluttede værktøjer."
            : "Brug din Træningsmester-konto til at forbinde en assistent eller administrere dens adgang."}
        </p>
      )}
      <form key={mode} className={inAssistant ? "ai-login" : "account-form"} onSubmit={submit}>
        {signup && (
          <label>Navn<input name="name" autoComplete="name" minLength={2} required /></label>
        )}
        <label>
          E-mail
          <input name="email" type="email" autoComplete={signup ? "email" : "username"} autoCapitalize="none"
            spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Adgangskode
          <input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"}
            minLength={signup ? 6 : undefined} required />
        </label>
        {signup && (
          <label className="account-consent">
            <input type="checkbox" name="consent" required />
            <span>
              Jeg giver udtrykkeligt samtykke til, at Træningsmester behandler de oplysninger om træning,
              kropsvægt og aktivitet, som jeg selv vælger at tilføje, for at levere logbog og progression.
              Jeg kan trække samtykket tilbage. Læs <a href="/privatliv" target="_blank" rel="noreferrer">privatlivspolitikken</a>.
            </span>
          </label>
        )}
        {!client && <p role="status">Login er midlertidigt utilgængeligt. Prøv igen senere.</p>}
        {error && <p className={inAssistant ? "ai-error" : "account-error"} role="alert">{error}</p>}
        <button className={inAssistant ? "ai-primary" : "account-primary"} type="submit" disabled={!client || busy}>
          {busy ? (signup ? "Opretter konto…" : "Logger ind…") : (signup ? "Opret konto" : "Log ind")}
        </button>
      </form>
      {!inAssistant && (
        <p className="account-alternative">
          {signup ? "Har du allerede en konto?" : "Har du ingen konto?"}{" "}
          <button className="account-text-action" type="button" disabled={busy}
            onClick={() => changeMode(signup ? "login" : "signup")}>{signup ? "Log ind" : "Opret konto"}</button>
        </p>
      )}
    </>
  );
}
