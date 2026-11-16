import type { Adapter, AdapterPayload } from 'oidc-provider';
import { db, hash } from './database.js';
import { seal, unseal } from './crypto.js';
type Stored = { payload: ReturnType<typeof seal>; consumed: number | null };
export class PostgresAdapter implements Adapter {
  constructor(private readonly model: string) {}
  async upsert(id: string, payload: AdapterPayload, expiresIn: number) {
    await db('mcp.oauth_upsert', [this.model, hash(id), seal(payload, this.model), payload.grantId ?? null, payload.uid ?? null, payload.userCode ?? null, expiresIn ?? null]);
  }
  private async lookup(key: string, mode: 'id' | 'uid' | 'userCode') {
    const stored = await db<Stored | null>('mcp.oauth_find', [this.model, key, mode]);
    if (!stored) return undefined;
    const value = unseal<AdapterPayload>(stored.payload, this.model);
    if (stored.consumed !== null) value.consumed = stored.consumed;
    return value;
  }
  find(id: string) { return this.lookup(hash(id), 'id'); }
  findByUid(uid: string) { return this.lookup(uid, 'uid'); }
  findByUserCode(code: string) { return this.lookup(code, 'userCode'); }
  async consume(id: string) { await db('mcp.oauth_consume', [this.model, hash(id)]); }
  async destroy(id: string) { await db('mcp.oauth_destroy', [this.model, hash(id)]); }
  async revokeByGrantId(id: string) { await db('mcp.oauth_revoke_grant', [id]); }
}
