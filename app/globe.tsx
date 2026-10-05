'use client';
import {useMemo,useState} from 'react';
import {geoOrthographic,geoPath,geoGraticule,geoDistance} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/land-110m.json';
export default function Globe({coords}:{coords:[number,number][]}){
 const [offset,setOffset]=useState(0);const center=coords[0];const lon=center[0]+offset;
 const projection=geoOrthographic().translate([230,220]).scale(196).rotate([-lon,-20]);const path=geoPath(projection);
 const land=useMemo(()=>feature(world,world.objects.land),[]);
 return <div className="globe-wrap"><svg viewBox="0 0 460 440" role="img" aria-label="Rotatable globe with illustrative habitat region markers"><defs><radialGradient id="ocean"><stop offset="0%" stopColor="#235e62"/><stop offset="100%" stopColor="#092f3c"/></radialGradient></defs><circle cx="230" cy="220" r="206" fill="none" stroke="#86b1a0" strokeDasharray="2 9" opacity=".5"/><path d={path({type:'Sphere'})||''} fill="url(#ocean)"/><path d={path(geoGraticule().step([30,30])())||''} fill="none" stroke="#8aada2" strokeWidth=".6" opacity=".25"/><path d={path(land)||''} fill="#b0c5a3" stroke="#79a490" strokeWidth=".45"/>{coords.map((c,i)=>{const p=projection(c);return p&&geoDistance(c,[lon,20])<Math.PI/2?<g key={i}><circle cx={p[0]} cy={p[1]} r="16" fill="#f2ad73" opacity=".16"/><circle cx={p[0]} cy={p[1]} r="6" fill="#f2ad73" stroke="#ffe4ba" strokeWidth="2"/></g>:null;})}<text x="230" y="20" textAnchor="middle" fill="#91b0a4" fontSize="9" letterSpacing="3">AN OCEAN OF POSSIBILITIES</text></svg><label className="globe-control"><span>WEST</span><input aria-label="Rotate the globe" type="range" min="-180" max="180" value={offset} onChange={e=>setOffset(+e.target.value)}/><span>EAST</span></label></div>;
}
