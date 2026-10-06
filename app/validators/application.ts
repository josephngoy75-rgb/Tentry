import vine from '@vinejs/vine'
import { educationLevels, availabilities, programKeys } from '#config/programs'
import type { EducationLevel, Availability } from '#config/programs'

/**
 * Validateur du formulaire de candidature.
 * Les règles reprennent le cadrage : champs essentiels uniquement,
 * motivation d'au moins 100 caractères, email unique.
 */
export const applicationValidator = vine.create({
  // Identité et contact
  fullName: vine.string().trim().minLength(2).maxLength(150),
  email: vine
    .string()
    .trim()
    .toLowerCase()
    .email()
    .maxLength(254)
    .unique({ table: 'applications', column: 'email' }),
  phone: vine.string().trim().maxLength(30).optional(),
  country: vine.string().trim().minLength(2).maxLength(100),
  city: vine.string().trim().maxLength(100).optional(),
  birthDate: vine
    .date({ formats: ['YYYY-MM-DD'] })
    .beforeOrEqual('today')
    .optional(),

  // Profil
  educationLevel: vine.enum(Object.keys(educationLevels) as EducationLevel[]),
  program: vine.enum(programKeys),
  motivation: vine.string().trim().minLength(100).maxLength(3000),
  experienceYears: vine.number().withoutDecimals().min(0).max(40),
  experienceDescription: vine.string().trim().maxLength(2000).optional(),
  availability: vine.enum(Object.keys(availabilities) as Availability[]),
  portfolioUrl: vine.string().trim().url().maxLength(500).optional(),
})
