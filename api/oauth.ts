import { provider } from './_lib/mcp/provider.js';
import { config as settings } from './_lib/mcp/config.js';
import { hash, limit, serialized } from './_lib/mcp/database.js';
import { captureResponse, failure, type Request, type Response } from './_lib/mcp/http.js';
export const config = { api: { bodyParser: false } };

export default async function oauth(req: Request, res: Response) {
  try {
    const c = settings(); const url = new URL(req.url || '/', c.origin);
    const route = url.searchParams.get('route'); url.searchParams.delete('route');
    const path = route !== null ? `/${route}` : url.pathname.replace(/^\/oauth/, '');
    if (!/^\/(?:auth(?:\/[^/]+)?|token|reg(?:\/[^/]+)?|token\/revocation|jwks|\.well-known\/openid-configuration)$/.test(path)) { res.statusCode = 404; res.end(); return; }
    // Rate state is PostgreSQL-backed, shared across Vercel instances.
    await limit(`oauth:${path.split('/')[1]}:${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`, path === '/reg' ? 20 : 120);
    req.originalUrl = `/oauth${path}${url.search}`; req.baseUrl = '/oauth'; req.url = `${path}${url.search}`;
    const action = async () => { await new Promise<void>((resolve, reject) => { res.once('finish', resolve); res.once('error', reject); provider().callback()(req, res); }); };
    // Serialize token consumption with provider adapter reads in the same SQL
    // transaction. Concurrent refresh/code replays cannot both issue a token.
    // The bounded body is buffered once then handed back to Koa as a stream.
    if (req.method === 'POST' && path === '/token') {
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const chunk of req) { const b = Buffer.from(chunk); bytes += b.length; if (bytes > 16_384) throw Object.assign(new Error('input_too_large'), { status: 413 }); chunks.push(b); }
      const raw = Buffer.concat(chunks); const values = new URLSearchParams(raw.toString());
      const key = values.get('refresh_token') || values.get('code') || '';
      const { Readable } = await import('node:stream'); const stream = Readable.from([raw]);
      Object.assign(stream, { headers: req.headers, method: req.method, url: req.url, originalUrl: req.originalUrl, baseUrl: req.baseUrl, socket: req.socket, connection: req.socket });
      const response = await serialized(`oauth-token:${hash(key)}`, () => captureResponse(res, () => { provider().callback()(stream as Request, res); }));
      res.end(response);
    } else await action();
  } catch (error) { failure(res, error, 'oauth'); }
}
