import { config as settings } from './_lib/mcp/config.js';
import { cookieRead } from './_lib/mcp/crypto.js';
import { db, limit } from './_lib/mcp/database.js';
import { csvArchive } from './_lib/mcp/transfer-files.js';
import { failure, type Request, type Response } from './_lib/mcp/http.js';
import { once } from 'node:events';
export default async function download(req:Request,res:Response){
  try{
    if(req.method!=='GET')throw Object.assign(new Error('method_not_allowed'),{status:405});
    const url=new URL(req.url||'/',settings().origin);
    const ticket=cookieRead<{grantId:string;jobId:string;expires:number}>(url.searchParams.get('ticket')||undefined);
    if(!ticket||ticket.expires<=Date.now()||typeof ticket.grantId!=='string'||typeof ticket.jobId!=='string')throw Object.assign(new Error('ticket_invalid'),{status:401});
    await limit(`download:${ticket.grantId}`,20);
    const file=await db<{format:'json'|'csv';filename:string;document:unknown}>('mcp.data_download',[ticket.grantId,ticket.jobId]);
    res.setHeader('Cache-Control','private, no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Disposition',`attachment; filename="${file.filename.replace(/[^a-zA-Z0-9._-]/g,'_')}"`);
    res.setHeader('Content-Type',file.format==='csv'?'application/zip':'application/json; charset=utf-8');
    const bytes=file.format==='csv'?Buffer.from(csvArchive(file.document)):Buffer.from(JSON.stringify(file.document));
    for(let at=0;at<bytes.length;at+=64*1024)if(!res.write(bytes.subarray(at,at+64*1024)))await once(res,'drain');
    res.end();
  }catch(error){failure(res,error,'download');}
}
