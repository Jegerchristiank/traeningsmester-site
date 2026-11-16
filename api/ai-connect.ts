import { provider } from './_lib/mcp/provider.js';
import { config as settings, MCP_SCOPES } from './_lib/mcp/config.js';
import { db, hash, limit, serialized } from './_lib/mcp/database.js';
import { cookieRead, cookieSign, nonce } from './_lib/mcp/crypto.js';
import { body, failure, identity, json, redirect, sameOrigin, type Request, type Response } from './_lib/mcp/http.js';
export const config = { api: { bodyParser: false } };
type Binding = { uid: string; challenge: string; csrf: string; expires: number };
const challengeValue = (v: unknown) => { if (typeof v !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(v)) throw Object.assign(new Error('invalid_challenge'), { status: 400 }); return v; };
function binding(req: Request) { const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(p => p.trim().split('='))); return cookieRead<Binding>(cookies.tm_ai_binding); }

export default async function connect(req: Request, res: Response) {
  try {
    sameOrigin(req); const c = settings(); const url = new URL(req.url || '/', c.origin); const action = url.searchParams.get('action');
    if (req.method === 'GET' && url.searchParams.has('interaction')) {
      const interaction = await provider().interactionDetails(req, res);
      if (interaction.uid !== url.searchParams.get('interaction')) throw Object.assign(new Error('interaction_mismatch'), { status: 403 });
      redirect(res, `/ai/connect?uid=${encodeURIComponent(interaction.uid)}`); return;
    }
    if (req.method === 'GET' && action === 'interaction') {
      const interaction = await provider().interactionDetails(req, res);
      if (interaction.uid !== url.searchParams.get('uid')) throw Object.assign(new Error('interaction_mismatch'), { status: 403 });
      if (interaction.result?.consent || interaction.result?.error) { json(res,200,{status:'finished',returnTo:interaction.returnTo}); return; }
      const client = await provider().Client.find(String(interaction.params.client_id));
      if (!client) throw Object.assign(new Error('client_missing'), { status: 404 });
      const scopes = String(interaction.params.scope || '').split(' ').filter((s): s is typeof MCP_SCOPES[number] => MCP_SCOPES.includes(s as typeof MCP_SCOPES[number]));
      let b = binding(req);
      if (!b || b.uid !== interaction.uid || b.expires <= Date.now()) {
        b = { uid: interaction.uid, challenge: nonce(), csrf: nonce(), expires: Date.now() + 300_000 };
        await db('mcp.challenge_create', [hash(b.challenge), b.uid, client.clientId, client.clientName || 'AI-assistent', scopes]);
        res.setHeader('Set-Cookie', `tm_ai_binding=${cookieSign(b)}; Path=/api/ai-connect; Max-Age=300; HttpOnly; SameSite=Lax${c.origin.startsWith('https:') ? '; Secure' : ''}`);
      }
      const state = await db<Record<string, unknown>>('mcp.challenge_read', [hash(b.challenge)]);
      json(res, 200, { ...state, uid: b.uid, challenge: b.challenge, csrf: b.csrf, deepLink: `traeningsmester://ai-connect?challenge=${b.challenge}` }); return;
    }
    if (req.method === 'POST' && action === 'finish') {
      const input = await body(req, 4096); const b = binding(req);
      if (!b || b.expires <= Date.now() || input.csrf !== b.csrf || input.uid !== b.uid) throw Object.assign(new Error('browser_binding_invalid'), { status: 403 });
      const response = await serialized(`approval:${b.uid}`, async () => {
        const p = provider(); const interaction = await p.interactionDetails(req, res);
        if (interaction.uid !== b.uid) throw Object.assign(new Error('interaction_mismatch'), { status: 403 });
        const result = await db<{ decision: 'approve' | 'deny'; userId: string; scopes: string[] }>('mcp.challenge_consume', [hash(b.challenge), b.uid]);
        if (result.decision === 'deny') { const returnTo = await p.interactionResult(req, res, { error: 'access_denied', error_description: 'Brugeren afviste forbindelsen.' }, { mergeWithLastSubmission: false }); return { returnTo }; }
        const grant = new p.Grant({ accountId: result.userId, clientId: String(interaction.params.client_id) });
        grant.addOIDCScope(String(interaction.params.scope || ''));
        grant.addResourceScope(c.resource, result.scopes.join(' '));
        const grantId = await grant.save(); const client = await p.Client.find(String(interaction.params.client_id));
        await db('mcp.connection_create', [grantId, result.userId, String(interaction.params.client_id), client?.clientName || 'AI-assistent', result.scopes]);
        const returnTo = await p.interactionResult(req, res, { login: { accountId: result.userId }, consent: { grantId } }, { mergeWithLastSubmission: false });
        return { returnTo };
      }); json(res, 200, response); return;
    }
    const userId = await identity(req); await limit(`account-connect:${userId}`, 120);
    if (req.method === 'GET' && action === 'connections') { json(res, 200, await db('mcp.connection_list', [userId])); return; }
    if (req.method === 'GET' && url.searchParams.has('challenge')) { const challenge = challengeValue(url.searchParams.get('challenge')); json(res, 200, { ...await db<Record<string, unknown>>('mcp.challenge_read', [hash(challenge)]), challenge }); return; }
    if (req.method === 'POST' && ['approve', 'deny', 'revoke'].includes(action || '')) {
      const input = await body(req, 4096);
      if (action === 'revoke') { if (typeof input.connectionId !== 'string' || input.connectionId.length > 256) throw Object.assign(new Error('invalid_connection'), { status: 400 }); json(res, 200, await db('mcp.connection_revoke', [userId, input.connectionId])); }
      else json(res, 200, await db('mcp.challenge_decide', [hash(challengeValue(input.challenge)), userId, action === 'approve' ? 'approve' : 'deny']));
      return;
    }
    json(res, 405, { error: { code: 'method_not_allowed' } });
  } catch (error) { failure(res, error, 'connection'); }
}
