import {createClient,type Client,type InValue} from '@libsql/client';
const schema=`CREATE TABLE IF NOT EXISTS rooms (
 id TEXT PRIMARY KEY NOT NULL, host_hash TEXT NOT NULL, invite_hash TEXT NOT NULL,
 host_name TEXT NOT NULL, guest_hash TEXT, guest_name TEXT,
 state TEXT NOT NULL DEFAULT 'waiting', expires INTEGER NOT NULL, heartbeat INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS signals (
 seq INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, room_id TEXT NOT NULL,
 sender TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL, created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_signals_room_seq ON signals(room_id,seq);`;
class Statement {
 constructor(readonly db:RoomDatabase,readonly sql:string,readonly args:InValue[]=[]){}
 bind(...args:InValue[]){return new Statement(this.db,this.sql,args)}
 private async execute(){await this.db.ensureSchema();return this.db.client.execute({sql:this.sql,args:this.args})}
 async first<T>(){const result=await this.execute();return (result.rows[0] as unknown as T)||null}
 async all<T>(){const result=await this.execute();return {results:result.rows as unknown as T[]}}
 async run(){const result=await this.execute();return {meta:{changes:result.rowsAffected}}}
}
class RoomDatabase {
 private ready:Promise<void>|undefined;
 constructor(readonly client:Client){}
 ensureSchema(){return this.ready??=this.client.executeMultiple(schema).then(()=>{}).catch(e=>{this.ready=undefined;throw e})}
 prepare(sql:string){return new Statement(this,sql)}
 async batch(statements:Statement[]){await this.ensureSchema();return this.client.batch(statements.map(s=>({sql:s.sql,args:s.args})),'write')}
}
let database:RoomDatabase|undefined;
export function roomDb(){
 if(database)return database;
 const url=process.env.TURSO_DATABASE_URL;
 if(!url)throw new Error('Room service is unavailable. You can still play locally.');
 if(process.env.VERCEL&&(url.startsWith('file:')||url===':memory:'))throw new Error('Room service requires a persistent remote database.');
 if(!url.startsWith('file:')&&url!==':memory:'&&!process.env.TURSO_AUTH_TOKEN)throw new Error('Room database credentials are missing.');
 return database=new RoomDatabase(createClient({url,authToken:process.env.TURSO_AUTH_TOKEN}));
}
