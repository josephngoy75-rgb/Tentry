import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import AuthToken from '#models/auth_token'
import { generateToken, hashToken, isTokenUsable, isWellFormedToken } from '#services/token_crypto'

export type TokenType = 'password_reset' | 'email_verification'

/**
 * Crée un jeton pour un utilisateur et retourne sa valeur en clair (à mettre dans l'email).
 * Seul le hachage est enregistré.
 */
export async function issueToken(
  userId: number,
  type: TokenType,
  ttlMinutes: number
): Promise<string> {
  const { token, hash } = generateToken()

  await AuthToken.create({
    userId,
    type,
    tokenHash: hash,
    expiresAt: DateTime.now().plus({ minutes: ttlMinutes }),
  })

  return token
}

/**
 * Retrouve un jeton encore utilisable (bon format, bon type, non expiré, non utilisé).
 */
export async function findUsableToken(token: string, type: TokenType): Promise<AuthToken | null> {
  if (!isWellFormedToken(token)) return null

  const record = await AuthToken.query()
    .where('token_hash', hashToken(token))
    .where('type', type)
    .first()

  if (!record || !isTokenUsable(record, DateTime.now())) return null
  return record
}

/**
 * Marque un jeton comme utilisé. L'opération est atomique : si deux requêtes
 * arrivent en même temps avec le même lien, une seule réussit.
 */
export async function consumeToken(id: number): Promise<boolean> {
  const result = await db
    .from('auth_tokens')
    .where('id', id)
    .whereNull('used_at')
    .update({ used_at: new Date() })

  const affected = Array.isArray(result) ? Number(result[0]) : Number(result)
  return affected === 1
}

/**
 * Invalide tous les jetons d'un type encore ouverts pour un utilisateur.
 */
export async function revokeTokens(userId: number, type: TokenType): Promise<void> {
  await db
    .from('auth_tokens')
    .where('user_id', userId)
    .where('type', type)
    .whereNull('used_at')
    .update({ used_at: new Date() })
}

/**
 * Nombre de jetons créés récemment : sert à limiter les demandes répétées.
 */
export async function countRecentTokens(
  userId: number,
  type: TokenType,
  minutes: number
): Promise<number> {
  const since = DateTime.now().minus({ minutes }).toSQL()!

  const rows = await AuthToken.query()
    .select('id')
    .where('user_id', userId)
    .where('type', type)
    .where('created_at', '>=', since)

  return rows.length
}
