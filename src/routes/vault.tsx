import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { LogOut, PencilLine, Vault } from 'lucide-react'
import { getEntries, getViewer } from '@/lib/vault.functions'
import { VaultBackdrop } from '@/components/vault/vault-backdrop'
import { EntryCard } from '@/components/vault/entry-card'

export const Route = createFileRoute('/vault')({
  head: () => ({ meta: [{ title: "The Vault · Gialao3D's Vault" }] }),
  loader: async () => {
    const viewer = await getViewer()
    if (!viewer) throw redirect({ to: '/' })
    const entries = await getEntries()
    return { viewer, entries }
  },
  component: VaultPage,
})

function VaultPage() {
  const { viewer, entries } = Route.useLoaderData()
  const firstName = viewer.name.split(' ')[0]

  return (
    <main className="relative isolate min-h-svh text-white">
      <VaultBackdrop />

      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="font-display text-base text-[var(--vault-gold)] sm:text-lg">
            Gialao3D&apos;s Vault
          </Link>
          <div className="flex items-center gap-2">
            {viewer.role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vault-gold)] px-3.5 py-1.5 text-sm font-bold text-black"
              >
                <PencilLine className="size-4" /> Edit vault
              </Link>
            )}
            {viewer.avatar && (
              <img src={viewer.avatar} alt="" className="size-8 rounded-full border border-white/20" />
            )}
            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" /> <span className="hidden sm:inline">Log out</span>
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
          Welcome in, {firstName}
        </p>
        <h1 className="vault-title font-display mt-3 text-4xl sm:text-6xl">The Vault</h1>
        <p className="mt-4 max-w-xl text-white/75">
          All the passwords for my patreon zip files are here. The passwords are case sensitive. Write them as they are displayed.
          Make sure your platform of choice supports the handling of 7ZIP files. Reach out to me if you have any issues.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/20 bg-black/50 px-6 py-16 text-center backdrop-blur">
            <Vault className="size-10 text-[var(--vault-gold)]" />
            <h2 className="mt-4 text-xl font-bold">The vault is being stocked</h2>
            <p className="mt-2 max-w-sm text-sm text-white/65">
              New drops land here soon. Check back shortly!
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
