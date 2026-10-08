import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * NewAccountController handles user registration.
 * Un compte est soit un candidat, soit une entreprise.
 */
export default class NewAccountController {
  /**
   * Display the signup page
   */
  async create({ view }: HttpContext) {
    return view.render('pages/auth/signup')
  }

  /**
   * Create a new user account and authenticate the user
   */
  async store({ request, response, auth, session }: HttpContext) {
    const { fullName, email, password, role, companyName } =
      await request.validateUsing(signupValidator)

    // Une entreprise doit indiquer son nom
    if (role === 'company' && !companyName) {
      session.flashExcept(['password', 'passwordConfirmation'])
      session.flashErrors({ companyName: "Le nom de l'entreprise est obligatoire." })
      return response.redirect().back()
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      companyName: role === 'company' ? (companyName ?? null) : null,
    })

    await auth.use('web').login(user)
    response.redirect().toRoute('account')
  }
}
