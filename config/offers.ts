/**
 * Options des offres d'emploi.
 * Modifier ce fichier suffit pour ajouter un type de contrat ou de mode de travail.
 */

export const contractTypes = {
  cdi: 'CDI',
  cdd: 'CDD',
  internship: 'Stage',
  apprenticeship: 'Alternance',
  freelance: 'Freelance',
} as const

export const workModes = {
  onsite: 'Sur site',
  hybrid: 'Hybride',
  remote: 'Télétravail',
} as const

export const offerStatuses = {
  draft: 'Brouillon',
  published: 'Publiée',
  closed: 'Clôturée',
} as const

export type ContractType = keyof typeof contractTypes
export type WorkMode = keyof typeof workModes
export type OfferStatus = keyof typeof offerStatuses
