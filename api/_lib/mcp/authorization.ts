import { provider } from './provider.js';
import { config } from './config.js';
import { db, limit } from './database.js';
import { bearer, type Request } from './http.js';
export type Authorization = { grantId: string; clientId: string; scopes: string[] };
export async function authorize(req: Request): Promise<Authorization> {
  const token = await provider().AccessToken.find(bearer(req));
  if (!token || ![token.aud].flat().includes(config().resource) || !token.grantId) throw Object.assign(new Error('unauthorized'), { status: 401 });
  const connection = await db<{ clientId: string; userId: string; scopes: string[] }>('mcp.connection_use', [token.grantId, null]);
  if (connection.clientId !== token.clientId || token.accountId !== connection.userId) throw Object.assign(new Error('unauthorized'), { status: 401 });
  await limit(`mcp-user:${connection.userId}`, 120); await limit(`mcp-client:${token.clientId}:${connection.userId}`, 90);
  return { grantId: token.grantId, clientId: token.clientId, scopes: (token.scope || '').split(' ').filter(s => connection.scopes.includes(s)) };
}
