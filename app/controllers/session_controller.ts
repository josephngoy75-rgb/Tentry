import User from '#models/user'
import { loginValidator } from '#validators/user'
import { sendLoginCode, startChallenge } from '#services/two_factor'
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
   * Authenticate user credentials. If a code is required, send it and wait for it
   * before opening the session.
   */
  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

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
