import vine from '@vinejs/vine'

/**
 * Demande de réinitialisation : seul l'email est demandé.
 */
export const forgotPasswordValidator = vine.create({
  email: vine.string().trim().toLowerCase().email().maxLength(254),
})

/**
 * Choix du nouveau mot de passe (mêmes règles qu'à l'inscription).
 */
export const resetPasswordValidator = vine.create({
  password: vine.string().minLength(8).maxLength(32),
  passwordConfirmation: vine.string().minLength(8).maxLength(32).sameAs('password'),
})
