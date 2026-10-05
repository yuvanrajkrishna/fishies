import type {CSSProperties} from 'react';
import type {Creature} from '@/lib/catalogue';
export function Sprite({atlas,cell=0,rows=3,className='',label}:{atlas:string;cell?:number;rows?:number;className?:string;label?:string}){return <span role={label?'img':undefined} aria-label={label} aria-hidden={!label} className={`sprite ${className}`} style={{backgroundImage:`url('/art/${atlas}.png')`,backgroundSize:`300% ${rows*100}%`,backgroundPosition:`${(cell%3)*50}% ${Math.floor(cell/3)*100/(rows-1)}%`} as CSSProperties}/>;}
export function Specimen({fish,className=''}:{fish:Creature;className?:string}){return <Sprite atlas={fish.atlas} cell={fish.cell} rows={fish.rows} className={className} label={`Pixel illustration of ${fish.name}`}/>;}
