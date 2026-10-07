import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type RoleOptions = { roles: string[] }

/**
 * Laisse passer uniquement les utilisateurs dont le rôle est autorisé.
 * Les autres sont renvoyés vers leur propre espace.
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: RoleOptions) {
    const user = ctx.auth.user

    if (!user || !options.roles.includes(user.role)) {
      return ctx.response.redirect().toRoute('account')
    }

    return next()
  }
}
