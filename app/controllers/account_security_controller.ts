import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import {
  clearFailures,
  recordFailure,
  secondsUntilAllowed,
  securityRules,
  waitMessage,
} from '#services/rate_limiter'

/**
 * Réglages de sécurité du compte connecté (tous les rôles).
 */
export default class AccountSecurityController {
  async show({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    return view.render('pages/account/security', {
      twoFactorEnabled: user.requiresTwoFactor,
      forced: user.role === 'admin',
      emailVerified: user.isEmailVerified,
    })
  }

  /**
   * Active la double authentification : adresse confirmée et mot de passe exigés
   */
  async enable({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    if (!user.isEmailVerified) {
      session.flash('error', "Confirmez d'abord votre adresse email : le code y sera envoyé.")
      return response.redirect().back()
    }

    const rules = securityRules(user.id)
    const wait = await secondsUntilAllowed(rules)
    if (wait > 0) {
      session.flash('error', waitMessage(wait))
      return response.redirect().back()
    }

    const password = String(request.input('password') ?? '')
    if (!(await hash.verify(user.password, password))) {
      await recordFailure(rules)
      session.flashErrors({ password: 'Mot de passe incorrect.' })
      return response.redirect().back()
    }

    await clearFailures(rules)
    user.twoFactorEnabled = true
    await user.save()

    session.flash('success', 'Double authentification activée.')
    return response.redirect().back()
  }

  /**
   * Désactive la double authentification (impossible pour les administrateurs)
   */
  async disable({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.role === 'admin') {
      session.flash('error', 'La double authentification est obligatoire pour les administrateurs.')
      return response.redirect().back()
    }

    const rules = securityRules(user.id)
    const wait = await secondsUntilAllowed(rules)
    if (wait > 0) {
      session.flash('error', waitMessage(wait))
      return response.redirect().back()
    }

    const password = String(request.input('password') ?? '')
    if (!(await hash.verify(user.password, password))) {
      await recordFailure(rules)
      session.flashErrors({ password: 'Mot de passe incorrect.' })
      return response.redirect().back()
    }

    await clearFailures(rules)
    user.twoFactorEnabled = false
    await user.save()

    session.flash('success', 'Double authentification désactivée.')
    return response.redirect().back()
  }
}
