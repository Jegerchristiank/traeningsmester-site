import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { config } from './config.js';

let pool: Pool | undefined;
const context = new AsyncLocalStorage<{client:PoolClient;tail:Promise<unknown>}>();
function database() {
  if (!pool) {
    const url = new URL(config().databaseUrl);
    if (!url.username.split('.')[0].startsWith('tm_mcp_')) throw new Error('MCP_REQUIRES_DEDICATED_DATABASE_ROLE');
    pool = new Pool({ connectionString: url.toString(), max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000,
      ssl: url.hostname === '127.0.0.1' || url.hostname === 'localhost' ? false : { rejectUnauthorized: true, ...(config().databaseCa?{ca:config().databaseCa}:{}) },
      statement_timeout: 20_000, application_name: 'traeningsmester-mcp' });
  }
  return pool;
}
export async function closeDatabase(){if(pool){await pool.end();pool=undefined;}}
// SQL names are internal constants; callers can only select explicit functions.
export async function db<T = unknown>(name: string, args: unknown[] = []): Promise<T> {
  if (!/^mcp\.[a-z_]+$/.test(name)) throw new Error('INVALID_CAPABILITY');
  const values = args.map(v => v && typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : v);
  const query=`select ${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as value`;
  const transaction=context.getStore();
  const pending=transaction?transaction.tail.then(()=>transaction.client.query(query,values)):database().query(query,values);
  if(transaction)transaction.tail=pending.then(()=>undefined,()=>undefined);
  const result = await pending;
  return result.rows[0]?.value as T;
}
export const hash = (input: string) => createHash('sha256').update(input).digest('hex');
export async function serialized<T>(key: string, action: () => Promise<T>): Promise<T> {
  const client = await database().connect();
  try {
    await client.query('begin');
    await client.query("set local lock_timeout = '3s'");
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 27119))', [key]);
    const transaction={client,tail:Promise.resolve() as Promise<unknown>};
    const value = await context.run(transaction, action);
    await transaction.tail;
    await client.query('commit');
    return value;
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
export async function limit(bucket: string, max: number, seconds = 60) {
  if (!await db<boolean>('mcp.rate_limit', [hash(bucket), max, seconds])) throw Object.assign(new Error('rate_limited'), { status: 429 });
}
