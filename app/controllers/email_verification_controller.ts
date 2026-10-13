import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import User from '#models/user'
import {
  consumeToken,
  countRecentTokens,
  findUsableToken,
  issueToken,
  revokeTokens,
} from '#services/auth_tokens'
import { verificationEmail } from '#services/emails'
import { sendMail } from '#services/mailer'

const TTL_MINUTES = 24 * 60
const MAX_SENDS_PER_HOUR = 3

/**
 * Envoie (ou renvoie) l'email de confirmation à un utilisateur.
 * Retourne false si la limite horaire est atteinte.
 */
export async function sendVerificationEmail(user: User): Promise<boolean> {
  if (user.isEmailVerified) return true
  if ((await countRecentTokens(user.id, 'email_verification', 60)) >= MAX_SENDS_PER_HOUR) {
    return false
  }

  // Les anciens liens encore ouverts sont invalidés : seul le dernier fonctionne
  await revokeTokens(user.id, 'email_verification')
  const token = await issueToken(user.id, 'email_verification', TTL_MINUTES)

  sendMail(verificationEmail({ to: user.email, name: user.fullName, token })).catch((error) =>
    logger.error({ err: error }, "Échec de l'envoi de l'email de confirmation d'adresse")
  )
  return true
}

export default class EmailVerificationController {
  /**
   * Page du lien reçu : un bouton demande de confirmer.
   * La confirmation elle-même se fait en POST, pour qu'un robot qui ouvre
   * le lien (prévisualisation, antivirus) ne puisse pas la déclencher.
   */
  async show({ params, view, response }: HttpContext) {
    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')

    const record = await findUsableToken(params.token, 'email_verification')
    if (!record) return view.render('pages/auth/verify_email_invalid')

    return view.render('pages/auth/verify_email', { token: params.token })
  }

  /**
   * Confirme l'adresse
   */
  async confirm({ params, response, view }: HttpContext) {
    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')

    const record = await findUsableToken(params.token, 'email_verification')
    if (!record || !(await consumeToken(record.id))) {
      return view.render('pages/auth/verify_email_invalid')
    }

    const user = await User.findOrFail(record.userId)
    if (!user.isEmailVerified) {
      user.emailVerifiedAt = DateTime.now()
      await user.save()
    }

    return response.redirect().toPath('/email-confirme')
  }

  /**
   * Renvoie l'email de confirmation à l'utilisateur connecté
   */
  async resend({ auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.isEmailVerified) {
      return response.redirect().back()
    }

    const sent = await sendVerificationEmail(user)
    session.flash(
      sent ? 'success' : 'error',
      sent
        ? 'Un nouvel email de confirmation vient de vous être envoyé.'
        : 'Trop de demandes. Réessayez dans une heure.'
    )
    return response.redirect().back()
  }
}
