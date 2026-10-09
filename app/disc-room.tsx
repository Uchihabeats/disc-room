"use client";
import { useEffect, useRef, useState } from "react";
import { FileUp, Gamepad2, Maximize, Pause, Play, RotateCcw, Copy, X, Volume2, Settings2, Check, Loader2, Download, ArrowUpRight, Disc3, Cpu, Users, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Toaster, toast } from "sonner";
import {SiteHeader,SiteFooter} from './site-shell';
import {engineDocument} from './engine-document';
import { useDiscRoom } from "./use-disc-room";
import {ConnectionPanel} from './connection-panel';

import {getSystem,requiresBios,experimentalCores,remoteHint} from './systems';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';

export default function Page({systemId='ps1'}:{systemId?:string}) {
 const system=getSystem(systemId)!;
 const app = useDiscRoom(system);
 const discInput = useRef<HTMLInputElement>(null), biosInput = useRef<HTMLInputElement>(null), saveInput = useRef<HTMLInputElement>(null);
 const [settings,setSettings]=useState(false),[name,setName]=useState('Player 1'),[join,setJoin]=useState(''),[drag,setDrag]=useState(false);
 useEffect(()=>{if(app.error)toast.error(app.error)},[app.error]);
 const choose=()=>discInput.current?.click();
 return <main className="chassis">
  <SiteHeader/>

  <div className="system-bar"><span className="system-name">YOUR DISC. YOUR PEOPLE.</span><span className="system-detail">ONE CONSOLE. DIFFERENT POSTCODES.</span><a href="/emulators" className="system-tag change-console">← CHANGE CONSOLE</a></div>
  <section className="workspace" aria-label={system.name+' session'}>
   <div className="console-column">
    <div className={`screen ${app.playing?'is-playing':''} ${drag?'dragging':''}`} ref={app.screenRef} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);app.selectFiles(Array.from(e.dataTransfer.files))}}>
     {app.playing&&<div className="screen-caption"><span>VIDEO / 01</span><span>{app.guest?'REMOTE SIGNAL':'LOCAL SIGNAL'}</span></div>}
     <iframe ref={app.engineRef} srcDoc={engineDocument} title={system.name+' emulator'} className={app.playing&&!app.guest?'engine active':'engine'} allow="autoplay; fullscreen; gamepad" onLoad={app.engineLoaded}/>
     <video ref={app.videoRef} className={app.guest&&app.connected?'remote-video active':'remote-video'} playsInline autoPlay tabIndex={app.guest?0:-1} aria-label="Remote game. Click to enable keyboard controls." onClick={app.focusGame}/>
     {(!app.playing||(app.guest&&!app.connected))&&<div className="empty-screen">
      <span className="session-sticker" aria-hidden="true">{system.short}<br/>{app.guest?'PLAYER':'LOCAL'}<br/>{app.guest?'TWO':'+ REMOTE'}</span>
      {!app.guest&&system.image&&<div className="idle-console-art" aria-hidden="true"><img src={system.image} alt="" width={1536} height={1024}/></div>}
      <h1>{app.guest?<>TAKE<br/>P2.</>:app.files.length?<>LET’S<br/>PLAY.</>:<>PRESS<br/>PLAY.</>}</h1>
      <div className="empty-kicker">{app.guest?'PLAYER TWO / YOUR SEAT IS HERE':system.short+' / BRING YOUR OWN GAME'}</div>
      <p>{app.guest?'Waiting for the host’s game. Keep this tab open.':app.files.length?app.files[0].name:'Old games. New hangouts. Bring a game and a friend.'}</p>
      {!app.guest&&<button className="primary-button" disabled={app.busy} onClick={app.files.length?app.start:choose}>{app.busy?<Loader2 className="spin" size={18}/>:app.files.length?<Play size={17}/>:<FileUp size={18}/>} {app.busy?'Preparing game…':app.files.length?'Start game':'Choose game files'}<ArrowUpRight size={18}/></button>}
      <span className="drop-note">{app.guest?app.status:system.extensions.map(f=>f.toUpperCase()).join(' / ')+' — or drop files here'}</span>
     </div>}
     {app.playing&&app.guest&&<button className="screen-focus" onClick={app.focusGame}><Gamepad2 size={15}/>Enable sound & controls</button>}
    </div>
    <div className="transport">
     <div className="transport-buttons">
      <button aria-label={app.paused?'Resume':'Pause'} title={app.paused?'Resume':'Pause'} disabled={!app.playing||app.guest} onClick={app.pause}>{app.paused?<Play size={18}/>:<Pause size={18}/>}<span>{app.paused?'Resume':'Pause'}</span></button>
      <button aria-label="Restart" title="Restart" disabled={!app.playing||app.guest} onClick={app.restart}><RotateCcw size={17}/><span>Restart</span></button>
      <button aria-label="Fullscreen" title="Fullscreen" disabled={!app.playing} onClick={app.fullscreen}><Maximize size={17}/><span>Fullscreen</span></button>
      <button className="settings-button" onClick={()=>setSettings(true)}><Settings2 size={17}/><span>Controls & saves</span></button>
     </div>
     <div className="volume"><Volume2 size={17}/><Slider value={[app.volume]} onValueChange={v=>app.setVolume(v[0])} max={100} step={1} aria-label="Game volume"/><span>{app.volume}</span></div>
    </div>
    <div className="file-rack">
     <div className="file-row"><div className="file-heading"><span className="index">01 /</span><span className="file-label"><Disc3 size={15} aria-hidden="true"/>THE GAME</span></div><div className="file-info"><strong>{app.guest?'Game runs on the host':app.files.length?app.files[0].name:'No game. Yet.'}</strong><span>{app.files.length?`${app.files.length} file${app.files.length>1?'s':''} · ${(app.files.reduce((s,f)=>s+f.size,0)/1048576).toFixed(1)} MB`:system.extensions.map(f=>f.toUpperCase()).join(' / ')}</span></div><button className="outline-button" onClick={choose} disabled={app.guest}>{app.files.length?'Change game':'Choose files'}<ArrowUpRight size={15}/></button></div>
     <div className="file-row"><div className="file-heading"><span className="index">02 /</span><span className="file-label"><Cpu size={15} aria-hidden="true"/>THE BIOS</span><span className="optional-tag">{requiresBios(system,app.core,app.files.map(f=>f.name))?'REQUIRED':system.bios.toUpperCase()}</span></div><div className="file-info"><strong>{app.guest?'Provided by the host':app.bios.length?app.bios.map(f=>f.name).join(', '):'Your console. Your BIOS.'}</strong><span>{system.biosHint||'This system runs without additional firmware.'}</span></div><button className="outline-button" onClick={()=>biosInput.current?.click()} disabled={app.guest}>{app.bios.length?'Replace':'Add firmware'}<ArrowUpRight size={15}/></button></div>
    </div>
    <div className="core-rack"><div className="file-heading"><span className="index">03 /</span><label className="file-label" id="core-label"><Cpu size={15} aria-hidden="true"/>EMULATOR CORE</label></div><Select value={app.core} onValueChange={app.setCore} disabled={app.playing||app.busy||app.guest}><SelectTrigger aria-labelledby="core-label"><SelectValue>{app.core}{experimentalCores.has(app.core)?' · experimental':''}</SelectValue></SelectTrigger><SelectContent>{system.cores.map(c=><SelectItem value={c} key={c}>{c}{experimentalCores.has(c)?' · experimental':''}</SelectItem>)}</SelectContent></Select><p>{experimentalCores.has(app.core)?(app.core==='bsnes'?'Experimental build. Save states are unavailable; choose snes9x for state backups. ':'Experimental build. Compatibility and performance vary. '):''}{system.biosHint}</p><p>{remoteHint(system)}</p></div>
   </div>
   <aside className="room-panel" id="the-room">
    <div className="room-heading"><span className="eyebrow"><Users size={15} aria-hidden="true"/>THE ROOM /</span><span className="room-capacity">02 SEATS</span></div>
    <h2>BRING A<br/><span>FRIEND.</span></h2><p className="room-intro">Same game. Different places.</p>
    <div className="seat"><span className="seat-number">01</span><div><strong>{app.guest?'Host':name||'Player 1'} {!app.guest&&<span className="you-tag">YOU</span>}</strong><span>{app.guest?'Runs the console':app.controller||'Keyboard / controller'}</span></div><Gamepad2 size={21}/></div>
    <div className={`seat ${app.connected?'':'empty-seat'}`}><span className="seat-number">02</span><div><strong>{app.connected?(app.guest?'You':app.friendName):app.guest?'You':'Open seat'}</strong><span>{app.connected?'Connected':app.room?'Waiting for player two':'Got someone in mind?'}</span></div>{app.connected?<Check size={20}/>:<span className="seat-dash">+</span>}</div>
    {!app.guest&&<div className="room-actions"><label className="field-label" htmlFor="player-name">YOUR NAME</label><input id="player-name" maxLength={24} value={name} onChange={e=>setName(e.target.value)}/>{!app.room?<button className="room-button" disabled={app.roomBusy} onClick={()=>app.createRoom(name)}>{app.roomBusy?<Loader2 size={17} className="spin"/>:<Gamepad2 size={18}/>}<span>Create a room</span></button>:<><div className="invite-code"><span>ROOM /</span><strong>{app.room.id.slice(0,8).toUpperCase()}</strong></div><button className="room-button" onClick={app.copyInvite}><Copy size={17}/><span>Copy invite link</span></button><button className="text-button close-room" onClick={app.closeRoom}><X size={14}/> Close room</button></>}</div>}
    {app.pending&&<div className="join-request"><strong>{app.pending.name} wants to join.</strong><div><button className="outline-button" onClick={()=>app.approve(true)}>Let them in</button><button className="text-button" onClick={()=>app.approve(false)}>Decline</button></div></div>}
    <div className="room-status" role="status"><span className="status-rule"/><span>{app.status}</span>{app.ping!==null&&<small>{app.ping} ms round trip</small>}</div>
    {app.room&&<ConnectionPanel {...app}/>}
    {!app.room&&!app.guest&&<div className="join-box"><label className="field-label" htmlFor="invite">ON THE GUEST LIST?</label><input id="invite" placeholder="Paste your friend’s link" value={join} onChange={e=>setJoin(e.target.value)}/><button className="text-button" disabled={!join.trim()} onClick={()=>app.joinInvite(join,name)}><Link2 size={16} aria-hidden="true"/>Join their room</button></div>}
    {app.guest&&<button className="outline-button" onClick={app.closeRoom}>Leave room</button>}
    <div className="room-footnote"><span className="tiny-square"/><p>The host keeps the game open.<br/>Your files stay on your device.</p></div>
   </aside>
  </section>
  <SiteFooter/>
  <input ref={discInput} type="file" multiple accept={system.extensions.map(f=>'.'+f).join(',')} hidden onChange={e=>{app.selectFiles(Array.from(e.target.files||[]));e.target.value=''}}/>
  <input ref={biosInput} type="file" multiple hidden onChange={e=>{app.selectBios(Array.from(e.target.files||[]));e.target.value=''}}/>
  <input ref={saveInput} type="file" accept=".state" hidden onChange={e=>{if(e.target.files?.[0])app.importState(e.target.files[0]);e.target.value=''}}/>
  <Dialog open={settings} onOpenChange={setSettings}><DialogContent className="settings-dialog"><DialogHeader><span className="eyebrow">CONSOLE SETTINGS /</span><DialogTitle className="dialog-title">YOUR RULES.</DialogTitle><DialogDescription>Controls and saves for {system.name}.</DialogDescription></DialogHeader><Tabs defaultValue="controls"><TabsList variant="line"><TabsTrigger value="controls">Controls</TabsTrigger><TabsTrigger value="saves">Save files</TabsTrigger></TabsList><TabsContent value="controls"><div className="control-table">{[['D-pad','Arrow keys'],[system.id==='ps1'?'Cross / Circle':'B / A','X / Z'],[system.id==='ps1'?'Square / Triangle':'Y / X','A / S'],['L1 / R1','Q / E'],['L2 / R2','1 / 3'],['Start / Select','Enter / Shift'],['Left stick','F / H / T / G'],['Right stick','J / L / I / K']].map(([a,b])=><div key={a}><span>{a}</span><kbd>{b}</kbd></div>)}</div><p className="settings-note">Click the game to enable keyboard controls. Connect a gamepad and press a button to detect it.</p><p className="settings-note">Your friend uses the same keys. {remoteHint(system)} Controller mapping is available in the emulator menu. For computers, use the emulator’s keyboard controls on the host.</p></TabsContent><TabsContent value="saves"><p className="settings-note">In-game saves stay on this browser when supported by the core. Export a save state to keep a backup or move this game to another device.</p><button className="outline-button" disabled={!app.playing||app.guest||!app.canSave} onClick={app.exportState}><Download size={17}/> Export save state</button><button className="outline-button" disabled={!app.playing||app.guest||!app.canSave} onClick={()=>saveInput.current?.click()}><FileUp size={17}/> Import save state</button><p className="settings-note">{!app.canSave&&app.playing?'Save states are unavailable in this core. ':''}Use save states with the same game and emulator version. The host manages saves during remote play.</p></TabsContent></Tabs></DialogContent></Dialog>
  <Toaster position="bottom-center" theme="dark" richColors/>
 </main>;
}
