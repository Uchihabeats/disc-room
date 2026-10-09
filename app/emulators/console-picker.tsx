"use client";
import { useRef, useState } from "react";
import { ChevronUp, ChevronDown, Gamepad2, Users, Cpu, Disc3, MonitorPlay, Clock3, Mouse } from "lucide-react";

import {systems,biosLabel,remoteHint} from '../systems';
const consoles=systems;
const ROW_HEIGHT=88;

export default function ConsolePicker(){
 const [selected,setSelected]=useState(0);
 const wheel=useRef<HTMLDivElement>(null);
 const console=consoles[selected];
 const select=(index:number)=>{
  const next=Math.max(0,Math.min(consoles.length-1,index));
  wheel.current?.scrollTo({top:next*ROW_HEIGHT,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
 const onKeyDown=(e:React.KeyboardEvent<HTMLDivElement>)=>{
  let next:number;
  if(e.key==='ArrowDown'||e.key==='ArrowRight')next=selected+1;
  else if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=selected-1;
  else if(e.key==='Home')next=0;
  else if(e.key==='End')next=consoles.length-1;
  else return;
  e.preventDefault();select(next);
 };
 return <section className="wheel-layout" aria-label="Choose your emulator">
  <article className={`selected-console ${console.available?'selected-ready':'selected-future'}`} aria-label={console.name+' preview'}>
   <div className="selected-console-cap"><span>{String(selected+1).padStart(2,'0')} / {console.maker}</span><span className="console-availability">{console.available?(console.experimental?'EXPERIMENTAL':'READY TO LOAD'):'UNAVAILABLE'}</span></div>
   <h1 aria-label={console.name} className={console.id==='ps1'?'':'catalog-title'}>{console.id==='ps1'?<>PLAY<br/>STATION<span className="selected-generation">1</span></>:console.name.toUpperCase()}</h1>
   <div className="selected-art">{console.image?<img key={console.id} src={console.image} alt={console.name+' hardware'} width={1536} height={1024} fetchPriority="high"/>:<div className="catalog-emblem"><span>{console.maker} / {console.kind.toUpperCase()}</span>{console.kind==='computer'?<MonitorPlay aria-hidden="true"/>:console.kind==='arcade'?<Disc3 aria-hidden="true"/>:<Gamepad2 aria-hidden="true"/>}<strong>{console.short}</strong></div>}</div>
   {console.image?.startsWith('/images/hardware/')&&<a className="console-image-credit" href="/images/hardware/ATTRIBUTION.txt" target="_blank" rel="noreferrer">Hardware images: Carbon · image credits</a>}
   <p className="selected-description">{console.available?remoteHint(console):console.biosHint}</p>
   {console.available?<><ul className="selected-features"><li><Gamepad2 size={18} aria-hidden="true"/>Local + remote controller</li><li><Cpu size={18} aria-hidden="true"/>{biosLabel(console)}</li></ul><p className="selected-formats"><Disc3 size={16} aria-hidden="true"/>{console.extensions.map(f=>f.toUpperCase()).join(' / ')}</p><p className="selected-future-note">{console.biosHint}</p>{console.experimental&&<p className="selected-future-note">Experimental build. A capable desktop browser is recommended.</p>}</>:<p className="selected-future-note"><Clock3 size={18} aria-hidden="true"/>Waiting for an available browser core.</p>}
  </article>
  <aside className="wheel-panel" aria-labelledby="wheel-title">
   <div className="wheel-panel-cap"><span>THE LINEUP /</span><span>{consoles.filter(c=>c.available).length} SYSTEMS</span></div>
   <h2 id="wheel-title">PICK YOUR<br/>CONSOLE.</h2>
   <p className="wheel-instruction"><Mouse size={16} aria-hidden="true"/>Scroll or swipe to choose.</p>
   <div className="wheel-frame">
    <span className="wheel-selection-band" aria-hidden="true"/>
    <div className="wheel-scroll" ref={wheel} role="listbox" aria-label="Choose a console" aria-activedescendant={'console-option-'+console.id} tabIndex={0} onKeyDown={onKeyDown} onScroll={e=>setSelected(Math.max(0,Math.min(consoles.length-1,Math.round(e.currentTarget.scrollTop/ROW_HEIGHT))))}>
     <div className="wheel-options">
      {consoles.map((item,index)=><div key={item.id} id={'console-option-'+item.id} className={`wheel-option ${index===selected?'is-selected':''}`} role="option" aria-selected={index===selected} aria-label={item.name+(item.available?' — available':' — unavailable')} onClick={()=>select(index)}><span>{item.name}</span><small>{item.maker} / {item.available?(item.experimental?'EXPERIMENTAL':'READY'):'UNAVAILABLE'}</small></div>)}
     </div>
    </div>
    <button className="wheel-step wheel-step-up" aria-label="Previous console" disabled={selected===0} onClick={()=>select(selected-1)}><ChevronUp size={22}/></button>
    <button className="wheel-step wheel-step-down" aria-label="Next console" disabled={selected===consoles.length-1} onClick={()=>select(selected+1)}><ChevronDown size={22}/></button>
   </div>
   <div className="wheel-choice-summary" aria-live="polite"><span>SELECTED /</span><strong>{console.name}</strong></div>
   {console.available?<a href={'/play/'+console.id} className="primary-button wheel-launch"><MonitorPlay size={19} aria-hidden="true"/>Launch {console.short}</a>:<button className="primary-button wheel-launch" disabled><Clock3 size={18} aria-hidden="true"/>System unavailable</button>}
   <p className="wheel-help">{console.available?'Bring your game. Keep a seat for your friend.':'Choose any available system to start playing.'}</p>
  </aside>
 </section>;
}
