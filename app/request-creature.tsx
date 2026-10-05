'use client';

import {useEffect, useId, useRef, useState, type CSSProperties, type FormEvent} from 'react';

const field: CSSProperties = {display:'block', width:'100%', boxSizing:'border-box', marginTop:7, padding:'11px 12px', border:'1px solid #c5d0ba', borderRadius:3, background:'#faf8ef', color:'#244e3d', font:'inherit', fontSize:12};
const label: CSSProperties = {display:'block', marginTop:17, fontSize:11, color:'#4c6957', textAlign:'left'};

export default function RequestCreature() {
  const [open, setOpen] = useState(false);
  const [species, setSpecies] = useState('');
  const [why, setWhy] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<'demo' | 'browser' | null>(null);
  const [error, setError] = useState('');
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {if (open) input.current?.focus();}, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/requests', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({species:species.trim(), why:why.trim()}),
        signal:AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (response.status === 501 && result.storage === 'browser') {
        try {
          const storageKey = 'seafood-stories:creature-requests';
          let previous: unknown = [];
          try {previous = JSON.parse(localStorage.getItem(storageKey) || '[]');} catch {previous = [];}
          const entries = Array.isArray(previous) ? previous.slice(-99) : [];
          entries.push({species:species.trim(), why:why.trim(), createdAt:new Date().toISOString()});
          localStorage.setItem(storageKey, JSON.stringify(entries));
        } catch {
          throw new Error('Your browser could not save this suggestion. Browser storage may be disabled.');
        }
        setSaved('browser');
        setSpecies('');
        setWhy('');
        return;
      }
      if (!response.ok || !result.saved) throw new Error(result.error || 'Your request could not be saved. Please try again.');
      setSaved('demo');
      setSpecies('');
      setWhy('');
    } catch (caught) {
      setError(caught instanceof Error && !['TimeoutError','AbortError'].includes(caught.name) ? caught.message : 'The save timed out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <div style={{marginTop:24, color:'#7c8c73', fontSize:11, lineHeight:1.7}}>
    <span>More creatures swimming soon</span><span aria-hidden="true"> · </span>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => {setOpen(!open); setSaved(null); setError('');}} style={{background:'transparent', color:'#41694f', padding:'3px 0', border:0, borderBottom:'1px solid #a3b497', font:'inherit', cursor:'pointer'}}>
      Request a creature
    </button>
    {open && <section id={`${id}-panel`} aria-labelledby={`${id}-title`} style={{maxWidth:430, margin:'17px auto 0', padding:'23px 25px', background:'#eef0e3', border:'1px solid #d1dac5', borderRadius:4, textAlign:'left'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
        <h3 id={`${id}-title`} style={{margin:0, color:'#315540', fontFamily:"'Instrument Serif', Georgia, serif", fontSize:27, fontWeight:400}}>Who should swim in next?</h3>
        <button type="button" onClick={close} aria-label="Close creature request" style={{background:'transparent', color:'#617d59', border:0, cursor:'pointer', padding:'5px 7px', fontSize:20, lineHeight:1}}>×</button>
      </div>
      {saved ? <div role="status" style={{marginTop:18, color:'#315b40'}}>
        <p style={{margin:0}}>{saved === 'browser' ? 'Saved in this browser. Requests aren’t sent to the creator yet.' : 'Saved to this demo’s request list.'}</p>
        <p style={{margin:'5px 0 0', color:'#7c8c73'}}>{saved === 'browser' ? 'Clearing this browser’s saved data removes your suggestions.' : 'Thanks for helping the field guide grow.'}</p>
        <button type="button" onClick={() => {setSaved(null); setTimeout(() => input.current?.focus(), 0);}} style={{marginTop:15, background:'transparent', border:0, borderBottom:'1px solid #a3b497', padding:'3px 0', color:'#41694f', cursor:'pointer', font:'inherit'}}>Suggest another creature</button>
      </div> : <form onSubmit={submit} aria-busy={busy}>
        <label htmlFor={`${id}-species`} style={label}>Creature name
          <input ref={input} id={`${id}-species`} name="species" value={species} onChange={event => setSpecies(event.target.value)} required minLength={2} maxLength={100} placeholder="e.g. Cuttlefish or leafy seadragon" autoComplete="off" disabled={busy} style={field}/>
        </label>
        <label htmlFor={`${id}-why`} style={label}>What would you like to discover? <span style={{color:'#87977e'}}>(optional)</span>
          <textarea id={`${id}-why`} name="why" value={why} onChange={event => setWhy(event.target.value)} maxLength={500} rows={3} placeholder="Its habitat, its surprising life story…" disabled={busy} style={{...field, resize:'vertical', minHeight:80}}/>
        </label>
        <p id={`${id}-note`} style={{fontSize:10, color:'#809174', margin:'12px 0'}}>No email address needed. We’ll tell you where your suggestion is saved.</p>
        {error && <p role="alert" style={{fontSize:11, color:'#99512e', margin:'10px 0'}}>{error}</p>}
        <button type="submit" disabled={busy || species.trim().length < 2} aria-describedby={`${id}-note`} style={{background:'#31573f', color:'#f6f2df', border:0, borderRadius:3, padding:'11px 15px', font:'inherit', fontSize:11, cursor:busy ? 'wait' : 'pointer', opacity:busy || species.trim().length < 2 ? 0.6 : 1}}>{busy ? 'Saving…' : 'Save my suggestion'}</button>
      </form>}
    </section>}
  </div>;
}
