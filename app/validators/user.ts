import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 * L'email est nettoyé (espaces, majuscules) avant toute vérification.
 */
const email = () => vine.string().trim().toLowerCase().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup.
 * Le rôle "admin" n'est volontairement pas accepté ici.
 * Le nom d'entreprise est exigé pour le rôle "company" dans le contrôleur.
 */
export const signupValidator = vine.create({
  role: vine.enum(['candidate', 'company'] as const),
  fullName: vine.string().trim().minLength(2).maxLength(150),
  companyName: vine.string().trim().minLength(2).maxLength(150).optional(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
