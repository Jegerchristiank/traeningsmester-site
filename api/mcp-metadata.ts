import { config as settings, MCP_SCOPES } from './_lib/mcp/config.js';
import { json, failure, type Request, type Response } from './_lib/mcp/http.js';
export default function metadata(req: Request, res: Response) {
  try {
    const c = settings(); res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'GET' && req.method !== 'OPTIONS') { json(res, 405, {}); return; }
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    const url = new URL(req.url || '/', c.origin);
    if (url.searchParams.get('kind') === 'authorization') {
      json(res, 200, { issuer: c.issuer, authorization_endpoint: `${c.issuer}/auth`, token_endpoint: `${c.issuer}/token`, registration_endpoint: `${c.issuer}/reg`, revocation_endpoint: `${c.issuer}/token/revocation`, jwks_uri: `${c.issuer}/jwks`, response_types_supported: ['code'], grant_types_supported: ['authorization_code','refresh_token'], token_endpoint_auth_methods_supported: ['none','client_secret_post','client_secret_basic'], code_challenge_methods_supported: ['S256'], scopes_supported: [...MCP_SCOPES, 'offline_access'] });
    } else json(res, 200, { resource: c.resource, authorization_servers: [c.issuer], scopes_supported: MCP_SCOPES, bearer_methods_supported: ['header'], resource_name: 'Træningsmester', resource_documentation: `${c.origin}/ai/help` });
  } catch (error) { failure(res, error, 'discovery'); }
}
