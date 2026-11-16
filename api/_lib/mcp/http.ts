import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
export type Request = IncomingMessage & { body?: unknown; originalUrl?: string; baseUrl?: string };
export type Response = ServerResponse;
export function json(res: Response, status: number, value: unknown) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(value));
}
export function redirect(res: Response, location: string) { res.statusCode = 303; res.setHeader('Cache-Control', 'no-store'); res.setHeader('Location', location); res.end(); }
// OAuth must not release tokens until their SQL transaction has committed.
export async function captureResponse(res:Response,action:()=>void):Promise<Buffer>{
  const write=res.write;const end=res.end;const writeHead=res.writeHead;const chunks:Buffer[]=[];
  try{return await new Promise<Buffer>((resolve,reject)=>{
    res.write=((chunk:Uint8Array|string)=>{chunks.push(Buffer.from(chunk));return true;}) as typeof res.write;
    res.writeHead=((status:number)=>{res.statusCode=status;return res;}) as typeof res.writeHead;
    res.end=((chunk?:Uint8Array|string)=>{if(chunk)chunks.push(Buffer.from(chunk));resolve(Buffer.concat(chunks));return res;}) as typeof res.end;
    res.once('error',reject);try{action();}catch(error){reject(error);}
  });}finally{res.write=write;res.end=end;res.writeHead=writeHead;}
}
export async function body(req: Request, maximum = 1024 * 1024): Promise<Record<string, unknown>> {
  let raw: string;
  if (req.body !== undefined) raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  else { const chunks: Buffer[] = []; let bytes = 0; for await (const chunk of req) { const b = Buffer.from(chunk); bytes += b.length; if (bytes > maximum) throw Object.assign(new Error('input_too_large'), { status: 413 }); chunks.push(b); } raw = Buffer.concat(chunks).toString('utf8'); }
  if (Buffer.byteLength(raw) > maximum) throw Object.assign(new Error('input_too_large'), { status: 413 });
  let value: unknown; try { value = JSON.parse(raw); } catch { throw Object.assign(new Error('invalid_input'), { status: 400 }); }
  if (!value || Array.isArray(value) || typeof value !== 'object') throw Object.assign(new Error('invalid_input'), { status: 400 });
  return value as Record<string, unknown>;
}
export function sameOrigin(req: Request) { if (req.headers.origin && req.headers.origin !== config().origin) throw Object.assign(new Error('origin_denied'), { status: 403 }); }
export function bearer(req: Request) { const value = req.headers.authorization; if (!value?.startsWith('Bearer ') || value.length > 8192) throw Object.assign(new Error('unauthorized'), { status: 401 }); return value.slice(7); }
export async function identity(req: Request) {
  const token = bearer(req);
  const origin = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rbplnybmjwcoigiwtkuh.supabase.co';
  if (origin.replace(/\/$/, '') !== 'https://rbplnybmjwcoigiwtkuh.supabase.co') throw new Error('SUPABASE_IDENTITY_PROJECT_INVALID');
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!key) throw new Error('SUPABASE_PUBLIC_KEY_MISSING');
  const result = await fetch(`${origin.replace(/\/$/, '')}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: key }, signal: AbortSignal.timeout(8000) });
  if (!result.ok) throw Object.assign(new Error('unauthorized'), { status: 401 });
  const user = await result.json() as { id?: string; is_anonymous?: boolean };
  if (!user.id || !/^[0-9a-f-]{36}$/i.test(user.id) || user.is_anonymous) throw Object.assign(new Error('unauthorized'), { status: 401 });
  return user.id;
}
export function failure(res: Response, error: unknown, operation: string) {
  const e = error as { status?: number; code?: string; message?: string };
  const classes: Record<string, [number, string]> = { '42501': [403, 'access_denied'], '22023': [400, 'invalid_input'], '22P02': [400, 'invalid_input'], '40001': [409, 'stale_revision'], '55006': [409, 'session_busy'], 'P0002': [404, 'not_found'], '57014': [504, 'unknown_outcome'], '55P03': [409, 'operation_busy'] };
  const [status, code] = classes[e.code ?? ''] || [e.status ?? 503, e.status === 429 ? 'rate_limited' : e.status === 401 ? 'unauthorized' : e.status && e.status < 500 ? 'invalid_request' : 'temporarily_unavailable'];
  const correlationId = randomUUID();
  console.info(JSON.stringify({ operation, outcome: code, correlationId }));
  if (!res.headersSent) json(res, status, { error: { code, correlationId, retrySameOperation: status >= 500 || code === 'operation_busy' } }); else res.end();
}
