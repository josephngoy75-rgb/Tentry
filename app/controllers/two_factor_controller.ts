import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { maskEmail } from '#services/login_code_crypto'
import {
  checkLoginCode,
  clearChallenge,
  readChallenge,
  sendLoginCode,
  startChallenge,
} from '#services/two_factor'

/**
 * Deuxième étape de la connexion : le code reçu par email.
 */
export default class TwoFactorController {
  async form({ session, view, response }: HttpContext) {
    const userId = readChallenge(session)
    if (!userId) return response.redirect().toRoute('session.create')

    const user = await User.find(userId)
    if (!user) {
      clearChallenge(session)
      return response.redirect().toRoute('session.create')
    }

    return view.render('pages/auth/two_factor', { maskedEmail: maskEmail(user.email) })
  }

  async verify({ request, response, session, auth }: HttpContext) {
    const userId = readChallenge(session)
    if (!userId) {
      session.flash('error', 'Votre tentative de connexion a expiré. Reconnectez-vous.')
      return response.redirect().toRoute('session.create')
    }

    const result = await checkLoginCode(userId, request.input('code'))

    if (result.status === 'ok') {
      const user = await User.findOrFail(userId)
      clearChallenge(session)
      await auth.use('web').login(user)
      return response.redirect().toRoute('account')
    }

    if (result.status === 'invalid' && result.remaining > 0) {
      session.flashErrors({ code: `Code incorrect. ${result.remaining} essai(s) restant(s).` })
      return response.redirect().back()
    }

    clearChallenge(session)
    session.flash(
      'error',
      result.status === 'expired'
        ? 'Ce code a expiré. Reconnectez-vous pour en recevoir un nouveau.'
        : "Trop d'essais. Reconnectez-vous pour recevoir un nouveau code."
    )
    return response.redirect().toRoute('session.create')
  }

  async resend({ session, response }: HttpContext) {
    const userId = readChallenge(session)
    if (!userId) return response.redirect().toRoute('session.create')

    const user = await User.find(userId)
    if (!user) {
      clearChallenge(session)
      return response.redirect().toRoute('session.create')
    }

    const sent = await sendLoginCode(user)
    if (sent) startChallenge(session, userId)

    session.flash(
      sent ? 'success' : 'error',
      sent
        ? 'Un nouveau code vient de vous être envoyé.'
        : 'Trop de codes demandés. Réessayez dans une heure.'
    )
    return response.redirect().back()
  }
}
