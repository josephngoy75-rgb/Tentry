/**
 * Options du profil d'entreprise.
 * Modifier ce fichier suffit pour ajouter un secteur ou un réseau social.
 */

export const companySectors = {
  tech: 'Technologie & numérique',
  education: 'Éducation & formation',
  health: 'Santé',
  finance: 'Finance & assurance',
  commerce: 'Commerce & distribution',
  industry: 'Industrie & construction',
  services: 'Services aux entreprises',
  ngo: 'ONG & associations',
  other: 'Autre',
} as const

export const companySizes = {
  '1-10': '1 à 10 personnes',
  '11-50': '11 à 50 personnes',
  '51-200': '51 à 200 personnes',
  '201+': 'Plus de 200 personnes',
} as const

/**
 * Liens que l'entreprise peut renseigner. Pour chaque réseau, seuls les
 * domaines listés sont acceptés (un lien LinkedIn doit pointer vers linkedin.com).
 */
export const socialNetworks = [
  { field: 'websiteUrl', label: 'Site web', hosts: [], placeholder: 'https://www.monentreprise.com' },
  { field: 'linkedinUrl', label: 'LinkedIn', hosts: ['linkedin.com'], placeholder: 'https://linkedin.com/company/…' },
  { field: 'facebookUrl', label: 'Facebook', hosts: ['facebook.com', 'fb.com'], placeholder: 'https://facebook.com/…' },
  { field: 'instagramUrl', label: 'Instagram', hosts: ['instagram.com'], placeholder: 'https://instagram.com/…' },
  { field: 'xUrl', label: 'X (Twitter)', hosts: ['x.com', 'twitter.com'], placeholder: 'https://x.com/…' },
] as const

export type CompanySector = keyof typeof companySectors
export type CompanySize = keyof typeof companySizes

/**
 * Limites des images du profil d'entreprise.
 */
export const mediaLimits = {
  logoMaxSize: '2mb',
  photoMaxSize: '5mb',
  maxPhotos: 5,
}
