import vine from '@vinejs/vine'
import { companySectors, companySizes } from '#config/companies'
import type { CompanySector, CompanySize } from '#config/companies'

/**
 * Validateur du profil d'entreprise.
 * Les liens sont seulement limités en longueur ici : leur forme et leur domaine
 * sont vérifiés dans le contrôleur par normalizeUrl.
 */
export const companyProfileValidator = vine.create({
  companyName: vine.string().trim().minLength(2).maxLength(150),
  description: vine.string().trim().maxLength(3000).optional(),
  sector: vine.enum(Object.keys(companySectors) as CompanySector[]).optional(),
  size: vine.enum(Object.keys(companySizes) as CompanySize[]).optional(),
  foundedYear: vine
    .number()
    .withoutDecimals()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),

  addressLine: vine.string().trim().maxLength(200).optional(),
  city: vine.string().trim().maxLength(100).optional(),
  country: vine.string().trim().maxLength(100).optional(),

  websiteUrl: vine.string().trim().maxLength(300).optional(),
  linkedinUrl: vine.string().trim().maxLength(300).optional(),
  facebookUrl: vine.string().trim().maxLength(300).optional(),
  instagramUrl: vine.string().trim().maxLength(300).optional(),
  xUrl: vine.string().trim().maxLength(300).optional(),
})
