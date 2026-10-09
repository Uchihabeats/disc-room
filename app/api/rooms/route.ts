export const runtime='nodejs';
import { authorize,digest,secret,roomDb,response } from './service';
export async function POST(request:Request){try{
 if(Number(request.headers.get('content-length'))>50000)return response({error:'Request too large.'},413);
 const raw=await request.text();if(raw.length>50000)return response({error:'Request too large.'},413);const b=JSON.parse(raw);const db=roomDb(),now=Date.now();
 if(b.action==='create'){
 const id=crypto.randomUUID().replaceAll('-',''),token=secret(),invite=secret(),name=String(b.name||'Player 1').slice(0,24);
 await db.batch([db.prepare('DELETE FROM signals WHERE room_id IN (SELECT id FROM rooms WHERE expires < ? OR heartbeat < ?)').bind(now,now-120000),db.prepare('DELETE FROM rooms WHERE expires < ? OR heartbeat < ?').bind(now,now-120000),db.prepare('INSERT INTO rooms (id,host_hash,invite_hash,host_name,state,expires,heartbeat) VALUES (?,?,?,?,?,?,?)').bind(id,await digest(token),await digest(invite),name,'waiting',now+14400000,now)]);
 return response({id,token,invite,role:'host',name});}
 if(b.action==='join'){
 if(!/^[a-f0-9]{32}$/.test(b.id)||typeof b.invite!=='string')return response({error:'Invalid invite link.'},400);
 const inviteHash=await digest(b.invite),token=secret();const result=await db.prepare("UPDATE rooms SET guest_hash=?,guest_name=?,state='pending' WHERE id=? AND invite_hash=? AND state='waiting' AND expires>? AND heartbeat>?").bind(await digest(token),String(b.name||'Player 2').slice(0,24),b.id,inviteHash,now,now-120000).run();
 if(!result.meta.changes)return response({error:'This invite has expired or player two is already taken.'},409);return response({id:b.id,token,role:'guest'});}
 const {row,role}=await authorize(b.id,b.token);
 if(b.action==='resume'){
 const last=await db.prepare('SELECT COALESCE(MAX(seq),0) AS seq FROM signals WHERE room_id=?').bind(b.id).first<{seq:number}>();
 if(role==='host')await db.prepare('UPDATE rooms SET heartbeat=? WHERE id=?').bind(now,b.id).run();
 else if(row.state==='approved')await db.prepare('INSERT INTO signals(room_id,sender,kind,payload,created) VALUES(?,?,?,?,?)').bind(b.id,'guest','restart','{}',now).run();
 return response({role,state:row.state,after:Number(last?.seq)||0});
 }
 if(b.action==='poll'){
 if(role==='host')await db.prepare('UPDATE rooms SET heartbeat=? WHERE id=?').bind(now,b.id).run();
 const cursor=Number(b.after)||0;if(cursor<0||!Number.isSafeInteger(cursor))return response({error:'Invalid cursor.'},400);
 const list=await db.prepare('SELECT seq,kind,payload FROM signals WHERE room_id=? AND sender<>? AND seq>? ORDER BY seq LIMIT 100').bind(b.id,role,cursor).all<{seq:number;kind:string;payload:string}>();
 return response({state:row.state,hostName:row.host_name,guestName:row.guest_name,signals:list.results.map(s=>({...s,payload:JSON.parse(s.payload)}))});}
 if(b.action==='approve'){
 if(role!=='host'||row.state!=='pending')return response({error:'No pending player.'},403);
 await db.batch([db.prepare('DELETE FROM signals WHERE room_id=?').bind(b.id),b.accept?db.prepare("UPDATE rooms SET state='approved' WHERE id=?").bind(b.id):db.prepare("UPDATE rooms SET state='waiting',guest_hash=NULL,guest_name=NULL WHERE id=?").bind(b.id)]);return response({ok:true});}
 if(b.action==='signal'){
 if(row.state!=='approved'||!['offer','answer','ice','restart'].includes(b.kind))return response({error:'The host must approve this player first.'},403);
 if((role==='host'&&b.kind==='answer')||(role==='guest'&&b.kind==='offer'))return response({error:'Invalid sender.'},403);
 const payload=JSON.stringify(b.payload);if(payload.length>32000)return response({error:'Signal too large.'},413);
 const count=await db.prepare('SELECT COUNT(*) AS n FROM signals WHERE room_id=? AND created>?').bind(b.id,now-60000).first<{n:number}>();if((count?.n||0)>300)return response({error:'Too many connection requests. Try again shortly.'},429);
 await db.prepare('INSERT INTO signals(room_id,sender,kind,payload,created) VALUES(?,?,?,?,?)').bind(b.id,role,b.kind,payload,now).run();return response({ok:true});}
 if(b.action==='leave'){
 if(role==='host')await db.batch([db.prepare('DELETE FROM signals WHERE room_id=?').bind(b.id),db.prepare('DELETE FROM rooms WHERE id=?').bind(b.id)]);
 else await db.batch([db.prepare('DELETE FROM signals WHERE room_id=?').bind(b.id),db.prepare("UPDATE rooms SET state='waiting',guest_hash=NULL,guest_name=NULL WHERE id=?").bind(b.id)]);return response({ok:true});}
 return response({error:'Unknown room action.'},400);
 }catch(e){return response({error:e instanceof Error?e.message:'The room service is unavailable.'},400);}}
