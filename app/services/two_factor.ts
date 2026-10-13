import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import LoginCode from '#models/login_code'
import type User from '#models/user'
import {
  codeMatches,
  generateLoginCode,
  hashLoginCode,
  normalizeCodeInput,
} from '#services/login_code_crypto'
import { loginCodeEmail } from '#services/emails'
import { sendMail } from '#services/mailer'

export const CODE_TTL_MINUTES = 10
export const MAX_ATTEMPTS = 5
export const MAX_CODES_PER_HOUR = 5

const CHALLENGE_KEY = 'two_factor_challenge'
const CHALLENGE_TTL_MS = 15 * 60 * 1000

type Session = HttpContext['session']

/**
 * Clé secrète de l'application, utilisée pour hacher les codes.
 */
function appSecret(): string {
  const value: unknown = env.get('APP_KEY')
  if (typeof value === 'string') return value

  const release = (value as { release?: () => string } | null)?.release
  if (typeof release === 'function') return release.call(value)

  throw new Error('APP_KEY introuvable : impossible de protéger les codes de connexion.')
}

function affectedRows(result: unknown): number {
  return Array.isArray(result) ? Number(result[0]) : Number(result)
}

/**
 * Garde en session que le mot de passe a été validé et qu'un code est attendu.
 * L'utilisateur n'est PAS connecté tant que le code n'est pas bon.
 */
export function startChallenge(session: Session, userId: number) {
  session.put(CHALLENGE_KEY, { userId, startedAt: Date.now() })
}

export function readChallenge(session: Session): number | null {
  const raw = session.get(CHALLENGE_KEY) as { userId?: unknown; startedAt?: unknown } | undefined
  if (!raw || typeof raw.userId !== 'number' || typeof raw.startedAt !== 'number') return null

  if (Date.now() - raw.startedAt > CHALLENGE_TTL_MS) {
    session.forget(CHALLENGE_KEY)
    return null
  }
  return raw.userId
}

export function clearChallenge(session: Session) {
  session.forget(CHALLENGE_KEY)
}

/**
 * Crée un code, invalide les précédents et l'envoie par email.
 * Retourne false si la limite horaire est atteinte.
 */
export async function sendLoginCode(user: User): Promise<boolean> {
  const since = DateTime.now().minus({ hours: 1 }).toSQL()!
  const recent = await LoginCode.query()
    .select('id')
    .where('user_id', user.id)
    .where('created_at', '>=', since)

  if (recent.length >= MAX_CODES_PER_HOUR) return false

  // Un nouveau code annule l'ancien
  await db.from('login_codes').where('user_id', user.id).whereNull('used_at').update({
    used_at: new Date(),
  })

  const code = generateLoginCode()
  await LoginCode.create({
    userId: user.id,
    codeHash: hashLoginCode(appSecret(), user.id, code),
    expiresAt: DateTime.now().plus({ minutes: CODE_TTL_MINUTES }),
  })

  sendMail(loginCodeEmail({ to: user.email, name: user.fullName, code })).catch((error) =>
    logger.error({ err: error }, "Échec de l'envoi du code de connexion")
  )
  return true
}

export type CodeCheck =
  | { status: 'ok' }
  | { status: 'invalid'; remaining: number }
  | { status: 'expired' }
  | { status: 'locked' }

/**
 * Vérifie le code saisi. Chaque vérification consomme un essai AVANT la comparaison,
 * de façon atomique : des requêtes simultanées ne peuvent pas dépasser la limite.
 */
export async function checkLoginCode(userId: number, input: unknown): Promise<CodeCheck> {
  const record = await LoginCode.query()
    .where('user_id', userId)
    .whereNull('used_at')
    .orderBy('id', 'desc')
    .first()

  if (!record || record.expiresAt <= DateTime.now()) return { status: 'expired' }

  const counted = await db
    .from('login_codes')
    .where('id', record.id)
    .whereNull('used_at')
    .where('attempts', '<', MAX_ATTEMPTS)
    .increment('attempts', 1)

  if (affectedRows(counted) !== 1) return { status: 'locked' }

  const code = normalizeCodeInput(input)
  const remaining = Math.max(0, MAX_ATTEMPTS - (record.attempts + 1))

  if (!code || !codeMatches(appSecret(), userId, code, record.codeHash)) {
    return { status: 'invalid', remaining }
  }

  // Le code ne sert qu'une fois
  const consumed = await db
    .from('login_codes')
    .where('id', record.id)
    .whereNull('used_at')
    .update({ used_at: new Date() })

  return affectedRows(consumed) === 1 ? { status: 'ok' } : { status: 'expired' }
}
