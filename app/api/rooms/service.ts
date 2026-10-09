import {roomDb} from './database';
export {roomDb} from './database';
export async function digest(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(v=>v.toString(16).padStart(2,'0')).join('');}
export const secret=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
export type RoomRow={id:string;host_hash:string;invite_hash:string;host_name:string;guest_hash:string|null;guest_name:string|null;state:string;expires:number;heartbeat:number};
export async function authorize(id:string,token:string){if(!/^[a-f0-9]{32}$/.test(id)||typeof token!=='string'||!token)throw new Error('Invalid room credentials.');const row=await roomDb().prepare('SELECT * FROM rooms WHERE id = ?').bind(id).first<RoomRow>();if(!row||row.expires<Date.now()||row.heartbeat<Date.now()-120000)throw new Error('This room has closed. Ask the host for a new invite.');const hash=await digest(token);if(hash===row.host_hash)return {row,role:'host'};if(hash===row.guest_hash)return {row,role:'guest'};throw new Error('Invalid room credentials.');}
export function response(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}
