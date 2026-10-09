import catalog from './system-catalog.json';
export type SystemConfig=typeof catalog[number];
export const systems:SystemConfig[]=catalog;
export const experimentalCores=new Set(['bsnes','genesis_plus_gx_wide','azahar','freeintv','same_cdi']);
export const threadedCores=new Set(['ppsspp','dosbox_pure','azahar']);
export const getSystem=(id:string)=>systems.find(s=>s.id===id&&s.available);
export const biosLabel=(s:SystemConfig)=>s.bios==='required'?'BIOS REQUIRED':s.bios==='optional'?'BIOS OPTIONAL':'NO BIOS NEEDED';
export const remoteHint=(s:SystemConfig)=>s.kind==='computer'?'Guest uses controller input. Keyboard and mouse stay on the host.':s.remotePort===0?'Take turns on one controller. Link-cable and wireless multiplayer are not supported.':'Guest controls player two. Choose a game with local multiplayer.';

export const requiresBios=(s:SystemConfig,core:string,names:string[]=[])=>s.bios==='required'||core==='mednafen_psx_hw'||(s.id==='nes'&&names.some(n=>n.toLowerCase().endsWith('.fds')))||(s.id==='pc-engine'&&names.some(n=>/\.(cue|chd)$/i.test(n)));
