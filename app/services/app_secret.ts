import env from '#start/env'

/**
 * Clé secrète de l'application, pour hacher codes et compteurs.
 */
export function appSecret(): string {
  const value: unknown = env.get('APP_KEY')
  if (typeof value === 'string') return value

  const release = (value as { release?: () => string } | null)?.release
  if (typeof release === 'function') return release.call(value)

  throw new Error('APP_KEY introuvable.')
}
