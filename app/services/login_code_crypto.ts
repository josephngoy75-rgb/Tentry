import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

/**
 * Complète un nombre à 6 chiffres avec des zéros devant (7 → "000007").
 */
export function formatCode(value: number): string {
  return String(value).padStart(6, '0')
}

/**
 * Génère un code à 6 chiffres avec le générateur aléatoire sécurisé du système.
 */
export function generateLoginCode(): string {
  return formatCode(randomInt(0, 1_000_000))
}

/**
 * Haché du code avec une clé secrète (HMAC-SHA256), liée à l'utilisateur.
 * Sans la clé, une fuite de la base ne permet pas de retrouver les codes
 * en essayant les 1 000 000 de possibilités.
 */
export function hashLoginCode(secret: string, userId: number, code: string): string {
  return createHmac('sha256', secret).update(`${userId}:${code}`).digest('hex')
}

/**
 * Compare un code saisi au haché enregistré, en temps constant.
 */
export function codeMatches(
  secret: string,
  userId: number,
  code: string,
  expectedHash: string
): boolean {
  const actual = Buffer.from(hashLoginCode(secret, userId, code), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

/**
 * Nettoie la saisie ("123 456", "123-456") et retourne le code,
 * ou null si ce n'est pas exactement 6 chiffres.
 */
export function normalizeCodeInput(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const cleaned = input.replace(/[\s-]/g, '')
  return /^\d{6}$/.test(cleaned) ? cleaned : null
}

/**
 * Masque une adresse pour l'affichage : kossi@gmail.com → k***@gmail.com
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at < 1) return '***'
  return `${email[0]}***${email.slice(at)}`
}
