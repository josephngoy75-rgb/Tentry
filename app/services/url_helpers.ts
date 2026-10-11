/**
 * Nettoie un lien saisi par un utilisateur.
 * - ajoute https:// s'il manque
 * - refuse tout protocole autre que http et https (javascript:, data:, etc.)
 * - si des domaines sont imposés, refuse les autres (ex. LinkedIn → linkedin.com)
 * Retourne le lien normalisé, ou null s'il est vide ou invalide.
 */
export function normalizeUrl(
  input: string | null | undefined,
  allowedHosts: readonly string[] = []
): string | null {
  const raw = (input ?? '').trim()
  if (!raw) return null

  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`

  let url: URL
  try {
    url = new URL(withProtocol)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.toLowerCase()
  if (!host.includes('.')) return null

  if (allowedHosts.length > 0) {
    const allowed = allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))
    if (!allowed) return null
  }

  return url.toString()
}
