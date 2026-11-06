const CREATOR_VANITY = (
  process.env.PATREON_CREATOR_VANITY ?? 'Gialao3D'
).toLowerCase()

export function patreonConfig() {
  const clientId = process.env.PATREON_CLIENT_ID
  const clientSecret = process.env.PATREON_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export function redirectUri(request: Request) {
  return new URL('/api/auth/callback', request.url).toString()
}

export async function exchangeCode(code: string, request: Request) {
  const config = patreonConfig()
  if (!config) throw new Error('Patreon is not configured')
  const res = await fetch('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri(request),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`)
  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) throw new Error('No access token returned')
  return json.access_token
}

interface JsonApiResource {
  id: string
  type: string
  attributes?: Record<string, unknown>
  relationships?: Record<string, { data?: { id: string; type: string } | null }>
}

export interface PatreonIdentity {
  id: string
  name: string
  avatar: string
  isActivePatron: boolean
  /** True when this Patreon account is the creator of the Gialao3D campaign. */
  isCreator: boolean
}

/**
 * Loads the signed-in Patreon user and decides whether they currently pay for
 * the Gialao3D campaign. A membership counts when its campaign matches
 * PATREON_CAMPAIGN_ID (if set) or the creator's vanity name, and its
 * patron_status is "active_patron".
 */
export async function fetchIdentity(
  accessToken: string,
  { asOwner = false }: { asOwner?: boolean } = {},
): Promise<PatreonIdentity> {
  const url = new URL('https://www.patreon.com/api/oauth2/v2/identity')
  // `campaign` (the user's own campaign) is only readable with the
  // `campaigns` scope, which is requested by the creator sign-in only.
  url.searchParams.set(
    'include',
    asOwner
      ? 'memberships,memberships.campaign,campaign'
      : 'memberships,memberships.campaign',
  )
  url.searchParams.set('fields[user]', 'full_name,image_url')
  url.searchParams.set('fields[member]', 'patron_status')
  url.searchParams.set('fields[campaign]', 'vanity,url')

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Identity request failed (${res.status})`)
  const json = (await res.json()) as {
    data: JsonApiResource
    included?: JsonApiResource[]
  }

  const included = json.included ?? []
  const campaigns = new Map(
    included.filter((r) => r.type === 'campaign').map((r) => [r.id, r]),
  )
  const campaignId = process.env.PATREON_CAMPAIGN_ID?.trim()

  const isOurCampaign = (id: string | undefined) => {
    if (!id) return false
    if (campaignId && id === campaignId) return true
    const campaign = campaigns.get(id)
    const vanity = String(campaign?.attributes?.vanity ?? '').toLowerCase()
    const campaignUrl = String(campaign?.attributes?.url ?? '').toLowerCase()
    return (
      vanity === CREATOR_VANITY ||
      campaignUrl.endsWith(`/${CREATOR_VANITY}`) ||
      campaignUrl.endsWith(`/cw/${CREATOR_VANITY}`)
    )
  }

  const isActivePatron = included.some(
    (r) =>
      r.type === 'member' &&
      r.attributes?.patron_status === 'active_patron' &&
      isOurCampaign(r.relationships?.campaign?.data?.id),
  )

  const ownCampaignId = json.data.relationships?.campaign?.data?.id
  const isCreator = asOwner && isOurCampaign(ownCampaignId)

  return {
    id: json.data.id,
    name: String(json.data.attributes?.full_name ?? 'Patron'),
    avatar: String(json.data.attributes?.image_url ?? ''),
    isActivePatron,
    isCreator,
  }
}
