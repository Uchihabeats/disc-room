export const runtime='nodejs';
import {systems,experimentalCores} from '../../../../systems';
const stable=new Set(systems.flatMap(s=>s.cores).filter(c=>!experimentalCores.has(c)));
const common=new Set(['loader.js','emulator.min.js','emulator.min.css','compression/extract7z.js','compression/extractzip.js','compression/unrar.js','localization/en-US.json','cores/ppsspp-assets.zip']);
export async function GET(request:Request,{params}:{params:Promise<{channel:string;asset:string[]}>}){
 const {channel,asset}=await params;const path=asset.join('/');const pool=channel==='stable'?stable:channel==='experimental'?new Set([...stable,...experimentalCores]):null;
 if(!pool)return new Response('Unknown emulator channel',{status:404});
 const core=path.match(/^cores\/(?:reports\/)?([a-z0-9_]+?)(?:-(?:thread-)?(?:legacy-)?wasm\.data|\.json)$/)?.[1];
 if(!common.has(path)&&(!core||!pool.has(core)))return new Response('Unknown emulator asset',{status:404});
 const upstream=await fetch('https://cdn.emulatorjs.org/'+(channel==='stable'?'4.2.3':'nightly')+'/data/'+path,{cache:'no-store'});
 if(!upstream.ok)return new Response('Emulator download unavailable. Please try again.',{status:502});
 const headers=new Headers({'Content-Type':upstream.headers.get('Content-Type')||'application/octet-stream','Cache-Control':channel==='stable'?'public, max-age=31536000, immutable':'public, max-age=3600','Cross-Origin-Resource-Policy':'same-origin'});
 return new Response(upstream.body,{headers});
}
