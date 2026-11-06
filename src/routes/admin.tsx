import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Eye,
  KeyRound,
  LogOut,
  Pencil,
  Pin,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { VaultBackdrop } from '@/components/vault/vault-backdrop'
import {
  adminLogin,
  deleteEntry,
  getEntries,
  getViewer,
  saveEntry,
  type Entry,
} from '@/lib/vault.functions'

const OWNER_ERRORS: Record<string, string> = {
  not_owner:
    "That Patreon account isn't the Gialao3D creator account. Log in with the account that owns the campaign.",
  denied: 'Patreon login was cancelled.',
  expired: 'That login link expired. Please try again.',
  patreon: "Patreon didn't respond as expected. Please try again in a moment.",
}

export const Route = createFileRoute('/admin')({
  validateSearch: z.object({ error: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Edit · Gialao3D's Vault" },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  loader: async () => {
    const viewer = await getViewer()
    if (viewer?.role !== 'admin')
      return { isAdmin: false as const, entries: [] as Entry[] }
    return { isAdmin: true as const, entries: await getEntries() }
  },
  component: AdminPage,
})

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

function AdminPage() {
  const { isAdmin, entries } = Route.useLoaderData()
  return (
    <main className="relative isolate min-h-svh text-white">
      <VaultBackdrop />
      {isAdmin ? <Editor entries={entries} /> : <OwnerLogin />}
    </main>
  )
}

function OwnerLogin() {
  const router = useRouter()
  const { error: patreonError } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const patreonMessage = patreonError
    ? (OWNER_ERRORS[patreonError] ?? OWNER_ERRORS.patreon)
    : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await adminLogin({ data: { password } })
      await router.invalidate()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/70 p-7 backdrop-blur-md"
      >
        <KeyRound className="size-8 text-[var(--vault-gold)]" />
        <h1 className="font-display mt-4 text-2xl text-[var(--vault-gold)]">
          Owner access
        </h1>
        <p className="mt-1 text-sm text-white/65">
          Log in with your Patreon creator account, or use your owner password.
        </p>
        {patreonMessage && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {patreonMessage}
          </p>
        )}
        <a
          href="/api/auth/login?as=owner"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--patreon)] font-bold text-white transition hover:brightness-110"
        >
          Log in with Patreon (creator)
        </a>
        <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/40">
          <span className="h-px flex-1 bg-white/10" /> or{' '}
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <Label htmlFor="pw" className="mt-6 block text-white/80">
          Owner password
        </Label>
        <Input
          id="pw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 border-white/15 bg-white/5"
          required
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 h-11 w-full rounded-xl bg-[var(--vault-gold)] font-bold text-black transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? 'Checking…' : 'Unlock editor'}
        </button>
        <Link
          to="/"
          className="mt-4 block text-center text-sm text-white/50 hover:text-white"
        >
          Back to home
        </Link>
      </form>
    </div>
  )
}

type Draft = {
  id?: number
  title: string
  body: string
  secret: string
  link: string
  pinned: boolean
}
const EMPTY: Draft = {
  title: '',
  body: '',
  secret: '',
  link: '',
  pinned: false,
}

function Editor({ entries }: { entries: Entry[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [pending, setPending] = useState(false)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      await saveEntry({ data: draft })
      toast.success(draft.id ? 'Entry updated' : 'Added to the vault')
      setDraft(EMPTY)
      await router.invalidate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  async function remove(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"? Members will no longer see it.`))
      return
    try {
      await deleteEntry({ data: { id: entry.id } })
      if (draft.id === entry.id) setDraft(EMPTY)
      toast.success('Deleted')
      await router.invalidate()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  function edit(entry: Entry) {
    setDraft({
      id: entry.id,
      title: entry.title,
      body: entry.body,
      secret: entry.secret,
      link: entry.link,
      pinned: entry.pinned,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const field =
    'mt-2 border-white/15 bg-white/5 text-white placeholder:text-white/35'

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <span className="font-display text-base text-[var(--vault-gold)] sm:text-lg">
            Vault editor
          </span>
          <div className="flex items-center gap-2">
            <Link
              to="/vault"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-semibold hover:bg-white/10"
            >
              <Eye className="size-4" /> View as member
            </Link>
            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={submit}
          className="h-fit rounded-3xl border border-white/10 bg-black/70 p-6 backdrop-blur-md lg:sticky lg:top-20"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {draft.id ? 'Edit entry' : 'Add something new'}
            </h1>
            {draft.id && (
              <button
                type="button"
                onClick={() => setDraft(EMPTY)}
                className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white"
              >
                <ArrowLeft className="size-4" /> New instead
              </button>
            )}
          </div>

          <Label htmlFor="title" className="mt-5 block text-white/80">
            Title
          </Label>
          <Input
            id="title"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="November map pack"
            className={field}
            required
            maxLength={200}
          />

          <Label htmlFor="body" className="mt-4 block text-white/80">
            Text
          </Label>
          <Textarea
            id="body"
            value={draft.body}
            onChange={(e) => set('body', e.target.value)}
            placeholder="Anything you want members to read…"
            rows={5}
            className={field}
          />

          <Label htmlFor="secret" className="mt-4 block text-white/80">
            Password / code <span className="text-white/40">(optional)</span>
          </Label>
          <Input
            id="secret"
            value={draft.secret}
            onChange={(e) => set('secret', e.target.value)}
            placeholder="Shown hidden, with reveal & copy"
            className={`${field} font-mono`}
            autoComplete="off"
          />

          <Label htmlFor="link" className="mt-4 block text-white/80">
            Link <span className="text-white/40">(optional)</span>
          </Label>
          <Input
            id="link"
            type="url"
            value={draft.link}
            onChange={(e) => set('link', e.target.value)}
            placeholder="https://…"
            className={field}
          />

          <label className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm">
              <span className="font-semibold">Pin to top</span>
              <span className="block text-white/50">
                Keeps it first in the vault
              </span>
            </span>
            <Switch
              checked={draft.pinned}
              onCheckedChange={(v) => set('pinned', v)}
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--vault-gold)] font-bold text-black transition hover:brightness-105 disabled:opacity-60"
          >
            {draft.id ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {pending ? 'Saving…' : draft.id ? 'Save changes' : 'Add to vault'}
          </button>
        </form>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            In the vault · {entries.length}
          </h2>
          {entries.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/50 p-8 text-center text-sm text-white/60">
              Nothing here yet. Add your first entry and members will see it
              instantly.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className={`flex items-start gap-3 rounded-2xl border bg-black/60 p-4 backdrop-blur ${
                    draft.id === entry.id
                      ? 'border-[var(--vault-gold)]'
                      : 'border-white/10'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      {entry.pinned && (
                        <Pin className="size-3.5 shrink-0 text-[var(--vault-gold)]" />
                      )}
                      <span className="truncate">{entry.title}</span>
                    </p>
                    {entry.body && (
                      <p className="mt-1 line-clamp-2 text-sm text-white/60">
                        {entry.body}
                      </p>
                    )}
                    {entry.secret && (
                      <p className="mt-1 truncate font-mono text-xs text-[var(--vault-gold)]/80">
                        {entry.secret}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => edit(entry)}
                    className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                    aria-label={`Edit ${entry.title}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(entry)}
                    className="rounded-lg p-2 text-white/60 hover:bg-red-500/15 hover:text-red-400"
                    aria-label={`Delete ${entry.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
