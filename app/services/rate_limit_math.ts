import { createHmac } from 'node:crypto'
import type { DateTime } from 'luxon'

/**
 * Identifiant d'un compteur : HMAC de "type:clé" avec la clé secrète de l'application.
 * L'email ou l'adresse IP n'est donc jamais stocké en clair.
 */
export function bucketFor(secret: string, scope: string, key: string): string {
  return createHmac('sha256', secret).update(`${scope}:${key}`).digest('hex')
}

/**
 * Nombre de secondes à attendre avant de pouvoir réessayer (0 = autorisé).
 * Fenêtre glissante : on bloque quand `max` échecs ont eu lieu dans les
 * `windowMinutes` dernières minutes, jusqu'à ce que le plus ancien d'entre
 * eux sorte de la fenêtre.
 */
export function retryAfterSeconds(
  hits: DateTime[],
  now: DateTime,
  max: number,
  windowMinutes: number
): number {
  const windowStart = now.minus({ minutes: windowMinutes })
  const recent = hits
    .filter((hit) => hit > windowStart)
    .sort((a, b) => a.toMillis() - b.toMillis())

  if (recent.length < max) return 0

  // Le blocage cesse quand le nombre d'échecs récents repasse sous `max`
  const release = recent[recent.length - max].plus({ minutes: windowMinutes })
  return Math.max(1, Math.ceil(release.diff(now).as('seconds')))
}
