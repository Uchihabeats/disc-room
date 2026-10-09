export function SiteHeader({selection=false}:{selection?:boolean}){
 return <header className="masthead public-masthead">
  <a href="/" className="wordmark" aria-label="Disc Room home">DISC ROOM<span className="brand-star">*</span></a>
  <nav className="header-nav" aria-label="Main navigation">
   <a className="text-button" href="/#how-it-works">How it works</a>
   <a className="text-button" href="/emulators" aria-current={selection?'page':undefined}>Consoles</a>
  </nav>
  <span className="edition">YOUR FRIENDS. YOUR GAMES.</span>
 </header>;
}
export function SiteFooter(){
 return <footer className="footer"><span>DISC ROOM © {new Date().getFullYear()}</span></footer>;
}
