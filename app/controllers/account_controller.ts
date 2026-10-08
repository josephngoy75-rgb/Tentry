import type { HttpContext } from '@adonisjs/core/http'

/**
 * Point d'entrée après connexion : chaque rôle est dirigé vers son espace.
 */
export default class AccountController {
  async index({ auth, view, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.role === 'admin') {
      return response.redirect().toPath('/dashboard')
    }
    if (user.role === 'company') {
      return response.redirect().toPath('/entreprise/offres')
    }
    return view.render('pages/candidate/home')
  }
}
