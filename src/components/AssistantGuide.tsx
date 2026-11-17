import { useRef, useState } from "react";
import { MCP_RESOURCE, MCP_SCOPES } from "../../api/_lib/mcp/config";
import { ArrowMark, Contents } from "./ServiceLayout";

const chapters = [
  { id: "chatgpt", title: "ChatGPT" },
  { id: "claude", title: "Claude" },
  { id: "codex", title: "Codex" },
  { id: "adgang", title: "Rettigheder og data" },
  { id: "naeste-traeningsdag", title: "Næste træningsdag" },
];

function ServerAddress() {
  const input = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(MCP_RESOURCE);
      setNotice("Serveradressen er kopieret.");
    } catch {
      input.current?.focus();
      input.current?.select();
      setNotice("Adressen er markeret. Brug din enheds kopifunktion.");
    }
  }

  return (
    <div className="ai-endpoint">
      <label htmlFor="mcp-address" className="service-caption">MCP-serveradresse</label>
      <div>
        <input id="mcp-address" ref={input} type="text" readOnly value={MCP_RESOURCE} spellCheck={false} />
        <button type="button" onClick={() => void copy()}>Kopiér adresse</button>
      </div>
      <p role="status">{notice}</p>
    </div>
  );
}

export default function AssistantGuide() {
  return (
    <>
      <header className="ai-guide-title">
        <div><h1>Forbind din <em>AI-assistent</em></h1>
          <p className="service-lead">Brug din Træningsmester-konto i ChatGPT, Claude eller Codex. Kopiér serveradressen, og følg trinnene for din assistent.</p>
        </div>
        <a className="service-link" href="/ai/connections">Dine forbindelser <ArrowMark /></a>
      </header>
      <div className="ai-guide-grid">
        <Contents entries={chapters} title="I vejledningen" />
        <article className="ai-guidelines" aria-label="Tilslutningsvejledning">
          <ServerAddress />
          <section aria-labelledby="chatgpt">
            <h2 id="chatgpt" tabIndex={-1}>ChatGPT</h2>
            <ol>
              <li>Åbn <strong>Plugins</strong> i ChatGPT på web. Vælg plus og derefter <strong>Add custom MCP server</strong>.</li>
              <li>Angiv Træningsmester som navn, indsæt serveradressen, og vælg OAuth som godkendelse.</li>
              <li>Læs tilladelserne, og godkend forbindelsen med din Træningsmester-konto. Vælg derefter forbindelsen i samtalen.</li>
            </ol>
            <p>Adgangen afhænger af din ChatGPT-plan og arbejdsområdets tilladelser. <a href="https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt" target="_blank" rel="noreferrer">Se OpenAI’s aktuelle krav</a>.</p>
          </section>
          <section aria-labelledby="claude">
            <h2 id="claude" tabIndex={-1}>Claude</h2>
            <ol>
              <li>Gå til <strong>Settings → Customize → Connectors</strong>. Vælg <strong>Add connector</strong> og derefter <strong>Add custom connector</strong>.</li>
              <li>Indsæt serveradressen. Vælg <strong>Sign in now</strong> og <strong>Register automatically (DCR)</strong>.</li>
              <li>Godkend din Træningsmester-konto, og aktivér forbindelsen i samtalen.</li>
            </ol>
            <p><a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" target="_blank" rel="noreferrer">Se Claudes tilslutningsvejledning</a>.</p>
          </section>
          <section aria-labelledby="codex">
            <h2 id="codex" tabIndex={-1}>Codex</h2>
            <p>Tilføj serveren i Codex’ MCP-indstillinger. Du kan også køre de to kommandoer i terminalen. Den anden kommando beder om alle Træningsmesters rettigheder.</p>
            <pre tabIndex={0} aria-label="Kommandoer til Codex"><code>{`codex mcp add traeningsmester --url ${MCP_RESOURCE}\ncodex mcp login traeningsmester --scopes ${MCP_SCOPES.join(",")}`}</code></pre>
            <p>Godkend kontoen i browseren. Åbn en ny Codex-samtale for at indlæse værktøjerne.</p>
          </section>
          <section aria-labelledby="adgang">
            <h2 id="adgang" tabIndex={-1}>Rettigheder og data</h2>
            <p>Ved tilslutning ser du de rettigheder, assistenten beder om. Med skriverettigheder kan den ændre og slette de tilknyttede træningsdata uden yderligere godkendelse fra Træningsmester. Assistenten kan selv bede om din bekræftelse.</p>
            <p>Appens gratis- og premiumregler gælder også her. Kladder fra en offline telefon bliver tilgængelige for assistenten, når de er synkroniseret.</p>
            <p>Du kan til enhver tid tilbagekalde adgang under <a href="/ai/connections">dine forbindelser</a> eller under <strong>Forbundne AI-assistenter</strong> i mobilappen.</p>
          </section>
          <section aria-labelledby="naeste-traeningsdag">
            <h2 id="naeste-traeningsdag" tabIndex={-1}>Næste træningsdag</h2>
            <p>I et almindeligt program kan du bede assistenten om at afslutte et pas og gå til næste træningsdag, eller om at blive på den samme dag. Assistenten kontrollerer den gemte træning og følger appens regler for fremdrift.</p>
          </section>
        </article>
      </div>
    </>
  );
}
