// Real oidc-provider + official MCP transports against disposable PostgreSQL.
// Phone approval is seeded at its DB boundary here; Supabase/browser/device
// acceptance is tracked separately, never inferred from this protocol test.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { generateKeyPairSync, randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';
import { closeDatabase, db } from '../api/_lib/mcp/database.js';
import { provider } from '../api/_lib/mcp/provider.js';
import oauth from '../api/oauth.js';
import connect from '../api/ai-connect.js';
import mcp from '../api/mcp.js';
import metadata from '../api/mcp-metadata.js';
import download from '../api/mcp-download.js';
import { cookieSign } from '../api/_lib/mcp/crypto.js';
import { csvArchive, parseCsvArchive } from '../api/_lib/mcp/transfer-files.js';
import { tools } from '../api/_lib/mcp/tools.js';
import { tableNames } from '../api/_lib/mcp/schemas.js';

const owner='00000000-0000-4000-8000-000000000001';const other='00000000-0000-4000-8000-000000000002';
let directory:string;let pgBin:string;let admin:Pool;let server:Server;let origin:string;
type Jar=Map<string,string>;
async function request(path:string,init:RequestInit={},jar?:Jar){
 const response=await fetch(path.startsWith('http')?path:origin+path,{...init,redirect:'manual',headers:{...init.headers,...(jar?{cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{})}});
 if(jar)for(const value of response.headers.getSetCookie()){const first=value.split(';')[0];const at=first.indexOf('=');jar.set(first.slice(0,at),first.slice(at+1));}
 return response;
}
async function rpcJson(response:globalThis.Response){const text=await response.text();return JSON.parse(text.startsWith('event:')?text.split('\n').find(line=>line.startsWith('data:'))!.slice(5):text);}
before(async()=>{
 const migration=process.env.TM_MCP_CONTROL_MIGRATION_FILE;if(!migration)throw new Error('Set TM_MCP_CONTROL_MIGRATION_FILE to the control-plane migration in the official app repository.');
 directory=mkdtempSync(join(tmpdir(),'tm-mcp-oauth-'));pgBin=execFileSync('pg_config',['--bindir'],{encoding:'utf8'}).trim();
 execFileSync(join(pgBin,'initdb'),['-D',join(directory,'data'),'--auth=trust','-U','postgres'],{stdio:'ignore'});
 // Reserve a kernel-selected port, then release it immediately for PostgreSQL.
 const reserve=createServer();await new Promise<void>(resolve=>reserve.listen(0,'127.0.0.1',resolve));const pgPort=(reserve.address() as {port:number}).port;await new Promise<void>(resolve=>reserve.close(()=>resolve()));
 execFileSync(join(pgBin,'pg_ctl'),['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-p ${pgPort} -h 127.0.0.1 -k ${directory}`,'start'],{stdio:'ignore'});
 admin=new Pool({connectionString:`postgres://postgres@127.0.0.1:${pgPort}/postgres`});
 await admin.query("create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,deleted_at timestamptz);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
 await admin.query(readFileSync(migration,'utf8'));
 await admin.query(`create role tm_mcp_test login inherit;grant tm_mcp_server to tm_mcp_test;insert into auth.users(id) values('${owner}'),('${other}');update mcp.rollout set enabled_read=true,enabled_plans=true,enabled_sessions=true,all_users=true;`);
 process.env.NODE_ENV='test';process.env.MCP_DATABASE_URL=`postgres://tm_mcp_test@127.0.0.1:${pgPort}/postgres`;
 process.env.MCP_STATE_ENCRYPTION_KEY=randomBytes(32).toString('base64');process.env.MCP_COOKIE_KEYS=randomBytes(48).toString('base64');
 const keys=generateKeyPairSync('rsa',{modulusLength:2048});process.env.MCP_OAUTH_JWKS=JSON.stringify({keys:[{...keys.privateKey.export({format:'jwk'}),kid:'local-fixture',use:'sig',alg:'RS256'}]});
 server=createServer((req,res)=>{const path=new URL(req.url||'/','http://test').pathname;void (path.startsWith('/oauth/')?oauth(req,res):path==='/api/ai-connect'?connect(req,res):path==='/mcp'?mcp(req,res):path==='/api/mcp-download'?download(req,res):metadata(req,res));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`;process.env.MCP_PUBLIC_ORIGIN=origin;
});
after(async()=>{
 if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));await closeDatabase();if(admin)await admin.end();
 if(directory){try{execFileSync(join(pgBin,'pg_ctl'),['-D',join(directory,'data'),'-m','immediate','stop'],{stdio:'ignore'});}finally{rmSync(directory,{recursive:true,force:true});}}
});
async function begin(scopes='training:read plans:write'){
 const jar:Jar=new Map();
 const registration=await request('/oauth/reg',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:'MCP protocol fixture',application_type:'native',redirect_uris:['http://127.0.0.1:34001/callback'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']})});
 const client=await registration.json() as {client_id:string};assert.equal(registration.status,201,JSON.stringify(client));
 const verifier=randomBytes(48).toString('base64url');const challenge=createHash('sha256').update(verifier).digest('base64url');
 const query=new URLSearchParams({client_id:client.client_id,response_type:'code',redirect_uri:'http://127.0.0.1:34001/callback',scope:scopes,resource:`${origin}/mcp`,state:'fixture-state',code_challenge:challenge,code_challenge_method:'S256'});
 const auth=await request(`/oauth/auth?${query}`,{},jar);assert.equal(auth.status,303,await auth.text());
 const entry=await request(auth.headers.get('location')!,{},jar);assert.equal(entry.status,303,await entry.text());
 const uid=new URL(entry.headers.get('location')!,origin).searchParams.get('uid')!;
 const detailResponse=await request(`/api/ai-connect?action=interaction&uid=${uid}`,{},jar);const detail=await detailResponse.json() as {challenge:string;csrf:string;uid:string;scopes:string[]};assert.equal(detailResponse.status,200,JSON.stringify(detail));
 return {jar,client,verifier,detail};
}
async function approve(flow:Awaited<ReturnType<typeof begin>>,decision='approve'){
 await db('mcp.challenge_decide',[createHash('sha256').update(flow.detail.challenge).digest('hex'),owner,decision]);
 const finished=await request('/api/ai-connect?action=finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid:flow.detail.uid,csrf:flow.detail.csrf})},flow.jar);
 const result=await finished.json() as {returnTo:string};assert.equal(finished.status,200,JSON.stringify(result));
 const resumed=await request(result.returnTo,{},flow.jar);assert.equal(resumed.status,303,await resumed.text());
 return new URL(resumed.headers.get('location')!,origin);
}
async function token(flow:Awaited<ReturnType<typeof begin>>,code:string,verifier=flow.verifier){
 const response=await request('/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:flow.client.client_id,grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:'http://127.0.0.1:34001/callback',resource:`${origin}/mcp`})});
 return {response,value:await response.json() as Record<string,unknown>};
}
test('persistent OAuth, S256, opaque audience-bound access, refresh rotation and revocation',async()=>{
 const flow=await begin();const callback=await approve(flow);assert.equal(callback.searchParams.get('state'),'fixture-state');const code=callback.searchParams.get('code')!;assert.ok(code);
 const denied=await token(flow,code,randomBytes(48).toString('base64url'));assert.equal(denied.response.status,400);assert.equal(denied.value.error,'invalid_grant');
 const grant=await token(flow,code);assert.equal(grant.response.status,200,JSON.stringify(grant.value));assert.equal(grant.value.expires_in,900);assert.equal(typeof grant.value.refresh_token,'string');assert.ok(!String(grant.value.access_token).includes('.'));
 const replay=await token(flow,code);assert.equal(replay.response.status,400);
 // A second grant avoids the code-replay family's mandated revocation.
 const next=await begin();const nextCallback=await approve(next);const issued=await token(next,nextCallback.searchParams.get('code')!);assert.equal(issued.response.status,200,JSON.stringify(issued.value));
 const access=await provider().AccessToken.find(String(issued.value.access_token));assert.ok(access);assert.equal(access.aud,`${origin}/mcp`);
 // Production resource is fixed in database, independent of local HTTP issuer.
 const connection=await db<{userId:string}>('mcp.connection_use',[access.grantId,null]);assert.equal(connection.userId,owner);
 const refreshed=await request('/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:next.client.client_id,grant_type:'refresh_token',refresh_token:String(issued.value.refresh_token),resource:`${origin}/mcp`})});const rotated=await refreshed.json() as Record<string,unknown>;assert.equal(refreshed.status,200,JSON.stringify(rotated));assert.notEqual(rotated.refresh_token,issued.value.refresh_token);
 await db('mcp.connection_revoke',[owner,access.grantId]);await assert.rejects(()=>db('mcp.connection_use',[access.grantId,null]),/connection_inactive/);
 const invalid=await request('/mcp',{method:'POST',headers:{Authorization:`Bearer ${rotated.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_training_context',arguments:{}}})});assert.ok([401,403].includes(invalid.status));
 const refreshAfter=await request('/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:next.client.client_id,grant_type:'refresh_token',refresh_token:String(rotated.refresh_token)})});assert.equal(refreshAfter.status,400);
});
test('browser binding, one-time challenge, denial, expiry and account-safe revocation',async()=>{
 const flow=await begin();const stolen=await request('/api/ai-connect?action=finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid:flow.detail.uid,csrf:flow.detail.csrf})});assert.equal(stolen.status,403);
 const callback=await approve(flow,'deny');assert.equal(callback.searchParams.get('error'),'access_denied');
 await assert.rejects(()=>db('mcp.challenge_decide',[createHash('sha256').update(flow.detail.challenge).digest('hex'),other,'approve']));
 const expired=await begin();await admin.query('update mcp.approval_challenges set expires_at=clock_timestamp()-interval \'1 second\' where interaction_uid=$1',[expired.detail.uid]);await assert.rejects(()=>db('mcp.challenge_decide',[createHash('sha256').update(expired.detail.challenge).digest('hex'),owner,'approve']));
 const connection=await admin.query('select id from mcp.connections where user_id=$1 limit 1',[owner]);await assert.rejects(()=>db('mcp.connection_revoke',[other,connection.rows[0].id]),/connection_missing/);
 const table=await admin.query("select has_table_privilege('tm_mcp_test','mcp.connections','select') permitted");assert.equal(table.rows[0].permitted,false);
});
test('official transport exposes all strict tools to current and 2025 clients without private data',async()=>{
 for(const protocolVersion of ['2025-11-25','2025-06-18']){
  const response=await request('/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion,capabilities:{},clientInfo:{name:'protocol-fixture',version:'1'}}})});const result=await rpcJson(response) as {result?:{protocolVersion:string}};assert.equal(response.status,200,JSON.stringify(result));assert.equal(result.result?.protocolVersion,protocolVersion);
 }
 const listing=await request('/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-06-18'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list'})});const value=await rpcJson(listing) as {result:{tools:{name:string;inputSchema:{additionalProperties:boolean}}[]}};assert.equal(listing.status,200,JSON.stringify(value));assert.equal(value.result.tools.length,tools.length);assert.equal(tools.length,34);assert.ok(value.result.tools.every(t=>t.inputSchema.additionalProperties===false));
 const modernMeta={'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientInfo':{name:'modern-fixture',version:'1'},'io.modelcontextprotocol/clientCapabilities':{}};
 const modern=await request('/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2026-07-28','Mcp-Method':'server/discover'},body:JSON.stringify({jsonrpc:'2.0',id:20,method:'server/discover',params:{_meta:modernMeta}})});const discover=await rpcJson(modern);assert.equal(modern.status,200,JSON.stringify(discover));assert.ok(discover.result.supportedVersions.includes('2026-07-28'));
 const modernList=await request('/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2026-07-28','Mcp-Method':'tools/list'},body:JSON.stringify({jsonrpc:'2.0',id:21,method:'tools/list',params:{_meta:modernMeta}})});const modernTools=await rpcJson(modernList);assert.equal(modernList.status,200,JSON.stringify(modernTools));assert.equal(modernTools.result.tools.length,34);
 const call=await request('/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'get_training_context',arguments:{}}})});assert.equal(call.status,401);assert.match(call.headers.get('www-authenticate')||'',/oauth-protected-resource/);
 const readOnly=await begin('training:read');const callback=await approve(readOnly);const issued=await token(readOnly,callback.searchParams.get('code')!);
 const writeCall=await request('/mcp',{method:'POST',headers:{Authorization:`Bearer ${issued.value.access_token}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-06-18'},body:JSON.stringify({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'manage_custom_exercise',arguments:{operationId:'00000000-0000-4000-8000-000000000099',action:'archive'}}})});const blocked=await rpcJson(writeCall) as {result:{isError:boolean;content:{text:string}[]}};assert.equal(blocked.result.isError,true);assert.match(blocked.result.content[0].text,/insufficient_scope/);
});
test('CSV tables preserve nested/null/multiline/versioned values and download tickets fail closed',async()=>{
 const document={schemaVersion:1,format:'traeningsmester-training',sourceAccountId:owner,snapshot:{id:other,capturedAt:'2026-11-15T12:00:00Z',basis:'postgres-statement-snapshot'},units:{weight:'kg',duration:'s',distance:'m'},timeZone:'UTC',tables:Object.fromEntries(tableNames.map(name=>[name,name==='sets'?[{id:owner,notes:'æ,ø\n"quote"',weight:null,metric:{version:1,value:0.25}}]:[]]))};
 assert.deepEqual(parseCsvArchive(csvArchive(document)),document);
 const ticket=cookieSign({grantId:'unknown-connection',jobId:owner,expires:Date.now()-1});const response=await request(`/api/mcp-download?ticket=${encodeURIComponent(ticket)}`);assert.equal(response.status,401);
});
