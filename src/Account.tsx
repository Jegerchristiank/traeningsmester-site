import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AccountForm from "./components/AccountForm";
import { ArrowMark, ServiceShell } from "./components/ServiceLayout";
import { getSupabaseClient } from "./supabaseClient";
import "./account.css";

// Older releases cached a shared copy and an account-specific copy on this device.
// Keep the explicit logout cleanup without reading or migrating those drafts.
function clearLegacyCacheOnLogout(email: string | undefined) {
  const key = "tm-react-workbench-state-v1";
  try {
    window.localStorage.removeItem(key);
    if (email) {
      const accountKey = `${key}:${email.trim().toLowerCase()}`;
      window.localStorage.removeItem(accountKey);
      window.localStorage.removeItem(`${accountKey}:remote-verified`);
    }
  } catch {
    // Storage may be unavailable in a restricted browser.
  }
}

export default function Account() {
  const client = getSupabaseClient();
  const [session, setSession] = useState<Session | null | undefined>(client ? undefined : null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client) return;
    // INITIAL_SESSION also covers stored sessions and email confirmation returns.
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setError("");
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  async function logout() {
    if (!client || !session || signingOut) return;
    const email = session.user.email;
    setSigningOut(true);
    setError("");
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      clearLegacyCacheOnLogout(email);
    } catch {
      setError("Du kunne ikke logges ud. Prøv igen.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ServiceShell area="Konto" className="account-page">
      {session === undefined ? (
        <p className="account-loading" role="status">Henter din konto…</p>
      ) : session ? (
        <div className="account-desk">
          <header className="account-identity">
            <h1>Din konto</h1>
            <p className="service-lead">Her kan du se og styre forbindelsen mellem din konto og de værktøjer, du bruger.</p>
            <div className="account-owner">
              <p className="service-caption">Logget ind som</p>
              <strong>{session.user.email}</strong>
              <button className="account-text-action" disabled={signingOut} onClick={logout}>
                {signingOut ? "Logger ud…" : "Log ud"}
              </button>
              {error && <p className="account-error" role="alert">{error}</p>}
            </div>
          </header>
          <nav className="account-tools" aria-label="Værktøjer">
            <h2>Værktøjer</h2>
            <div><a href="/ai/connections">Forbundne AI-assistenter <ArrowMark /></a>
              <p>Se rettigheder, og træk en adgang tilbage.</p></div>
            <div><a href="/ai/help">Sådan forbinder du en assistent <ArrowMark /></a>
              <p>Find serveradressen og vejledningen til din assistent.</p></div>
          </nav>
        </div>
      ) : (
        <div className="account-desk account-login-layout">
          <div className="account-login">
            <AccountForm client={client} />
          </div>
          <nav className="account-tools" aria-labelledby="assistentvejledning">
            <h2 id="assistentvejledning">Forbind din assistent</h2>
            <p className="account-tools-intro">Vælg den vejledning, der passer til det værktøj, du bruger.</p>
            <a href="/ai/help#chatgpt">ChatGPT <ArrowMark /></a>
            <a href="/ai/help#claude">Claude <ArrowMark /></a>
            <a href="/ai/help#codex">Codex <ArrowMark /></a>
          </nav>
        </div>
      )}
    </ServiceShell>
  );
}
