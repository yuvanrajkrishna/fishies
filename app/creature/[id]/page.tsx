import {notFound} from 'next/navigation';
import {creatures} from '@/lib/catalogue';
import Detail from '../../detail';
export function generateStaticParams(){return creatures.map(c=>({id:c.id}));}
export default async function CreaturePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const fish=creatures.find(c=>c.id===id);if(!fish)notFound();return <Detail fish={fish}/>;}
