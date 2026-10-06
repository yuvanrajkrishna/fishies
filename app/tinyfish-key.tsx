'use client';

import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {ArrowUpRight, KeyRound, X} from 'lucide-react';

type KeyContextValue = {
  hasKey: boolean;
  revision: number;
  openKey: () => void;
  requestHeaders: () => Record<string, string>;
};
const KeyContext = createContext<KeyContextValue | null>(null);

export function TinyFishKeyProvider({children}: {children: ReactNode}) {
  // Intentionally in memory only: no localStorage, sessionStorage, cookies or server persistence.
  const key = useRef('');
  const [hasKey, setHasKey] = useState(false);
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    function forget() {
      key.current = '';
      setHasKey(false);
      setDraft('');
      setOpen(false);
      setRevision(n => n + 1);
    }
    window.addEventListener('pagehide', forget);
    return () => window.removeEventListener('pagehide', forget);
  }, []);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  function close() { setOpen(false); setDraft(''); setError(''); }
  function replaceKey(value: string) {
    key.current = value;
    setHasKey(Boolean(value));
    setRevision(n => n + 1);
    close();
  }

  return <KeyContext.Provider value={{hasKey, revision, openKey: () => setOpen(true), requestHeaders: () => ({'Content-Type': 'application/json', 'X-TinyFish-Key': key.current})}}>
    {children}
    <dialog className="key-dialog" ref={dialog} aria-labelledby="key-title" aria-describedby="key-privacy" onClose={close} onCancel={close}>
      <button className="key-dialog-close" aria-label="Close API key settings" onClick={close}><X size={19}/></button>
      <KeyRound className="key-dialog-icon" size={25}/>
      <h2 id="key-title">Use your TinyFish key</h2>
      <p>Live searches and agent checks use your own TinyFish account and allowance.</p>
      <form autoComplete="off" onSubmit={event => {
        event.preventDefault();
        const value = draft.trim();
        if (!/^[\x21-\x7E]{16,512}$/.test(value)) { setError('Paste your full API key, with no spaces.'); return; }
        replaceKey(value);
      }}>
        <label htmlFor="tinyfish-key">TinyFish API key</label>
        <input id="tinyfish-key" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} autoFocus required maxLength={512} placeholder={hasKey ? 'Paste a replacement key' : 'Paste your API key'} value={draft} onChange={event => setDraft(event.target.value)}/>
        {error && <p className="key-error" role="alert">{error}</p>}
        <p id="key-privacy" className="key-privacy">Kept in memory for this tab; cleared on refresh or close. Sent through Fishies’ server to TinyFish when you search. The app doesn’t save it.</p>
        <div className="key-dialog-actions">
          <button className="dark-button" type="submit">{hasKey ? 'Replace key' : 'Use this key'}</button>
          {hasKey && <button className="key-remove" type="button" onClick={() => replaceKey('')}>Remove key</button>}
        </div>
      </form>
      <a className="key-get" href="https://agent.tinyfish.ai" target="_blank" rel="noreferrer">Get a key from TinyFish <ArrowUpRight size={13}/></a>
    </dialog>
  </KeyContext.Provider>;
}

export function useTinyFishKey() {
  const value = useContext(KeyContext);
  if (!value) throw new Error('TinyFish key controls require their provider.');
  return value;
}

export function TinyFishKeyButton() {
  const {hasKey, openKey} = useTinyFishKey();
  return <button className={`key-control ${hasKey ? 'key-present' : ''}`} onClick={openKey}><KeyRound size={14}/>{hasKey ? 'Your API key' : 'Add API key'}</button>;
}

export function TinyFishKeyNotice() {
  const {hasKey, openKey} = useTinyFishKey();
  return <div className="key-notice"><KeyRound size={15}/><span>{hasKey ? 'Using your TinyFish key.' : 'Live search needs your own TinyFish key.'}</span><button onClick={openKey}>{hasKey ? 'Manage' : 'Add key'}</button></div>;
}
