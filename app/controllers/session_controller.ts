import User from '#models/user'
import { loginValidator } from '#validators/user'
import { sendLoginCode, startChallenge } from '#services/two_factor'
import {
  clearFailures,
  loginRules,
  recordFailure,
  secondsUntilAllowed,
  waitMessage,
} from '#services/rate_limiter'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * SessionController handles user authentication and session management.
 */
export default class SessionController {
  /**
   * Display the login page
   */
  async create({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * Authenticate user credentials. Après trop d'échecs, la connexion est bloquée
   * temporairement, même avec le bon mot de passe. Si un code est requis, il est
   * envoyé et attendu avant l'ouverture de la session.
   */
  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const rules = loginRules(email, request.ip())

    // Le blocage est vérifié AVANT le mot de passe : pendant un blocage,
    // rien ne permet de continuer à deviner.
    const wait = await secondsUntilAllowed(rules)
    if (wait > 0) {
      session.flash('error', waitMessage(wait))
      return response.redirect().toRoute('session.create')
    }

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      // Un échec est compté pour toute adresse, existante ou non : rien n'est révélé
      if ((error as { code?: string }).code === 'E_INVALID_CREDENTIALS') {
        await recordFailure(rules)
      }
      throw error
    }

    await clearFailures([rules[0]])

    if (user.requiresTwoFactor) {
      if (!(await sendLoginCode(user))) {
        session.flash('error', 'Trop de codes demandés. Réessayez dans une heure.')
        return response.redirect().toRoute('session.create')
      }

      startChallenge(session, user.id)
      return response.redirect().toPath('/connexion/code')
    }

    await auth.use('web').login(user)
    response.redirect().toRoute('account')
  }

  /**
   * Log out the current user and destroy their session
   */
  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    response.redirect().toRoute('session.create')
  }
}
