import { createServerFn } from '@tanstack/react-start'
import { getRequest, setCookie } from '@tanstack/react-start/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { vaultEntries } from '../../db/schema.js'
import {
  SESSION_COOKIE,
  createSessionToken,
  readCookie,
  readSessionToken,
  safeEqual,
} from './session'

export interface Viewer {
  name: string
  avatar: string
  role: 'member' | 'admin'
}

export interface Entry {
  id: number
  title: string
  body: string
  secret: string
  link: string
  pinned: boolean
  updatedAt: string
}

function currentSession() {
  try {
    return readSessionToken(readCookie(getRequest(), SESSION_COOKIE))
  } catch {
    return null
  }
}

function requireAdmin() {
  const session = currentSession()
  if (session?.role !== 'admin') throw new Error('Only the vault owner can do that')
  return session
}

function toEntry(row: typeof vaultEntries.$inferSelect): Entry {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    secret: row.secret,
    link: row.link,
    pinned: row.pinned,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const getViewer = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Viewer | null> => {
    const session = currentSession()
    if (!session) return null
    return { name: session.name, avatar: session.avatar, role: session.role }
  },
)

export const getEntries = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Entry[]> => {
    if (!currentSession()) throw new Error('Members only')
    const rows = await db
      .select()
      .from(vaultEntries)
      .orderBy(desc(vaultEntries.pinned), desc(vaultEntries.updatedAt))
    return rows.map(toEntry)
  },
)

const entryInput = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(1, 'Give it a title').max(200),
  body: z.string().max(10_000).default(''),
  secret: z.string().max(1_000).default(''),
  link: z
    .string()
    .trim()
    .max(2_000)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Links must start with http:// or https://')
    .default(''),
  pinned: z.boolean().default(false),
})

export const saveEntry = createServerFn({ method: 'POST' })
  .validator(entryInput)
  .handler(async ({ data }): Promise<Entry> => {
    requireAdmin()
    const values = {
      title: data.title,
      body: data.body,
      secret: data.secret,
      link: data.link,
      pinned: data.pinned,
      updatedAt: new Date(),
    }
    if (data.id) {
      const [row] = await db
        .update(vaultEntries)
        .set(values)
        .where(eq(vaultEntries.id, data.id))
        .returning()
      if (!row) throw new Error('That entry no longer exists')
      return toEntry(row)
    }
    const [row] = await db.insert(vaultEntries).values(values).returning()
    return toEntry(row)
  })

export const deleteEntry = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    requireAdmin()
    await db.delete(vaultEntries).where(eq(vaultEntries.id, data.id))
    return { ok: true }
  })

export const adminLogin = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD
    if (!expected) throw new Error('The owner password has not been set up yet')
    if (!safeEqual(data.password, expected)) throw new Error('Wrong password')
    const { token, maxAge } = createSessionToken({
      sub: 'owner',
      name: 'Gialao3D',
      avatar: '',
      role: 'admin',
    })
    setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge,
    })
    return { ok: true }
  })
