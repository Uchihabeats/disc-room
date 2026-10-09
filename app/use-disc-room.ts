"use client";
import { useEffect, useRef, useState } from 'react';
import {engineDocument} from './engine-document';
import { toast } from 'sonner';
import { packageDisc,packageFiles,validateFiles,parseInvite,keyMap,padMap } from './disc-utils';
import {getSystem,requiresBios,experimentalCores,threadedCores,type SystemConfig} from './systems';
import {isStreamQuality,limitStream,summarizeConnection,type StreamQuality,type NetworkSample,type MediaCounter} from './remote-connection';
type Room={id:string;token:string;role:'host'|'guest';invite?:string};
type Engine={capture:()=>MediaStream;input:(a:number[])=>boolean;release:()=>void;pause:(v:boolean)=>void;restart:()=>void;volume:(v:number)=>void;focus:()=>void;exportState:()=>Uint8Array;importState:(b:ArrayBuffer)=>void};
type Signal={seq:number;kind:string;payload:any};
export function useDiscRoom(system:SystemConfig){
 const [quality,setQuality]=useState<StreamQuality>('balanced'),[network,setNetwork]=useState<NetworkSample|null>(null),[inputStatus,setInputStatus]=useState<'waiting'|'ready'|'active'|'stalled'>('waiting'),[relayAvailable,setRelayAvailable]=useState(false),[relayWarning,setRelayWarning]=useState(''),[relayOnly,setRelayOnly]=useState(false),[streamWarning,setStreamWarning]=useState('');
 const qualityRef=useRef<StreamQuality>('balanced'),relayRef=useRef(false),relayAvailableRef=useRef(false),statsTimer=useRef<ReturnType<typeof setInterval>|null>(null),statsCounter=useRef<MediaCounter|undefined>(undefined),inputReceipt=useRef({last:0,active:0,ack:0}),streamQueue=useRef(Promise.resolve());
 const [core,setCore]=useState(system.cores[0]),[canSave,setCanSave]=useState(false);
 const [files,setFiles]=useState<File[]>([]),[bios,setBios]=useState<File[]>([]),[volume,setVolume]=useState(70),[playing,setPlaying]=useState(false),[busy,setBusy]=useState(false),[guest,setGuest]=useState(false),[paused,setPaused]=useState(false),[connected,setConnected]=useState(false),[error,setError]=useState(''),[controller,setController]=useState(''),[room,setRoom]=useState<Room|null>(null),[roomBusy,setRoomBusy]=useState(false),[friendName,setFriendName]=useState('Player 2'),[pending,setPending]=useState<{name:string}|null>(null),[status,setStatus]=useState('Ready for local play'),[ping,setPing]=useState<number|null>(null);
 const screenRef=useRef<HTMLDivElement>(null),engineRef=useRef<HTMLIFrameElement>(null),videoRef=useRef<HTMLVideoElement>(null),roomRef=useRef<Room|null>(null),pc=useRef<RTCPeerConnection|null>(null),channel=useRef<RTCDataChannel|null>(null),stream=useRef<MediaStream|null>(null),cursor=useRef(0),approved=useRef(false),started=useRef(false),boot=useRef<any>(null),iceQueue=useRef<RTCIceCandidateInit[]>([]),serial=useRef(Promise.resolve()),lastSeq=useRef(-1),offerBusy=useRef(false),alive=useRef(true),inputEnabled=useRef(false),keys=useRef(new Set<string>()),joinBusy=useRef(false),reconnectCount=useRef(0),reconnectTimer=useRef<ReturnType<typeof setTimeout>|null>(null),healthTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const engine=()=>((engineRef.current?.contentWindow as any)?.discEngine as Engine|undefined);
 const fail=(e:unknown)=>{const message=e instanceof Error?e.message:String(e);setError(message);setStatus(message)};
 function playRemoteVideo(enableSound=false){
  const video=videoRef.current;if(!video?.srcObject)return;
  if(enableSound)video.muted=false;
  void video.play().then(()=>{if(roomRef.current?.role==='guest'&&channel.current?.readyState==='open'&&!video.muted)setStatus('Player two connected')}).catch((e:unknown)=>{
   if(videoRef.current!==video||roomRef.current?.role!=='guest'||!video.srcObject)return;
   if(e instanceof DOMException&&e.name==='NotAllowedError'&&!video.muted){
    video.muted=true;void video.play().catch(()=>{});
    setStatus('Controls ready. Click the game or press a game key for sound.');
   }
  });
 }
 async function api(body:any){const r=await fetch('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data:any=await r.json();if(!r.ok)throw new Error(data.error||'The room service could not respond.');return data;}
 function remember(r:Room|null){if(roomRef.current?.token!==r?.token){relayRef.current=false;setRelayOnly(false);relayAvailableRef.current=false;setRelayAvailable(false);setRelayWarning('');reconnectCount.current=0;}roomRef.current=r;setRoom(r);cursor.current=0;approved.current=false;try{if(r)sessionStorage.setItem('disc-room-session-'+system.id,JSON.stringify(r));else sessionStorage.removeItem('disc-room-session-'+system.id)}catch{}}
 function resetPeer(){if(reconnectTimer.current)clearTimeout(reconnectTimer.current);if(healthTimer.current)clearTimeout(healthTimer.current);if(statsTimer.current)clearInterval(statsTimer.current);statsTimer.current=null;statsCounter.current=undefined;inputReceipt.current={last:0,active:0,ack:0};setNetwork(null);setInputStatus('waiting');inputEnabled.current=false;keys.current.clear();channel.current?.close();channel.current=null;const old=pc.current;pc.current=null;if(old){old.onconnectionstatechange=null;old.close()}if(stream.current){for(const t of stream.current.getTracks())t.stop();stream.current=null}engine()?.release();setConnected(false);setPing(null);iceQueue.current=[];lastSeq.current=-1;}
 async function sendSignal(kind:string,payload:any){const r=roomRef.current;if(!r)return;await api({...r,action:'signal',kind,payload})}
 function applyStreamLimits(){
  const peer=pc.current;
  streamQueue.current=streamQueue.current.catch(()=>{}).then(async()=>{
   if(!peer||pc.current!==peer||peer.connectionState==='closed'||roomRef.current?.role!=='host')return;
   await limitStream(peer,qualityRef.current);
   if(pc.current!==peer)return;
   setStreamWarning('');
   if(channel.current?.readyState==='open')channel.current.send(JSON.stringify({type:'quality',quality:qualityRef.current}));
  }).catch(()=>{if(pc.current===peer)setStreamWarning('This browser could not apply the stream limit. Try Chrome or Edge.');});
  return streamQueue.current;
 }
 function changeQuality(next:StreamQuality){
  if(!isStreamQuality(next))return;
  if(roomRef.current?.role==='guest'){
   if(channel.current?.readyState==='open')channel.current.send(JSON.stringify({type:'quality-request',quality:next}));
   return;
  }
  qualityRef.current=next;setQuality(next);void applyStreamLimits();
 }
 async function tryRelay(){
  try{
  if(!relayAvailableRef.current)return;
  if(roomRef.current?.role==='guest'){
   if(channel.current?.readyState==='open')channel.current.send(JSON.stringify({type:'relay-request'}));
   else await sendSignal('restart',{relay:true});
  }else{relayRef.current=true;setRelayOnly(true);await offer();}
  }catch(e){fail(e);}
 }
 function setupChannel(c:RTCDataChannel){
  channel.current=c;
  c.onopen=()=>{if(channel.current!==c)return;setConnected(true);setStatus('Player two connected');reconnectCount.current=0;inputReceipt.current.last=performance.now();if(roomRef.current?.role==='guest'){setPlaying(true);inputEnabled.current=true;if(document.activeElement===document.body)videoRef.current?.focus({preventScroll:true});playRemoteVideo(true)}else void applyStreamLimits();};
  c.onclose=()=>{if(channel.current!==c)return;inputEnabled.current=false;engine()?.release();setConnected(false);setInputStatus('stalled');setStatus('Connection lost. Trying to reconnect…')};
  c.onmessage=e=>{try{
   if(typeof e.data!=='string'||e.data.length>4096)return;
   const m=JSON.parse(e.data),host=roomRef.current?.role==='host',now=performance.now();
   if(m.type==='input'&&host&&Number.isSafeInteger(m.seq)&&m.seq>lastSeq.current){
    if(engine()?.input(m.values)!==true)return;
    lastSeq.current=m.seq;inputReceipt.current.last=now;
    const active=m.values.some((v:number)=>v!==0);if(active)inputReceipt.current.active=now;
    if(now-inputReceipt.current.ack>250||active){c.send(JSON.stringify({type:'input-ack',seq:m.seq,active}));inputReceipt.current.ack=now;}
   }else if(m.type==='input-ack'&&!host&&Number.isSafeInteger(m.seq)){inputReceipt.current.last=now;if(m.active)inputReceipt.current.active=now;}
   else if(m.type==='quality-request'&&host&&isStreamQuality(m.quality))changeQuality(m.quality);
   else if(m.type==='quality'&&!host&&isStreamQuality(m.quality)){qualityRef.current=m.quality;setQuality(m.quality);}
   else if(m.type==='relay-request'&&host)void tryRelay().catch(fail);
   else if(m.type==='ping'&&Number.isFinite(m.at))c.send(JSON.stringify({type:'pong',at:m.at}));
   else if(m.type==='pong'&&Number.isFinite(m.at))setPing(Math.max(0,Math.round(now-m.at)));
  }catch{}};
 }
 async function makePeer(){
  const r=roomRef.current;if(!r)throw new Error('Create a room first.');
  const res=await fetch('/api/rtc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r)});const rtc:any=await res.json();if(!res.ok)throw new Error(rtc.error||'Cannot set up the connection.');
  relayAvailableRef.current=rtc.relay===true;setRelayAvailable(rtc.relay===true);setRelayWarning(rtc.warning||'');
  if(relayRef.current&&!rtc.relay)throw new Error('The relay is unavailable. Ask the host to create a new room for a direct connection.');
  const peer=new RTCPeerConnection({iceServers:rtc.iceServers,iceTransportPolicy:relayRef.current?'relay':'all'});pc.current=peer;
  let readingStats=false;
  statsTimer.current=setInterval(async()=>{
   if(pc.current!==peer||peer.connectionState!=='connected'||readingStats)return;
   readingStats=true;
   try{const report=await peer.getStats();if(pc.current!==peer)return;const summary=summarizeConnection(report,roomRef.current?.role==='guest',statsCounter.current);statsCounter.current=summary.counter;setNetwork(summary.sample);
    const now=performance.now(),receipt=inputReceipt.current;setInputStatus(!receipt.last?'waiting':now-receipt.last>3000?'stalled':receipt.active>0&&now-receipt.active<4000?'active':'ready');
   }catch{}finally{readingStats=false;}
  },2000);
  peer.onicecandidate=e=>{if(e.candidate)sendSignal('ice',e.candidate.toJSON()).catch(fail)};
  peer.ondatachannel=e=>setupChannel(e.channel);
  peer.ontrack=e=>{if(videoRef.current){videoRef.current.srcObject=e.streams[0];videoRef.current.volume=volume/100;playRemoteVideo(true)}};
  peer.onconnectionstatechange=()=>{if(pc.current!==peer)return;
   if(peer.connectionState==='connected'){if(healthTimer.current)clearTimeout(healthTimer.current);void applyStreamLimits();}
   if(['failed','disconnected'].includes(peer.connectionState)){engine()?.release();setConnected(false);setStatus('Connection lost. Trying to reconnect…');if(reconnectTimer.current)clearTimeout(reconnectTimer.current);reconnectTimer.current=setTimeout(()=>{
    if(pc.current!==peer||peer.connectionState==='connected')return;
    if(reconnectCount.current++<2){resetPeer();if(roomRef.current?.role==='host'){if(rtc.relay){relayRef.current=true;setRelayOnly(true);}offer().catch(fail);}else sendSignal('restart',{relay:rtc.relay===true}).catch(fail);}
    else{resetPeer();fail(new Error(rtc.relay?'Could not connect. Check both internet connections and create a new room.':'This network blocks a direct connection. A TURN relay must be configured for remote play on these networks.'));}
   },3000);}
  };
  healthTimer.current=setTimeout(()=>{if(pc.current===peer&&peer.connectionState!=='connected'){
   const retry=rtc.relay&&!relayRef.current&&reconnectCount.current++<2;resetPeer();
   if(retry){setStatus('Trying a relay connection…');if(roomRef.current?.role==='host'){relayRef.current=true;setRelayOnly(true);offer().catch(fail);}else sendSignal('restart',{relay:true}).catch(fail);}
   else fail(new Error(rtc.relay?'Connection timed out. Ask the host to create a new room.':'Direct connection timed out. A TURN relay is needed on one of these networks.'));
  }},25000);
  return peer;
 }
 async function offer(){if(offerBusy.current||!started.current||!approved.current||roomRef.current?.role!=='host')return;offerBusy.current=true;try{resetPeer();stream.current=engine()!.capture();const peer=await makePeer();for(const t of stream.current.getTracks())peer.addTrack(t,stream.current);setupChannel(peer.createDataChannel('controller',{ordered:false,maxPacketLifeTime:150}));await peer.setLocalDescription(await peer.createOffer());await sendSignal('offer',{...peer.localDescription?.toJSON(),relayOnly:relayRef.current});setStatus('Connecting player two…')}catch(e){resetPeer();throw e;}finally{offerBusy.current=false}}
 async function processSignal(s:Signal){if(s.kind==='restart'&&roomRef.current?.role==='host'){if(s.payload?.relay&&relayAvailableRef.current){relayRef.current=true;setRelayOnly(true);}await offer();return;}if(s.kind==='offer'&&roomRef.current?.role==='guest'){const queued=iceQueue.current;resetPeer();relayRef.current=s.payload.relayOnly===true;setRelayOnly(relayRef.current);const peer=await makePeer();await peer.setRemoteDescription({type:s.payload.type,sdp:s.payload.sdp});for(const c of queued)await peer.addIceCandidate(c);await peer.setLocalDescription(await peer.createAnswer());await sendSignal('answer',peer.localDescription);return;}if(s.kind==='answer'&&pc.current){await pc.current.setRemoteDescription(s.payload);for(const c of iceQueue.current)await pc.current.addIceCandidate(c);iceQueue.current=[];await applyStreamLimits();return;}if(s.kind==='ice'){if(pc.current?.remoteDescription)await pc.current.addIceCandidate(s.payload);else iceQueue.current.push(s.payload)}}
 async function createRoom(name:string){setRoomBusy(true);setError('');try{if(roomRef.current)await closeRoom();const r=await api({action:'create',name});remember(r);setGuest(false);setStatus('Room open. Copy the invite link.')}catch(e){fail(e)}finally{setRoomBusy(false)}}
 async function joinInvite(raw:string,name='Player 2'){if(joinBusy.current)return;joinBusy.current=true;setRoomBusy(true);setError('');try{if(roomRef.current)await closeRoom();const url=new URL(raw,location.origin);const destination=url.pathname.match(/^\/play\/([a-z0-9-]+)\/?$/)?.[1]||'ps1';if(destination!==system.id){if(!getSystem(destination))throw new Error('This invite uses an unavailable system.');parseInvite(raw);location.assign('/play/'+destination+url.search+url.hash);return}const invite=parseInvite(raw);const r=await api({...invite,action:'join',name});remember(r);setGuest(true);setStatus('Waiting for the host to let you in.')}catch(e){fail(e);setGuest(false)}finally{joinBusy.current=false;setRoomBusy(false)}}
 async function closeRoom(){const r=roomRef.current;remember(null);resetPeer();setPending(null);if(r)await api({...r,action:'leave'}).catch(()=>{});if(guest){setGuest(false);setPlaying(false)}setStatus('Ready for local play');history.replaceState(null,'',location.pathname);}
 async function approve(accept:boolean){try{const r=roomRef.current;if(!r)return;await api({...r,action:'approve',accept});setPending(null);approved.current=accept;cursor.current=0;if(accept){setStatus(started.current?'Connecting player two…':'Player approved. Start your game.');await offer()}else setStatus('Room open. Waiting for a friend.')}catch(e){fail(e)}}
 async function copyInvite(){const r=roomRef.current;if(!r?.invite)return;const url=`${location.origin}/play/${system.id}?room=${r.id}#key=${r.invite}`;try{await navigator.clipboard.writeText(url);toast.success('Invite link copied')}catch{window.prompt('Copy this invite link',url)}}
 async function selectFiles(next:File[]){if(guest)return;try{await validateFiles(next,system);if(playing){if(roomRef.current)await closeRoom();started.current=false;setPlaying(false);engineRef.current!.srcdoc=engineDocument}setFiles(next);setError('')}catch(e){fail(e)}}
 function selectBios(next:File[]){if(!next.length)return;if(next.reduce((n,f)=>n+f.size,0)>64*1048576||next.some(f=>!f.size)){fail(new Error('Choose non-empty firmware files under 64 MB.'));return}if(new Set(next.map(f=>f.name.toLowerCase())).size!==next.length){fail(new Error('Firmware filenames must be unique.'));return}if(system.id==='ps1'&&next.some(f=>!(/\.zip$/i.test(f.name)||(/\.bin$/i.test(f.name)&&f.size===524288)))){fail(new Error('Choose a 512 KB PlayStation BIOS .bin file, or a ZIP of firmware files.'));return}setBios(next);setError('')}
 async function start(){setBusy(true);setError('');try{
  if(requiresBios(system,core,files.map(f=>f.name))&&!bios.length)throw new Error('Add the firmware for '+system.name+' first. '+system.biosHint);
  const threads=threadedCores.has(core);if(threads&&!window.crossOriginIsolated)throw new Error('This emulator requires a secure browser context with shared memory. Open it in a current desktop browser.');
  if(['ppsspp','azahar'].includes(core)&&!document.createElement('canvas').getContext('webgl2'))throw new Error('This emulator requires WebGL 2. Enable hardware acceleration in your browser.');
  const file=await packageDisc(files,system);const name=files.find(f=>/\.cue$/i.test(f.name))?.name||files[0].name;
  const firmware=bios.length===1&&/\.zip$/i.test(bios[0].name)&&!['arcade','mame','cdi'].includes(system.id)?bios[0]:bios.length?await packageFiles(bios,'bios.zip'):undefined;
  boot.current={type:'boot',file,bios:firmware,name,volume,core,system:system.id,label:system.name,remotePort:system.remotePort,threads,experimental:experimentalCores.has(core)};setCanSave(false);started.current=false;setPlaying(true);setPaused(false);engineRef.current!.srcdoc=engineDocument
 }catch(e){setBusy(false);fail(e)}}
 function engineLoaded(){if(boot.current){engineRef.current?.contentWindow?.postMessage(boot.current,location.origin);boot.current=null}}
 function pause(){const next=!paused;engine()?.pause(next);setPaused(next)}
 function restart(){engine()?.restart();setPaused(false);engine()?.pause(false)}
 function fullscreen(){screenRef.current?.requestFullscreen().catch(fail)}
 function focusGame(){if(roomRef.current?.role==='guest'){videoRef.current?.focus({preventScroll:true});playRemoteVideo(true)}else engine()?.focus()}
 function exportState(){try{const bytes=engine()!.exportState(),url=URL.createObjectURL(new Blob([bytes as BlobPart]));const a=document.createElement('a');a.href=url;a.download=(files[0]?.name||system.id)+'.state';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast.success('Save state exported')}catch(e){fail(e)}}
 async function importState(file:File){try{if(file.size>32*1048576)throw new Error('This save state is too large.');engine()?.importState(await file.arrayBuffer());toast.success('Save state imported')}catch(e){fail(e)}}
 useEffect(()=>{engine()?.volume(volume);if(videoRef.current)videoRef.current.volume=volume/100},[volume]);
 useEffect(()=>{alive.current=true;const onMessage=(e:MessageEvent)=>{if(e.origin!==location.origin||e.source!==engineRef.current?.contentWindow||!e.data?.discRoom)return;if(e.data.type==='started'){setCanSave(e.data.canSave===true);started.current=true;setBusy(false);setStatus(roomRef.current?'Game running. Room open.':'Playing locally');offer().catch(fail)}if(e.data.type==='engine-error'){fail(new Error(e.data.message));setBusy(false);setPlaying(false);started.current=false;resetPeer();if(engineRef.current)engineRef.current.srcdoc=engineDocument}};window.addEventListener('message',onMessage);const pad=(e:GamepadEvent)=>setController(e.type==='gamepadconnected'?e.gamepad.id.split('(')[0].trim():'');window.addEventListener('gamepadconnected',pad);window.addEventListener('gamepaddisconnected',pad);
 let cancelled=false;
 const initialize=async()=>{
  let saved:Room|null=null;
  try{const value=JSON.parse(sessionStorage.getItem('disc-room-session-'+system.id)||'null');if(value&&/^[a-f0-9]{32}$/.test(value.id)&&/^[a-f0-9]{64}$/.test(value.token)&&['host','guest'].includes(value.role))saved=value;}catch{}
  const resume=async(r:Room)=>{const data=await api({...r,action:'resume'});if(data.role!==r.role)throw new Error('The saved room session is invalid.');remember(r);cursor.current=data.after;approved.current=data.state==='approved';setGuest(r.role==='guest');setStatus(r.role==='guest'?(data.state==='approved'?'Approved. Waiting for the host’s game.':'Waiting for the host to let you in.'):(data.state==='approved'?'Room restored. Load your game to reconnect player two.':data.state==='pending'?'Room restored. A friend is waiting for approval.':'Room open. Copy the invite link.'));};
  if(new URLSearchParams(location.search).has('room')){
   const raw=location.href;let invite:{id:string;invite:string};try{invite=parseInvite(raw)}catch(e){remember(null);fail(e);return}
   setGuest(true);setStatus('Joining the host’s room…');
   // An invite is an explicit guest request, even if a new tab copied the host's sessionStorage.
   if(saved?.role==='guest'&&saved.id===invite.id){try{await resume(saved);return}catch{remember(null)}}
   else remember(null);
   setGuest(true);await joinInvite(raw,'Player 2');return;
  }
  if(saved){try{await resume(saved)}catch(e){remember(null);setGuest(false);fail(e)}}
 };
 const poll=async()=>{
  const r=roomRef.current;
  try{if(r){
   const data=await api({...r,action:'poll',after:cursor.current});if(cancelled||roomRef.current?.token!==r.token)return;
   setFriendName(data.guestName||'Player 2');if(r.role==='host')setPending(data.state==='pending'?{name:data.guestName}:null);
   if(data.state==='approved'&&!approved.current){approved.current=true;if(r.role==='host'&&started.current)await offer();else if(r.role==='guest')setStatus('Approved. Waiting for the host’s game.')}
   if(data.state!=='approved'&&approved.current){approved.current=false;resetPeer();setStatus('Player two left. Room open.')}
   for(const s of data.signals){serial.current=serial.current.then(()=>{if(!cancelled&&roomRef.current?.token===r.token)return processSignal(s)}).catch(fail);cursor.current=Math.max(cursor.current,s.seq)}
  }}catch(e){if(!cancelled&&r&&roomRef.current?.token===r.token){remember(null);resetPeer();setPending(null);fail(e)}}finally{if(!cancelled)setTimeout(poll,1500)}
 };void initialize().then(()=>{if(!cancelled)void poll()}).catch(fail);
 let seq=0,frame=0,lastSend=0,lastPing=0;const input=(e:KeyboardEvent)=>{if(roomRef.current?.role!=='guest'||!inputEnabled.current||!connectedRef())return;const target=e.target as HTMLElement;if(target.closest('input,textarea,select,[role=dialog]'))return;if(e.code in keyMap){e.preventDefault();if(e.repeat)return;if(e.type==='keydown'){unlockSound();keys.current.add(e.code)}else keys.current.delete(e.code);sendControls();}};
 function unlockSound(){if(roomRef.current?.role==='guest'&&connectedRef()&&(videoRef.current?.muted||videoRef.current?.paused))playRemoteVideo(true)}
 function connectedRef(){return channel.current?.readyState==='open'}
 const clear=()=>{keys.current.clear();if(channel.current?.readyState==='open'&&roomRef.current?.role==='guest')channel.current.send(JSON.stringify({type:'input',seq:seq++,values:Array(24).fill(0)}));engine()?.release()};
 function sendControls(){
  const c=channel.current;if(roomRef.current?.role!=='guest'||c?.readyState!=='open'||c.bufferedAmount>4000)return;
  const values=Array(24).fill(0);
  if(inputEnabled.current&&!document.hidden){
   for(const k of keys.current)values[keyMap[k]]=keyMap[k]>=16?32767:1;
   const pad=navigator.getGamepads?.().find(p=>p?.mapping==='standard');
   if(pad){for(const [i,index]of Object.entries(padMap))if(pad.buttons[Number(i)]?.pressed)values[index]=1;
    for(let axis=0;axis<4;axis++){const value=pad.axes[axis]||0;values[16+axis*2]=Math.round(Math.max(0,value)*32767);values[17+axis*2]=Math.round(Math.max(0,-value)*32767);}
    if(pad.axes[0]<-.35)values[6]=1;if(pad.axes[0]>.35)values[7]=1;if(pad.axes[1]<-.35)values[4]=1;if(pad.axes[1]>.35)values[5]=1;
   }
  }
  c.send(JSON.stringify({type:'input',seq:seq++,values}));lastSend=performance.now();
 }
 const tick=(at:number)=>{const c=channel.current;if(c?.readyState==='open'){if(at-lastPing>2000){c.send(JSON.stringify({type:'ping',at:performance.now()}));lastPing=at;}if(at-lastSend>33)sendControls();}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);window.addEventListener('keydown',input);window.addEventListener('keyup',input);window.addEventListener('pointerdown',unlockSound);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 const context=(document as any).modelContext,lifecycle=new AbortController();if(context?.registerTool){try{for(const tool of [{name:'get_console_status',description:'Read the selected game and room connection status.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({room:roomRef.current?.id||null,role:roomRef.current?.role||'local',gameRunning:started.current,connected:connectedRef()})},{name:'set_game_volume',description:'Set the local game audio volume from 0 to 100.',inputSchema:{type:'object',properties:{volume:{type:'integer',minimum:0,maximum:100}},required:['volume'],additionalProperties:false},execute:(input:any)=>{if(!Number.isInteger(input?.volume)||input.volume<0||input.volume>100)throw new Error('Volume must be an integer from 0 to 100.');setVolume(input.volume);return {volume:input.volume}}}])Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}}
 return()=>{cancelled=true;alive.current=false;lifecycle.abort();cancelAnimationFrame(frame);window.removeEventListener('message',onMessage);window.removeEventListener('gamepadconnected',pad);window.removeEventListener('gamepaddisconnected',pad);window.removeEventListener('keydown',input);window.removeEventListener('keyup',input);window.removeEventListener('pointerdown',unlockSound);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);resetPeer()};
 },[]);
 return {quality,changeQuality,network,inputStatus,relayAvailable,relayWarning,relayOnly,streamWarning,tryRelay,canSave,core,setCore,files,bios,volume,setVolume,playing,busy,guest,paused,connected,error,controller,room,roomBusy,friendName,pending,status,ping,screenRef,engineRef,videoRef,selectFiles,selectBios,start,engineLoaded,pause,restart,fullscreen,focusGame,createRoom,joinInvite,closeRoom,approve,copyInvite,exportState,importState};
}
