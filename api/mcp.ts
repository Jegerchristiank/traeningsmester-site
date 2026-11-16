import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { authorize } from './_lib/mcp/authorization.js';
import { config as settings } from './_lib/mcp/config.js';
import { tools } from './_lib/mcp/tools.js';
import { body, failure, json, type Request, type Response } from './_lib/mcp/http.js';
import { db } from './_lib/mcp/database.js';
import { cookieSign } from './_lib/mcp/crypto.js';
import { parseCsvArchive } from './_lib/mcp/transfer-files.js';
import { randomUUID } from 'node:crypto';
export const config = { api: { bodyParser: false }, maxDuration: 60 };
export default async function mcp(req: Request, res: Response) {
  try {
    const c = settings();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version, MCP-Session-Id, Mcp-Method, Mcp-Name, Mcp-Client-Info, Mcp-Client-Capabilities');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate, MCP-Protocol-Version');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    if (req.headers.origin && ![c.origin, 'https://chatgpt.com', 'https://claude.ai'].includes(req.headers.origin)) { json(res, 403, { error: 'origin_denied' }); return; }
    const parsed = req.method === 'POST' ? await body(req, 2 * 1024 * 1024) : undefined;
    const discovery = parsed && ['initialize','notifications/initialized','server/discover','tools/list','ping'].includes(String(parsed.method));
    const auth = discovery ? undefined : await authorize(req);
    const server = new McpServer({ name: 'traeningsmester', title: 'Træningsmester', version: '1.0.0',
      description: 'Plan your training, record workouts and follow your progress with your Træningsmester account.',
      websiteUrl: `${c.origin}/ai/help`, icons: [{ src: `${c.origin}/brand/tm-logo-mark.png`, mimeType: 'image/png', sizes: ['1024x1024'] }],
    }, { instructions: 'Manage only this connected account’s synchronized training data. Preserve explicit units and revisions. Writes need a stable operationId UUID; retry the same operation after an unknown outcome. Never claim phone-only drafts are included. Complete plans do not activate automatically. Workout control transfer must be acknowledged by the current writer; an offline phone cannot be taken over.' });
    for (const tool of tools) {
      server.registerTool(tool.name, { title: tool.title, description: tool.description, inputSchema: tool.schema,
        _meta: { securitySchemes: [{ type:'oauth2',scopes:[tool.scope] }] },
        annotations: { readOnlyHint: !tool.write, destructiveHint: tool.destructive ?? false, idempotentHint: true, openWorldHint: false } }, async (input) => {
        if (!auth) return { isError:true,_meta:{'mcp/www_authenticate':[`Bearer resource_metadata="${c.origin}/.well-known/oauth-protected-resource/mcp"`]},content:[{type:'text',text:'Connect your Træningsmester account before using training tools.'}] };
        if (!auth.scopes.includes(tool.scope)) return { isError: true, content: [{ type: 'text', text: JSON.stringify({ schemaVersion: 1, error: { code: 'insufficient_scope', requiredScope: tool.scope } }) }] };
        const started = Date.now(); const correlationId = randomUUID();
        try {
          const normalized: Record<string, unknown> = { ...input };
          if (tool.name === 'import_training_data' || tool.name === 'validate_training_import') {
            if (!!normalized.document === !!normalized.csvArchiveBase64) throw Object.assign(new Error('exactly_one_import_format'),{code:'22023'});
            if (typeof normalized.csvArchiveBase64 === 'string') {
              try { normalized.document = parseCsvArchive(Buffer.from(normalized.csvArchiveBase64, 'base64')); } catch { throw Object.assign(new Error('invalid_csv_archive'),{code:'22023'}); }
              delete normalized.csvArchiveBase64;
            }
          }
          let value = await db<Record<string, unknown>>('mcp.invoke', [auth.grantId, tool.name, normalized]);
          let job:Record<string,unknown>|undefined;
          if (['export_training_data','import_training_data','get_job'].includes(tool.name)) {
            const jobId = value.jobId ?? value.id ?? (value.job as { id?: string } | undefined)?.id;
            await db('mcp.run_jobs',[1]);
            if (typeof jobId === 'string') job = await db<Record<string, unknown>>('mcp.invoke',[auth.grantId,'get_job',{jobId}]);
            if(job)value=tool.name==='get_job'?job:{...value,operationReceipt:value,job};
          }
          if ((tool.name === 'export_training_data' || tool.name === 'get_job') && (job?.kind ?? value.kind)==='export') {
            const jobId = job?.id ?? value.jobId ?? value.id;
            if (typeof jobId === 'string') value.downloadUrl = `${c.origin}/api/mcp-download?ticket=${encodeURIComponent(cookieSign({ grantId: auth.grantId, jobId, expires: Date.now() + 300_000 }))}`;
          }
          console.info(JSON.stringify({ operation: tool.name, outcome: 'ok', correlationId, durationMs: Date.now() - started }));
          return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value };
        } catch (error) {
          const e = error as { code?: string }; const codes: Record<string, string> = { '42501': 'access_denied', '22023': 'invalid_input', '22P02': 'invalid_input', '40001': 'stale_revision', '55006': 'session_busy', 'P0002': 'not_found', '57014': 'unknown_outcome', '55P03': 'operation_busy' };
          const code = codes[e.code || ''] || 'unknown_outcome'; console.info(JSON.stringify({ operation: tool.name, outcome: code, correlationId, durationMs: Date.now() - started }));
          return { isError: true, content: [{ type: 'text', text: JSON.stringify({ schemaVersion: 1, error: { code, correlationId, operationId: 'operationId' in input ? input.operationId : undefined, retrySameOperation: code === 'unknown_outcome' || code === 'operation_busy' } }) }] };
        }
      });
    }
    const handler = createMcpHandler(() => server);
    try { await toNodeHandler(handler)(req, res, parsed); } finally { await handler.close(); }
  } catch (error) {
    if ((error as { status?: number }).status === 401) res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${settings().origin}/.well-known/oauth-protected-resource/mcp"`);
    failure(res, error, 'mcp');
  }
}
