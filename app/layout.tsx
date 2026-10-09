import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Disc Room — Retro games with friends',description:'Bring your own game. Choose from 39 retro systems and invite a friend.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
