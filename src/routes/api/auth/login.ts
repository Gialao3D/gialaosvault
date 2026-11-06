import { createFileRoute } from '@tanstack/react-router'
import { randomBytes } from 'node:crypto'
import { patreonConfig, redirectUri } from '@/lib/patreon'
import { STATE_COOKIE, serializeCookie } from '@/lib/session'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const config = patreonConfig()
        if (!config) {
          return Response.redirect(new URL('/?error=setup', request.url), 302)
        }
        // ?as=owner is the creator sign-in. It also asks for the `campaigns`
        // scope so we can confirm the account owns the Gialao3D campaign.
        // Members never see that extra permission.
        const asOwner = new URL(request.url).searchParams.get('as') === 'owner'
        const state = randomBytes(24).toString('base64url')
        const authorize = new URL('https://www.patreon.com/oauth2/authorize')
        authorize.searchParams.set('response_type', 'code')
        authorize.searchParams.set('client_id', config.clientId)
        authorize.searchParams.set('redirect_uri', redirectUri(request))
        authorize.searchParams.set(
          'scope',
          asOwner
            ? 'identity identity.memberships campaigns'
            : 'identity identity.memberships',
        )
        authorize.searchParams.set('state', state)
        return new Response(null, {
          status: 302,
          headers: {
            Location: authorize.toString(),
            'Set-Cookie': serializeCookie(
              STATE_COOKIE,
              `${state}.${asOwner ? 'owner' : 'member'}`,
              600,
            ),
          },
        })
      },
    },
  },
})
