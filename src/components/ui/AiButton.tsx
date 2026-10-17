'use client';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';

/** Calls /api/ai and shows the result in an editable box. */
export default function AiButton({ type, memberId, label }: { type: 'email' | 'report' | 'promos'; memberId?: string; label: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function run() {
    setBusy(true); setCopied(false);
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, memberId }) });
      const data = await res.json();
      setText(data.text ?? data.error ?? 'Something went wrong. Try again.');
    } catch { setText('Could not reach the server. Check your connection and try again.'); }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <button onClick={run} disabled={busy} className="btn"><Sparkles size={16} /> {busy ? 'Writing…' : label}</button>
      {text && (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} className="input leading-relaxed" aria-label="Generated text" />
          <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); }}>{copied ? 'Copied' : 'Copy text'}</button>
        </>
      )}
    </div>
  );
}
