import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Fishies — explore sea life',description:'An illustrated field guide to sea creatures, their extraordinary lives, and the places you can discover them. Live discoveries powered by TinyFish.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
