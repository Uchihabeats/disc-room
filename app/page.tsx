import { Gamepad2, Disc3, Users, Link2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "./site-shell";
import { LegacyInvite } from "./legacy-invite";
import { LandingFilm } from "./landing-film";
import Link from "next/link";

export default function HomePage(){
 return <main className="chassis public-page">
  <LegacyInvite/>
  <SiteHeader/>
  <section className="landing-hero" aria-labelledby="landing-title">
   <div className="landing-topline"><span>THE BROWSER COUCH</span><span>BRING YOUR OWN ROM</span></div>
   <h1 className="landing-title" id="landing-title">PLAY.<br/>TOGETHER.</h1>
   <span className="landing-sticker" aria-hidden="true">PLAYER<br/>TWO<br/>WANTED</span>
   <div className="landing-bottom">
    <div className="landing-copy">
     <span className="empty-kicker">OLD GAMES / NEW HANGOUTS</span>
     <p>Your favourite games. Your favourite people.<br className="desktop-break"/> One console, even when you’re miles apart.</p>
     <div className="landing-actions"><Link href="/emulators" className="primary-button"><Gamepad2 size={20} aria-hidden="true"/>Choose a console</Link><Link href="/play/ps1#the-room" className="outline-button"><Link2 size={18} aria-hidden="true"/>Got an invite?</Link></div>
     <span className="landing-note">39 SYSTEMS. BRING YOUR FAVOURITE.</span>
    </div>
    <figure className="couch-poster hero-artwork">
     <div className="poster-cap"><span>THE SAME GAME /</span><span>02 PLACES</span></div>
     <div className="hero-artwork-visual"><img src="/images/playstation-cutout.webp" alt="Stylized gray PlayStation console with two controllers and a game disc" width={1536} height={1024} fetchPriority="high"/></div>
     <figcaption className="hero-artwork-caption"><span><Gamepad2 size={18} aria-hidden="true"/><strong>P1</strong> At your place.</span><span><Users size={18} aria-hidden="true"/><strong>P2</strong> At theirs.</span></figcaption>
     <div className="poster-foot">DISTANCE DOESN’T GET A TURN.</div>
    </figure>
   </div>
  </section>
  <LandingFilm/>
  <section className="how-section" id="how-it-works" aria-labelledby="how-title">
   <div className="how-heading"><span className="eyebrow">THE SETUP /</span><h2 id="how-title">THREE STEPS.<br/>THEN IT’S YOUR TURN.</h2></div>
   <ol className="how-steps">
    <li><span className="step-number">01<Gamepad2 size={22} aria-hidden="true"/></span><div><h3>Pick your console.</h3><p>From PlayStation to Nintendo, Sega, arcade and classic computers. Pick your system and open a room.</p></div></li>
    <li><span className="step-number">02<Disc3 size={22} aria-hidden="true"/></span><div><h3>Bring the game.</h3><p>Load a game from your device. Add firmware when your system needs it. Your files stay local.</p></div></li>
    <li><span className="step-number">03<Users size={22} aria-hidden="true"/></span><div><h3>Save a seat.</h3><p>Create a room, send your friend the invite and let them join your game. The host keeps the game open.</p></div></li>
   </ol>
  </section>
  <div className="landing-last"><p>THE COUCH IS<br/>WHEREVER YOU ARE.</p><Link className="primary-button" href="/emulators"><Gamepad2 size={19} aria-hidden="true"/>Let’s play</Link></div>
  <SiteFooter/>
 </main>;
}
