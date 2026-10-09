import type { Metadata } from "next";
import { ArrowLeft, Disc3 } from "lucide-react";
import { SiteHeader, SiteFooter } from "../site-shell";
import ConsolePicker from "./console-picker";
export const metadata:Metadata={title:'Choose a console — Disc Room'};

export default function EmulatorsPage(){
 return <main className="chassis public-page selector-page">
  <SiteHeader selection/>
  <div className="landing-topline"><span>THE LINEUP / YOUR NEXT SESSION</span><span>39 SYSTEMS / YOUR CHOICE</span></div>
  <ConsolePicker/>
  <div className="selector-bottom"><a href="/" className="text-button"><ArrowLeft size={16}/>Back to the hangout</a><span><Disc3 size={15} aria-hidden="true"/>Your game files stay on your device.</span></div>
  <SiteFooter/>
 </main>;
}
