import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { seed, apply } from '../../../lib/domain.mjs';
export const dynamic = 'force-dynamic';
const respond = (data: unknown, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'no-store'}});
export async function GET() {
 const user = await getChatGPTUser();
 if (!user) return respond({error:'Please sign in to open your workspace.'},401);
 if(!env.DB)return respond({error:'Workspace storage is not connected.'},503);
 const row = await env.DB.prepare('SELECT payload, revision FROM workspaces WHERE owner_id = ?').bind(user.userId).first<{payload:string,revision:number}>();
 return respond(row ? {state:JSON.parse(row.payload),revision:row.revision} : {state:seed(),revision:0});
}
export async function POST(request: Request) {
 const user = await getChatGPTUser();
 if (!user) return respond({error:'Please sign in to save changes.'},401);
 if(!env.DB)return respond({error:'Workspace storage is not connected.'},503);
 const origin=request.headers.get('origin');
 if(origin && origin!==new URL(request.url).origin) return respond({error:'Request origin is not allowed.'},403);
 if(Number(request.headers.get('content-length')||0)>20000) return respond({error:'Request is too large.'},413);
 try {
  const body=await request.text(); if(body.length>20000)return respond({error:'Request is too large.'},413);
  const {action,revision}=JSON.parse(body);
  if(!Number.isSafeInteger(revision)||revision<0)return respond({error:'Invalid workspace version.'},400);
  const row=await env.DB.prepare('SELECT payload, revision FROM workspaces WHERE owner_id = ?').bind(user.userId).first<{payload:string,revision:number}>();
  if((row?.revision||0)!==revision)return respond({error:'The workspace changed in another tab. Refresh and try again.'},409);
  const state=apply(row?JSON.parse(row.payload):seed(),action), next=revision+1;
  const result=row?await env.DB.prepare('UPDATE workspaces SET payload = ?, revision = ?, updated_at = ? WHERE owner_id = ? AND revision = ?').bind(JSON.stringify(state),next,new Date().toISOString(),user.userId,revision).run():await env.DB.prepare('INSERT OR IGNORE INTO workspaces (owner_id,payload,revision,updated_at) VALUES (?,?,?,?)').bind(user.userId,JSON.stringify(state),next,new Date().toISOString()).run();
  if(result.meta.changes!==1)return respond({error:'The workspace changed in another tab. Refresh and try again.'},409);
  return respond({state,revision:next});
 } catch(error) {return respond({error:error instanceof Error?error.message:'Could not save this change.'},400);}
}
