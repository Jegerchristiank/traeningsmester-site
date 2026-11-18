import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";
import AccountForm from "./components/AccountForm";
import { scopeLabels, type TrainingScope } from "../api/_lib/mcp/config";
import { ArrowMark, ServiceShell } from "./components/ServiceLayout";
import AssistantGuide from "./components/AssistantGuide";
import "./account.css";
import "./ai-assistants.css";

type Connection = {
  id: string;
  clientName: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
};

type Interaction = {
  uid: string;
  challenge: string;
  csrf: string;
  clientName: string;
  scopes: string[];
  expiresAt: string;
  status: string;
  deepLink: string;
  returnTo?: string;
};

const label = (scope: string) => scopeLabels[scope as TrainingScope] || scope;
const date = (value: string | null) => value ? new Date(value).toLocaleString("da-DK") : "Endnu ikke brugt";

export default function AiAssistants() {
  const uid = new URLSearchParams(window.location.search).get("uid");
  const path = window.location.pathname;
  const help = path === "/ai/help" || (path === "/ai/connect" && !uid);
  const client = help ? null : getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const account = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    document.title = help || uid ? "Forbind din AI-assistent · Træningsmester" : "Forbundne AI-assistenter · Træningsmester";
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (meta) meta.content = "noindex, nofollow";
    if (!client) {
      setReady(true);
      return;
    }

    let eventSeen = false;
    let active = true;
    function change(nextSession: Session | null) {
      if (!active) return;
      const nextId = nextSession?.user.id || null;
      if (account.current !== nextId) {
        setConnections(null);
        setError("");
      }
      account.current = nextId;
      setSession(nextSession);
      setReady(true);
    }

    const subscription = client.auth.onAuthStateChange((_event, nextSession) => {
      eventSeen = true;
      change(nextSession);
    });
    void client.auth.getSession().then(({ data }) => {
      if (!eventSeen) change(data.session);
    });
    return () => {
      active = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [client, help, uid]);

  async function api<T>(action: string, method = "GET", payload?: unknown, authenticated = false): Promise<T> {
    const owner = account.current;
    const token = session?.access_token;
    if (authenticated && (!owner || !token)) throw new Error("Log ind på din Træningsmester-konto først.");
    const response = await fetch(`/api/ai-connect?action=${action}`, {
      method, credentials: "same-origin",
      headers: {
        ...(payload ? { "Content-Type": "application/json" } : {}),
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Din session er udløbet. Log ind igen.");
      if (response.status === 429) throw new Error("Der er kommet mange forsøg. Vent lidt og prøv igen.");
      throw new Error("Forbindelsen kunne ikke hentes. Prøv igen eller start forbindelsen fra assistenten på ny.");
    }
    const result = await response.json() as T;
    if (authenticated && account.current !== owner) throw new Error("Kontoen er skiftet. Prøv igen med den aktuelle konto.");
    return result;
  }

  useEffect(() => {
    if (!session || uid || help) return;
    let active = true;
    void api<{ connections: Connection[] }>("connections", "GET", undefined, true).then((data) => {
      if (active) setConnections(data.connections);
    }).catch((cause) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [session?.user.id, uid, help]);

  useEffect(() => {
    if (!uid || help) return;
    const action = `interaction&uid=${encodeURIComponent(uid)}`;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const data = await api<Interaction>(action);
        if (!active) return;
        if (data.status === "finished" && data.returnTo) {
          window.location.assign(data.returnTo);
          return;
        }
        setInteraction(data);
        setError("");
        if (data.status === "approve" || data.status === "deny") {
          const final = await api<{ returnTo: string }>("finish", "POST", { uid: data.uid, csrf: data.csrf });
          if (active) window.location.assign(final.returnTo);
          return;
        }
        timer = setTimeout(poll, 2000);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Forbindelsen kunne ikke godkendes.");
      }
    }
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [uid, help]);

  useEffect(() => {
    const link = interaction?.deepLink;
    if (!link) return;
    let active = true;
    void import("qrcode").then(({ default: QRCode }) => (
      QRCode.toDataURL(link, { width: 224, margin: 2, errorCorrectionLevel: "M" })
    )).then((value) => { if (active) setQr(value); })
      .catch(() => { if (active) setQr(""); });
    return () => { active = false; };
  }, [interaction?.deepLink]);

  async function decide(decision: "approve" | "deny") {
    if (!interaction || busy) return;
    setBusy(true);
    setError("");
    try {
      await api(decision, "POST", { challenge: interaction.challenge }, true);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("revoke", "POST", { connectionId: id }, true);
      const data = await api<{ connections: Connection[] }>("connections", "GET", undefined, true);
      setConnections(data.connections);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  const loginForm = ready && !session && <AccountForm client={client} inAssistant />;
  return (
    <ServiceShell area="Kontoværktøjer" className="ai-page">
      {help ? <AssistantGuide /> : uid ? (
        <>
          <header className="ai-title"><h1>Forbind din AI-assistent</h1>
            <p className="service-lead">Kontrollér navnet og de ønskede rettigheder, før du godkender forbindelsen.</p>
          </header>
          {interaction ? (
            <div className="ai-consent-grid">
              <section className="ai-permissions" aria-labelledby="assistentnavn">
                <p className="service-caption">Anmodning fra</p><h2 id="assistentnavn">{interaction.clientName}</h2>
                <p>Navnet er angivet af assistenten. Den beder om adgang til at gøre følgende på din konto.</p>
                <ul className="ai-scopes">{interaction.scopes.map((scope) => <li key={scope}>{label(scope)}</li>)}</ul>
                <p>Rettigheder til at skrive omfatter ændring og sletning uden en ekstra godkendelse fra Træningsmester. Du kan tilbagekalde forbindelsen senere.</p>
              </section>
              <div className="ai-approval">
                <section>{session ? (
                  <>
                    <h2>Godkend på sitet</h2>
                    <p>Logget ind som <strong>{session.user.email}</strong></p>
                    <div className="ai-decision">
                      <button className="ai-primary" disabled={busy} onClick={() => void decide("approve")}>Giv den viste adgang</button>
                      <button className="ai-secondary" disabled={busy} onClick={() => void decide("deny")}>Afvis forbindelse</button>
                    </div>
                    <button className="account-text-action" disabled={busy} onClick={() => void client?.auth.signOut({ scope: "local" })}>Brug en anden konto</button>
                  </>
                ) : loginForm}</section>
                <section className="ai-mobile-approval">
                  <h2>Godkend i mobilappen</h2>
                  <div className="ai-qr-row">
                    {qr && <img className="ai-qr" src={qr} alt="Scan koden med telefonens kamera for at åbne godkendelsen i Træningsmester" width="224" height="224" />}
                    <div><a className="service-link" href={interaction.deepLink}>Åbn Træningsmester <ArrowMark diagonal /></a>
                      <p>Koden udløber {new Date(interaction.expiresAt).toLocaleTimeString("da-DK")}. Den indeholder ingen adgangskode eller kontotoken.</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : !error && <p role="status">Henter forbindelsen…</p>}
        </>
      ) : (
        <>
          <header className="ai-title"><h1>Forbundne AI-assistenter</h1>
            <p className="service-lead">Se, hvilke assistenter du har givet adgang til din konto, og tilbagekald forbindelsen, når du ønsker det.</p>
          </header>
          <div className="ai-connections-grid">
            <div className="ai-connections-body">
              {loginForm}
              {session && <>
                {connections === null && !error && <p role="status">Henter forbindelser…</p>}
                {connections?.length === 0 && <div className="ai-empty"><h2>Ingen forbindelser</h2>
                  <p>Du har ingen forbundne AI-assistenter endnu.</p>
                  <a className="service-link" href="/ai/help">Se, hvordan du forbinder en assistent <ArrowMark /></a></div>}
                {connections?.map((item) => (
                  <section className="ai-connection" key={item.id}>
                    <p className="service-caption">{item.revokedAt ? "Adgang tilbagekaldt" : new Date(item.expiresAt) < new Date() ? "Adgang udløbet" : "Aktiv forbindelse"}</p>
                    <h2>{item.clientName}</h2>
                    <ul className="ai-scopes">{item.scopes.map((scope) => <li key={scope}>{label(scope)}</li>)}</ul>
                    <dl className="ai-dates">
                      <div><dt>Senest brugt</dt><dd>{date(item.lastUsedAt)}</dd></div>
                      <div><dt>Oprettet</dt><dd>{date(item.createdAt)}</dd></div>
                      <div><dt>Udløber</dt><dd>{date(item.expiresAt)}</dd></div>
                    </dl>
                    {!item.revokedAt && <button className="ai-secondary" disabled={busy} onClick={() => void revoke(item.id)}>Tilbagekald adgang</button>}
                  </section>
                ))}
              </>}
            </div>
            <aside className="ai-connections-aside">
              {session && <div className="ai-owner"><p className="service-caption">Logget ind som</p><strong>{session.user.email}</strong>
                <button className="account-text-action" onClick={() => void client?.auth.signOut({ scope: "local" })}>Log ud</button></div>}
              <a className="service-link" href="/ai/help">Tilslutningsvejledning <ArrowMark /></a>
            </aside>
          </div>
        </>
      )}
      {error && <p className="ai-error ai-feedback" role="alert">{error}</p>}
    </ServiceShell>
  );
}
