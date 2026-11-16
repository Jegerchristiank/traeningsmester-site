# Træningsmester directory package

This is the portable, tool-only directory package for the existing Træningsmester training connection. Package version **1.0.0** is independent of the native app version. It connects to the hosted service; it contains no server implementation, credentials, skills or lifecycle hooks.

## Package layout

```text
traeningsmester/
├── plugin.json
├── mcp.json
├── README.md
├── assets/
│   └── logo.png
└── scripts/
    └── package.py
```

`plugin.json` uses Agent Plugins 1.0.0 identity fields and the documented `extensions.com.openai` listing, review and publication fields. `mcp.json` declares one Streamable HTTP server with the OpenAI OAuth profile. Both manifests belong at the ZIP root.

The English base listing has three distinct starter prompts. The `da-DK` translation supplies a Danish subtitle and description. OpenAI currently documents that imported translations are retained in the bundle but do not yet necessarily change the text shown in the Directory or listing APIs.

The logo is the supplied Træningsmester brand asset. Both icon fields reference the same square PNG. The existing site brand color is `#0753B8`; no separate dark variant is declared.

## Connection

- MCP resource: `https://www.traeningsmester.dk/mcp`
- Authorization-server discovery: `https://www.traeningsmester.dk/.well-known/oauth-authorization-server/oauth`
- Registration endpoint, confirmed through that discovery document: `https://www.traeningsmester.dk/oauth/reg`
- OAuth client registration: Dynamic Client Registration (`dcr`). No static client identity, secret, token header or API key is bundled.

The seven default scopes are `training:read`, `plans:write`, `exercises:write`, `workouts:write`, `history:write`, `preferences:write` and `data:transfer`. The user authorizes the requested account access through Træningsmester. Existing product entitlements and server authorization continue to apply; client-side action confirmations may also apply. Connection management and revocation remain in Træningsmester.

The package advertises supported training operations only. It does not start Træningsmester’s native AI generation, OCR or image/document-import pipelines. An assistant can still interpret user-provided content and prepare supported structured data. Social messages, payments, account deletion, administration and external integration settings are outside this connection.

## Review material and remaining portal work

The manifest contains **five proposed positive cases and three proposed negative cases**. Their tool names match the existing 34-tool API. These are test proposals, not a claim that this particular review script has been executed in ChatGPT or Codex.

The ZIP deliberately omits `demo_recording_url`: add it only when a real reviewer-accessible walkthrough exists. Review-account credentials, access arrangements and execution evidence belong in the private submission material, never in this directory or ZIP.

Before submission, the submission owner still needs to:

- Confirm the selected publishing identity in the portal. `KRISTENSON` identifies the publisher in the package; it is not a claim that the portal has verified that identity.
- Confirm that **Healthcare** is the exact available dashboard category. It is the proposed category; the public documentation does not publish a complete category enum.
- Complete the portal’s actual domain-verification challenge, OAuth connection and tool scan; resolve any findings.
- Supply the private review account and real demo recording, and record the observed outcomes of the proposed cases after release-owner checks are complete.
- Choose publication availability in the dashboard. This package does not set a country allowlist or claim approval, submission or publication.

A local package check does not prove portal acceptance, runtime behavior or catalogue publication.

## Validate and build

Python 3 standard-library tooling is sufficient; no dependencies are installed. From this directory:

```sh
python3 scripts/package.py validate
python3 scripts/package.py build --output /absolute/path/outside-git/traeningsmester-plugin-1.0.0.zip
```

Optionally compare the test-case tool names with the owning site's tool registry:

```sh
python3 scripts/package.py validate --tools-file ../../api/_lib/mcp/tools.ts
```

The validator checks the selected manifest contract, metadata limits, HTTPS destinations, OAuth configuration, exact scope set, five/three case counts, known tool names, packaged paths, PNG dimensions and unsafe credential fields. It reports missing external submission material separately. It is a focused contract validator, not a general JSON Schema engine or a portal scan.

The build includes only the files shown above. ZIP member names are sorted; timestamps and permissions are fixed; entries use uncompressed ZIP storage so output is independent of compressor versions. The command emits SHA-256 hashes for the manifests, package members and ZIP. Rebuilding unchanged inputs produces identical bytes. The destination must be outside a Git checkout, cache and release-artifact directories. No ZIP is written into this source repository.

### OpenAI profile compatibility

The current OpenAI packaging documentation explicitly places OAuth configuration at `mcpServers.<name>.extensions.com.openai.auth`. The published Agent Plugins 1.0.0 MCP base schema currently gives the server object `additionalProperties: false` without defining `extensions`. This package follows the documented OpenAI OAuth profile; it does not claim validation against that unextended base schema. Confirm the actual imported authentication settings in the portal and use its findings as the final import evidence.

## Format references

- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins/)
- [OpenAI plugin submission and metadata reference](https://developers.openai.com/plugins/deploy/submission/)
- [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines/)
- [Agent Plugins manifest schema 1.0.0](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
- [Agent Plugins MCP base schema 1.0.0](https://agent-plugins.org/schemas/1.0.0/mcp.schema.json)
