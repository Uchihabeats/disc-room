export const runtime='nodejs';
import { authorize,response } from '../rooms/service';
import {connectionServers} from './ice-servers';
export async function POST(request:Request){try{const {id,token}=await request.json() as {id:string;token:string};const {row}=await authorize(id,token);if(row.state!=='approved')return response({error:'The host must approve player two first.'},403);const {CLOUDFLARE_TURN_KEY_ID,CLOUDFLARE_TURN_API_TOKEN,TURN_URL,TURN_USERNAME,TURN_CREDENTIAL}=process.env;return response(await connectionServers({CLOUDFLARE_TURN_KEY_ID,CLOUDFLARE_TURN_API_TOKEN,TURN_URL,TURN_USERNAME,TURN_CREDENTIAL}));}catch(e){return response({error:e instanceof Error?e.message:'Connection service unavailable.'},400);}}
