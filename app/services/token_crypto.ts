import { createHash, randomBytes } from 'node:crypto'
import type { DateTime } from 'luxon'

/**
 * Hache un jeton (SHA-256). Seul ce hachage est stocké en base :
 * une fuite de la base ne donne donc aucun lien utilisable.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Génère un jeton aléatoire de 256 bits. Le jeton part dans l'email,
 * son hachage est enregistré en base.
 */
export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex')
  return { token, hash: hashToken(token) }
}

/**
 * Un jeton valide fait exactement 64 caractères hexadécimaux minuscules.
 * Tout autre format est refusé avant même d'interroger la base.
 */
export function isWellFormedToken(token: unknown): token is string {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
}

/**
 * Un jeton est utilisable s'il n'a pas déjà servi et s'il n'a pas expiré.
 */
export function isTokenUsable(
  record: { expiresAt: DateTime; usedAt?: DateTime | null },
  now: DateTime
): boolean {
  if (record.usedAt) return false
  return record.expiresAt > now
}
