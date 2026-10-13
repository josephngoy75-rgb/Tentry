import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { appSecret } from '#services/app_secret'
import { bucketFor, retryAfterSeconds } from '#services/rate_limit_math'

export type RateRule = { scope: string; key: string; max: number; windowMinutes: number }

/**
 * Règles de la connexion. Le seuil par email seul est volontairement plus haut :
 * s'il était bas, n'importe qui pourrait verrouiller le compte d'un autre.
 */
export function loginRules(email: string, ip: string): RateRule[] {
  return [
    { scope: 'login:email-ip', key: `${email}|${ip}`, max: 5, windowMinutes: 15 },
    { scope: 'login:ip', key: ip, max: 20, windowMinutes: 15 },
    { scope: 'login:email', key: email, max: 25, windowMinutes: 15 },
  ]
}

/**
 * Règle de la page Sécurité (vérification du mot de passe d'un utilisateur connecté).
 */
export function securityRules(userId: number): RateRule[] {
  return [{ scope: 'security:user', key: String(userId), max: 5, windowMinutes: 15 }]
}

export function waitMessage(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`
}

/**
 * Secondes à attendre avant de pouvoir réessayer (0 = autorisé), toutes règles confondues.
 */
export async function secondsUntilAllowed(rules: RateRule[]): Promise<number> {
  const now = DateTime.now()
  let longest = 0

  for (const rule of rules) {
    const bucket = bucketFor(appSecret(), rule.scope, rule.key)
    const since = now.minus({ minutes: rule.windowMinutes }).toJSDate()

    const rows = await db
      .from('rate_limit_hits')
      .where('bucket', bucket)
      .where('created_at', '>=', since)
      .select('created_at')
      .orderBy('created_at', 'asc')
      .limit(500)

    const hits = rows.map((row: { created_at: Date | string }) =>
      DateTime.fromJSDate(new Date(row.created_at))
    )
    longest = Math.max(longest, retryAfterSeconds(hits, now, rule.max, rule.windowMinutes))
  }

  return longest
}

/**
 * Enregistre un échec pour chaque règle, et supprime les anciennes lignes (plus de 24 h).
 */
export async function recordFailure(rules: RateRule[]): Promise<void> {
  const now = new Date()

  for (const rule of rules) {
    await db.table('rate_limit_hits').insert({
      bucket: bucketFor(appSecret(), rule.scope, rule.key),
      created_at: now,
    })
  }

  await db
    .from('rate_limit_hits')
    .where('created_at', '<', DateTime.now().minus({ days: 1 }).toJSDate())
    .delete()
}

/**
 * Efface les échecs des règles données (après une connexion réussie).
 */
export async function clearFailures(rules: RateRule[]): Promise<void> {
  const buckets = rules.map((rule) => bucketFor(appSecret(), rule.scope, rule.key))
  await db.from('rate_limit_hits').whereIn('bucket', buckets).delete()
}
