import { createFileRoute } from '@tanstack/react-router'
import { exchangeCode, fetchIdentity } from '@/lib/patreon'
import {
  SESSION_COOKIE,
  STATE_COOKIE,
  createSessionToken,
  readCookie,
  safeEqual,
  serializeCookie,
} from '@/lib/session'

function redirect(request: Request, path: string, cookies: string[] = []) {
  const headers = new Headers({
    Location: new URL(path, request.url).toString(),
  })
  headers.append('Set-Cookie', serializeCookie(STATE_COOKIE, '', 0))
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
}

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const code = params.get('code')
        const state = params.get('state')
        const [expectedState, mode] = (
          readCookie(request, STATE_COOKIE) ?? ''
        ).split('.')
        const asOwner = mode === 'owner'
        const failPath = asOwner ? '/admin' : '/'

        if (params.get('error'))
          return redirect(request, `${failPath}?error=denied`)
        if (
          !code ||
          !state ||
          !expectedState ||
          !safeEqual(state, expectedState)
        ) {
          return redirect(request, `${failPath}?error=expired`)
        }

        try {
          const accessToken = await exchangeCode(code, request)
          const identity = await fetchIdentity(accessToken, { asOwner })
          if (identity.isCreator) {
            const { token, maxAge } = createSessionToken({
              sub: `patreon:${identity.id}`,
              name: identity.name,
              avatar: identity.avatar,
              role: 'admin',
            })
            return redirect(request, '/admin', [
              serializeCookie(SESSION_COOKIE, token, maxAge),
            ])
          }
          if (asOwner) return redirect(request, '/admin?error=not_owner')
          if (!identity.isActivePatron) {
            return redirect(request, '/?error=not_member')
          }
          const { token, maxAge } = createSessionToken({
            sub: `patreon:${identity.id}`,
            name: identity.name,
            avatar: identity.avatar,
            role: 'member',
          })
          return redirect(request, '/vault', [
            serializeCookie(SESSION_COOKIE, token, maxAge),
          ])
        } catch (error) {
          console.error('Patreon login failed', error)
          return redirect(request, `${failPath}?error=patreon`)
        }
      },
    },
  },
})
