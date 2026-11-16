import Provider, { errors, type Configuration } from 'oidc-provider';
import { PostgresAdapter } from './adapter.js';
import { config, MCP_SCOPES } from './config.js';

let instance: Provider | undefined;
export function provider() {
  if (instance) return instance;
  const c = config();
  const configuration: Configuration = {
    adapter: PostgresAdapter,
    clients: [], jwks: c.jwks,
    cookies: { keys: c.cookieKeys, short: { httpOnly: true, sameSite: 'lax', secure: c.origin.startsWith('https:') }, long: { httpOnly: true, sameSite: 'lax', secure: c.origin.startsWith('https:') } },
    scopes: [...MCP_SCOPES, 'offline_access'],
    clientAuthMethods: ['none','client_secret_basic','client_secret_post'],
    claims: { openid: ['sub'] }, responseTypes: ['code'],
    pkce: { required: () => true }, // oidc-provider 9 accepts S256 only.
    features: {
      devInteractions: { enabled: false },
      registration: { enabled: true },
      revocation: { enabled: true },
      userinfo: { enabled: false },
      requestObjects: { enabled: false },
      resourceIndicators: {
        enabled: true, defaultResource: () => c.resource, useGrantedResource: () => true,
        getResourceServerInfo: (_ctx, resource) => {
          if (resource !== c.resource) throw new errors.InvalidTarget();
          return { scope: MCP_SCOPES.join(' '), audience: c.resource, accessTokenFormat: 'opaque', accessTokenTTL: 900 };
        },
      },
    },
    interactions: { url: (_ctx, interaction) => `/api/ai-connect?interaction=${encodeURIComponent(interaction.uid)}` },
    findAccount: (_ctx, accountId) => ({ accountId, claims: () => ({ sub: accountId }) }),
    issueRefreshToken: (_ctx, client) => client.grantTypeAllowed('refresh_token'),
    rotateRefreshToken: true,
    ttl: {
      AccessToken: 900, AuthorizationCode: 60, Interaction: 300, Grant: 30 * 86400, Session: 30 * 86400,
      RefreshToken: (ctx) => Math.max(0, 30 * 86400 - (ctx.oidc.entities.RotatedRefreshToken?.totalLifetime() ?? 0)),
    },
    clientBasedCORS: () => true,
    extraClientMetadata: {
      properties: [],
      validator: (_ctx, _key, _value, metadata) => {
        if (metadata.grant_types?.some(t => !['authorization_code', 'refresh_token'].includes(t))) throw new errors.InvalidClientMetadata('Unsupported grant type');
      },
    },
    renderError: (ctx, out) => { ctx.type = 'application/json'; ctx.body = { error: out.error, error_description: 'Forbindelsen kunne ikke godkendes. Start forbindelsen igen fra din assistent.' }; },
  };
  instance = new Provider(c.issuer, configuration);
  instance.proxy = true;
  return instance;
}
