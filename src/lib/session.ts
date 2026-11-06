import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'vault_session'
export const STATE_COOKIE = 'vault_oauth_state'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // one week

export type Role = 'member' | 'admin'

export interface Session {
  sub: string
  name: string
  avatar: string
  role: Role
  exp: number
}

function signingKey() {
  // Derived from existing secrets so no extra variable is needed. Changing
  // either secret signs everyone out, which is the behaviour we want.
  const material = `${process.env.PATREON_CLIENT_SECRET ?? ''}:${process.env.ADMIN_PASSWORD ?? ''}`
  if (material === ':') throw new Error('Vault secrets are not configured')
  return createHash('sha256').update(`gialao3d-vault:${material}`).digest()
}

function sign(payload: string) {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url')
}

export function createSessionToken(
  data: Omit<Session, 'exp'>,
): { token: string; maxAge: number } {
  const session: Session = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return { token: `${payload}.${sign(payload)}`, maxAge: SESSION_TTL_SECONDS }
}

export function readSessionToken(token: string | undefined): Session | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  try {
    const expected = Buffer.from(sign(payload))
    const given = Buffer.from(signature)
    if (expected.length !== given.length || !timingSafeEqual(expected, given))
      return null
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Session
    if (typeof session.exp !== 'number' || session.exp * 1000 < Date.now())
      return null
    if (session.role !== 'member' && session.role !== 'admin') return null
    return session
  } catch {
    return null
  }
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

export function serializeCookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

export function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}
