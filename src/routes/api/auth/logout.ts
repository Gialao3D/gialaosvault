import { createFileRoute } from '@tanstack/react-router'
import { SESSION_COOKIE, serializeCookie } from '@/lib/session'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(null, {
          status: 302,
          headers: {
            Location: new URL('/', request.url).toString(),
            'Set-Cookie': serializeCookie(SESSION_COOKIE, '', 0),
          },
        }),
    },
  },
})
