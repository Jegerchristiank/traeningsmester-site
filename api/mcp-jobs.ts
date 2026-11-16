import { timingSafeEqual } from 'node:crypto';
import { db } from './_lib/mcp/database.js';
import { json,failure,type Request,type Response } from './_lib/mcp/http.js';
export default async function jobs(req:Request,res:Response){
  try{
    const secret=process.env.CRON_SECRET;const auth=req.headers.authorization||'';const expected=`Bearer ${secret}`;
    if(!secret||auth.length!==expected.length||!timingSafeEqual(Buffer.from(auth),Buffer.from(expected)))throw Object.assign(new Error('unauthorized'),{status:401});
    if(req.method!=='GET'&&req.method!=='POST')throw Object.assign(new Error('method_not_allowed'),{status:405});
    const result=await db('mcp.run_jobs',[3]);await db('mcp.cleanup_control_plane');json(res,200,result);
  }catch(error){failure(res,error,'transfer_jobs');}
}
