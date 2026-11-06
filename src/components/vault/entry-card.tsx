import { useState } from 'react'
import { Check, Copy, ExternalLink, Eye, EyeOff, Pin } from 'lucide-react'
import { toast } from 'sonner'
import type { Entry } from '@/lib/vault.functions'

export function EntryCard({ entry }: { entry: Entry }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(entry.secret)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy — select it and copy manually')
    }
  }

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-[#c9a24a]/25 bg-black/60 p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md transition hover:border-[var(--vault-gold)]/60">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold leading-snug text-white">{entry.title}</h2>
        {entry.pinned && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--vault-gold)]/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--vault-gold)]">
            <Pin className="size-3" /> Pinned
          </span>
        )}
      </div>

      {entry.body && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{entry.body}</p>
      )}

      {entry.secret && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 pl-3">
          <code className="min-w-0 flex-1 truncate font-mono text-sm text-[var(--vault-gold)]">
            {revealed ? entry.secret : '•'.repeat(Math.min(Math.max(entry.secret.length, 8), 18))}
          </code>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={revealed ? 'Hide' : 'Reveal'}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Copy"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
          </button>
        </div>
      )}

      {entry.link && (
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 self-start rounded-xl bg-[var(--vault-gold)] px-4 py-2 text-sm font-bold text-black transition hover:brightness-105"
        >
          Open <ExternalLink className="size-4" />
        </a>
      )}
    </article>
  )
}
