export const MCP_RESOURCE = 'https://www.traeningsmester.dk/mcp';
export const MCP_SCOPES = ['training:read', 'plans:write', 'exercises:write', 'workouts:write', 'history:write', 'preferences:write', 'data:transfer'] as const;
export type TrainingScope = typeof MCP_SCOPES[number];
export const scopeLabels: Record<TrainingScope, string> = {
  'training:read': 'Læse programmer, øvelser, træningshistorik og statistik',
  'plans:write': 'Oprette, ændre, aktivere og slette programmer og mesoprogrammer',
  'exercises:write': 'Oprette, ændre og arkivere dine egne øvelser',
  'workouts:write': 'Starte, registrere og afslutte træning samt overdrage kontrollen',
  'history:write': 'Rette og slette træningshistorik',
  'preferences:write': 'Ændre træningspræferencer og dine centerindstillinger',
  'data:transfer': 'Importere og eksportere strukturerede træningsdata',
};
export function config() {
  const origin = process.env.MCP_PUBLIC_ORIGIN || 'https://www.traeningsmester.dk';
  if (origin !== 'https://www.traeningsmester.dk' && !(process.env.NODE_ENV === 'test' && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))) throw new Error('MCP_ORIGIN_INVALID');
  const required = (key: string) => { const value = process.env[key]; if (!value) throw new Error(`${key}_MISSING`); return value; };
  const cookieKeys=required('MCP_COOKIE_KEYS').split(',').map(s=>s.trim());if(cookieKeys.some(k=>k.length<32))throw new Error('MCP_COOKIE_KEYS_TOO_SHORT');
  const jwks=JSON.parse(required('MCP_OAUTH_JWKS')) as {keys:Record<string,unknown>[]};
  if(!Array.isArray(jwks.keys)||!jwks.keys.some(k=>typeof k.d==='string'&&typeof k.kid==='string'))throw new Error('MCP_PERSISTENT_SIGNING_KEY_REQUIRED');
  return { origin, issuer: `${origin}/oauth`, resource: origin === 'https://www.traeningsmester.dk' ? MCP_RESOURCE : `${origin}/mcp`, databaseUrl: required('MCP_DATABASE_URL'), databaseCa:process.env.MCP_DATABASE_CA, encryptionKey: required('MCP_STATE_ENCRYPTION_KEY'), cookieKeys, jwks };
}
