import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
export const nonce = () => randomBytes(32).toString('base64url');
function stateKey() { const key = Buffer.from(config().encryptionKey, 'base64'); if (key.length !== 32) throw new Error('MCP_STATE_KEY_MUST_BE_32_BYTES'); return key; }
export function seal(value: unknown, purpose: string) {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', stateKey(), iv); cipher.setAAD(Buffer.from(purpose));
  const body = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64url'), body: body.toString('base64url'), tag: cipher.getAuthTag().toString('base64url') };
}
export function unseal<T>(value: { iv: string; body: string; tag: string }, purpose: string): T {
  const cipher = createDecipheriv('aes-256-gcm', stateKey(), Buffer.from(value.iv, 'base64url')); cipher.setAAD(Buffer.from(purpose)); cipher.setAuthTag(Buffer.from(value.tag, 'base64url'));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(value.body, 'base64url')), cipher.final()]).toString('utf8')) as T;
}
export function cookieSign(value: unknown) {
  const encoded = Buffer.from(JSON.stringify(value)).toString('base64url');
  const sig = createHmac('sha256', config().cookieKeys[0]).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}
export function cookieRead<T>(value?: string): T | undefined {
  if (!value || value.length > 2048) return;
  const [encoded, sig] = value.split('.'); if (!encoded || !sig) return;
  for (const key of config().cookieKeys) {
    const expected = createHmac('sha256', key).update(encoded).digest(); const actual = Buffer.from(sig, 'base64url');
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) {
      try { return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T; } catch { return; }
    }
  }
}
