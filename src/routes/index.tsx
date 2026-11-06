import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Crown, KeyRound, Lock } from 'lucide-react'
import { getViewer } from '@/lib/vault.functions'

const PATREON_PAGE_URL = 'https://www.patreon.com/cw/Gialao3D'

const ERRORS: Record<string, string> = {
  not_member:
    "In order to access my vault, you must become a patreon member. Join below and then come back.",
  denied: 'Patreon login was cancelled.',
  expired: 'That login link expired. Please try again.',
  patreon: "Patreon didn't respond as expected. Please try again in a moment.",
  setup: 'Patreon login is still being set up. Check back soon!',
}

export const Route = createFileRoute('/')({
  validateSearch: z.object({ error: z.string().optional() }),
  loader: () => getViewer(),
  component: Landing,
})

function PatreonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
    </svg>
  )
}

function Landing() {
  const viewer = Route.useLoaderData()
  const { error } = Route.useSearch()
  const message = error ? (ERRORS[error] ?? ERRORS.patreon) : null

  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-black text-white">
      <img
        src="/.netlify/images?url=/img/landing.png&w=2000&fm=webp&q=80"
        srcSet="/.netlify/images?url=/img/landing.png&w=900&fm=webp&q=75 900w, /.netlify/images?url=/img/landing.png&w=1400&fm=webp&q=78 1400w, /.netlify/images?url=/img/landing.png&w=2200&fm=webp&q=80 2200w"
        sizes="100vw"
        alt="Gialao3D character renders"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.72)_55%,rgba(0,0,0,0.92)_100%)]" />

      <header className="flex items-center justify-between px-5 py-5 sm:px-10">
        <span className="font-display text-sm tracking-wider text-white/80">GIALAO3D</span>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <KeyRound className="size-3.5" /> Owner
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-20 text-center">
        <div className="vault-rise mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
          <Lock className="size-3.5 text-[var(--vault-gold)]" /> Members only
        </div>

        <h1
          className="vault-title vault-rise font-display text-5xl leading-[0.95] sm:text-7xl md:text-8xl lg:text-9xl"
          style={{ animationDelay: '80ms' }}
        >
          Gialao3D&apos;s
          <br />
          Vault
        </h1>

        <p
          className="vault-rise mt-6 max-w-md text-base text-white/80 sm:text-lg"
          style={{ animationDelay: '160ms' }}
        >
          My Vault contains exclusive loot not found anywhere else.
        </p>

        {message && (
          <p
            role="alert"
            className="mt-6 max-w-md rounded-xl border border-[var(--vault-gold)]/40 bg-black/70 px-4 py-3 text-sm text-white backdrop-blur"
          >
            {message}
          </p>
        )}

        <div
          className="vault-rise mt-10 flex w-full max-w-xs flex-col gap-3"
          style={{ animationDelay: '240ms' }}
        >
          {viewer ? (
            <Link
              to="/vault"
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[var(--vault-gold)] px-6 text-base font-bold text-black shadow-[0_10px_40px_-10px_rgba(255,239,0,0.7)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <Crown className="size-5" /> Enter the vault
            </Link>
          ) : (
            <a
              href="/api/auth/login"
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[var(--patreon)] px-6 text-base font-bold text-white shadow-[0_10px_40px_-10px_rgba(255,66,77,0.8)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <PatreonMark className="size-5" /> Log in with Patreon
            </a>
          )}
          <a
            href={PATREON_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-[var(--vault-gold)] bg-black/50 px-6 text-base font-bold text-[var(--vault-gold)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-[var(--vault-gold)] hover:text-black"
          >
            Become a member now
          </a>
        </div>
      </section>
    </main>
  )
}
