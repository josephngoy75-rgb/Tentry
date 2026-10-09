import vine from '@vinejs/vine'
import { contractTypes, workModes } from '#config/offers'
import type { ContractType, WorkMode } from '#config/offers'
import { educationLevels } from '#config/programs'
import type { EducationLevel } from '#config/programs'

/**
 * Champs communs à la création et à la modification d'une offre.
 * Les compétences arrivent en texte (séparées par des virgules) :
 * elles sont transformées en liste dans le contrôleur.
 */
const offerFields = () => ({
  title: vine.string().trim().minLength(5).maxLength(150),
  contractType: vine.enum(Object.keys(contractTypes) as ContractType[]),
  workMode: vine.enum(Object.keys(workModes) as WorkMode[]),
  location: vine.string().trim().maxLength(150).optional(),
  salaryRange: vine.string().trim().maxLength(100).optional(),
  deadline: vine.date({ formats: ['YYYY-MM-DD'] }).afterOrEqual('today').optional(),

  summary: vine.string().trim().minLength(50).maxLength(3000),
  missions: vine.string().trim().minLength(30).maxLength(3000),
  profile: vine.string().trim().maxLength(3000).optional(),
  benefits: vine.string().trim().maxLength(2000).optional(),

  requiredSkills: vine.string().trim().minLength(2).maxLength(600),
  niceSkills: vine.string().trim().maxLength(600).optional(),
  minExperienceYears: vine.number().withoutDecimals().min(0).max(40),
  educationLevel: vine
    .enum((Object.keys(educationLevels) as EducationLevel[]).filter((key) => key !== 'other'))
    .optional(),
  languages: vine.string().trim().maxLength(300).optional(),
})

/**
 * Création : "draft" = enregistrer en brouillon, "publish" = publier tout de suite.
 */
export const offerValidator = vine.create({
  intent: vine.enum(['draft', 'publish'] as const),
  ...offerFields(),
})

/**
 * Modification : le statut se change par une action séparée.
 */
export const offerUpdateValidator = vine.create({
  ...offerFields(),
})
