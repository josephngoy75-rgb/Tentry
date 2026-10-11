import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import User from '#models/user'
import { forgotPasswordValidator, resetPasswordValidator } from '#validators/password'
import {
  consumeToken,
  countRecentTokens,
  findUsableToken,
  issueToken,
  revokeTokens,
} from '#services/auth_tokens'
import { passwordChangedEmail, passwordResetEmail } from '#services/emails'
import { sendMail } from '#services/mailer'

const TTL_MINUTES = 60
const MAX_REQUESTS_PER_HOUR = 3

/**
 * Mot de passe oublié : demande du lien, puis choix d'un nouveau mot de passe.
 */
export default class PasswordResetController {
  /**
   * Formulaire de demande
   */
  async forgotForm({ view }: HttpContext) {
    return view.render('pages/auth/forgot_password')
  }

  /**
   * Envoie le lien si le compte existe. La réponse est identique dans tous les cas,
   * pour ne pas révéler quelles adresses ont un compte.
   */
  async forgotStore({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const user = await User.findBy('email', email)

    if (user && (await countRecentTokens(user.id, 'password_reset', 60)) < MAX_REQUESTS_PER_HOUR) {
      const token = await issueToken(user.id, 'password_reset', TTL_MINUTES)

      // Envoi non attendu : la durée de réponse ne dépend pas de l'existence du compte
      sendMail(passwordResetEmail({ to: user.email, name: user.fullName, token })).catch((error) =>
        logger.error({ err: error }, "Échec de l'envoi de l'email de réinitialisation")
      )
    }

    return response.redirect().toPath('/mot-de-passe-oublie/envoye')
  }

  /**
   * Formulaire du nouveau mot de passe (le lien reçu par email)
   */
  async resetForm({ params, view, response }: HttpContext) {
    // Le jeton est dans l'adresse : on empêche sa fuite par l'en-tête Referer et par le cache
    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')

    const record = await findUsableToken(params.token, 'password_reset')
    if (!record) return view.render('pages/auth/reset_password_invalid')

    return view.render('pages/auth/reset_password', { token: params.token })
  }

  /**
   * Enregistre le nouveau mot de passe
   */
  async resetStore({ params, request, response, view }: HttpContext) {
    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')

    // Validation d'abord : en cas d'erreur de saisie, le lien reste utilisable
    const { password } = await request.validateUsing(resetPasswordValidator)

    const record = await findUsableToken(params.token, 'password_reset')
    if (!record) return view.render('pages/auth/reset_password_invalid')

    // Le jeton ne sert qu'une fois, même si deux requêtes arrivent en même temps
    if (!(await consumeToken(record.id))) return view.render('pages/auth/reset_password_invalid')

    const user = await User.findOrFail(record.userId)
    user.password = password
    await user.save()

    // Les autres liens encore ouverts pour ce compte deviennent inutilisables
    await revokeTokens(user.id, 'password_reset')

    sendMail(passwordChangedEmail({ to: user.email, name: user.fullName })).catch((error) =>
      logger.error({ err: error }, "Échec de l'envoi de l'email de confirmation")
    )

    return response.redirect().toPath('/mot-de-passe-modifie')
  }
}
