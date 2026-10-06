import {creatures, type Route} from '@/lib/catalogue';
import {apiKey,apiError,checkRequest,publicUrl,safeError,signedUrl} from '@/lib/tinyfish';
export const runtime='nodejs';
export const maxDuration=120;
type SearchResult={title:string;url:string;snippet:string;site_name?:string};
export async function POST(req:Request){try{
 checkRequest(req);const key=apiKey(req);const {species,route,location,country}=await req.json();const fish=creatures.find(c=>c.id===species);
 if(!fish||!fish.routes.includes(route as Route)||typeof location!=='string'||location.trim().length<2||location.length>120||! /^[A-Z]{2}$/.test(country))return Response.json({error:'Choose a creature, a route and a location.'},{status:400});
 const intent=route==='see'?'public aquarium exhibit visitor':route==='eat'?'restaurant menu':'fishmonger seafood buy';
 const query=`${fish.menu} ${intent} ${location.trim()}`;
 const params=new URLSearchParams({query,location:country,language:'en',purpose:`Find official ${intent} pages for ${fish.name} near ${location}. Specific species matches preferred; never infer current availability.`,exclude_domains:'pinterest.com,facebook.com,instagram.com,tiktok.com,tripadvisor.com,yelp.com,opentable.com,thefork.com'});
 const sr=await fetch(`https://api.search.tinyfish.ai?${params}`,{headers:{'X-API-Key':key},cache:'no-store',signal:AbortSignal.timeout(35000)});
 if(!sr.ok)throw new Error(safeError(sr.status));const search=await sr.json();
 const results:SearchResult[]=(search.results||[]).filter((r:SearchResult)=>publicUrl(r.url)).slice(0,5);
 let pages:{url:string;final_url?:string;text?:string;title?:string}[]=[];let fetchWarning='';
 if(results.length){try{const fr=await fetch('https://api.fetch.tinyfish.ai',{method:'POST',headers:{'X-API-Key':key,'Content-Type':'application/json'},body:JSON.stringify({urls:results.map(r=>r.url),format:'markdown',links:true,image_links:false,ttl:0,per_url_timeout_ms:30000}),cache:'no-store',signal:AbortSignal.timeout(65000)});if(!fr.ok)throw new Error(safeError(fr.status));const data=await fr.json();pages=data.results||[];if(data.errors?.length)fetchWarning='Some pages could not be read. Those results are labelled as search leads.';}catch(e){fetchWarning=e instanceof Error?e.message:'Page checks were unavailable.';}}
 const tokens=[fish.menu.toLowerCase(),fish.name.toLowerCase(),fish.latin.toLowerCase()];
 return Response.json({query,checkedAt:new Date().toISOString(),location,route,species,endpoints:['Search',...(pages.length?['Fetch']:[])],warning:fetchWarning,results:results.map((r)=>{const p=pages.find(p=>p.url===r.url);const content=typeof p?.text==='string'?p.text:'';const clean=content.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*_>|]/g,'');const lines=clean.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>20);const matched=lines.filter(line=>tokens.some(t=>line.toLowerCase().includes(t)));return {...r,title:p?.title||r.title,checked:!!content,mention:matched.length>0,exactSpecies:content.toLowerCase().includes(fish.latin.toLowerCase()),excerpts:matched.slice(0,2).map(x=>x.slice(0,350)),token:signedUrl(r.url,key)};})});
 }catch(e){return apiError(e,'Discovery is unavailable. Try again.');}}
