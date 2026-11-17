import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AccountForm from "./components/AccountForm";
import SiteBrand from "./components/SiteBrand";
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
    <div className="training-site account-page">
      <header className="story-header">
        <SiteBrand />
        <a className="account-support" href="/support">Support</a>
      </header>
      <main className="account-content">
        {session === undefined ? (
          <p role="status">Henter din konto…</p>
        ) : session ? (
          <>
            <h1>Din konto</h1>
            <p className="account-intro">Logget ind som <strong>{session.user.email}</strong></p>
            <nav className="account-tools" aria-label="Værktøjer">
              <a href="/ai/connections">Forbundne AI-assistenter <span aria-hidden="true">→</span></a>
              <a href="/ai/help">Sådan forbinder du en assistent <span aria-hidden="true">→</span></a>
            </nav>
            {error && <p className="account-error" role="alert">{error}</p>}
            <button className="account-text-action" disabled={signingOut} onClick={logout}>
              {signingOut ? "Logger ud…" : "Log ud"}
            </button>
          </>
        ) : (
          <AccountForm client={client} />
        )}
      </main>
      <footer className="account-footer">
        <a href="/privatliv">Privatliv</a>
        <a href="/vilkaar">Vilkår</a>
      </footer>
    </div>
  );
}
