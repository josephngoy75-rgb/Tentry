/**
 * Configuration métier de Talentry.
 * Modifier ce fichier suffit pour ajouter un programme ou changer une option :
 * aucune logique n'est à toucher.
 */

export type EducationLevel = 'secondary' | 'bachelor' | 'master' | 'doctorate' | 'other'
export type Availability = 'immediate' | 'within_month' | 'later'

export const educationLevels: Record<EducationLevel, { label: string; rank: number }> = {
  secondary: { label: 'Secondaire / Baccalauréat', rank: 1 },
  bachelor: { label: 'Licence', rank: 2 },
  master: { label: 'Master', rank: 3 },
  doctorate: { label: 'Doctorat', rank: 4 },
  other: { label: 'Autre', rank: 0 },
}

export const availabilities: Record<Availability, string> = {
  immediate: 'Immédiate',
  within_month: 'Dans le mois',
  later: 'Plus tard',
}

export type ProgramConfig = {
  label: string
  description: string
  /** Niveau d'études attendu pour obtenir tous les points d'adéquation */
  expectedEducation: EducationLevel
  /** Mots-clés cherchés dans la motivation et l'expérience (minuscules, sans accents) */
  keywords: string[]
}

export const programs: Record<string, ProgramConfig> = {
  tutor: {
    label: 'Tuteur SKULLVI',
    description: 'Accompagner les apprenants dans leurs révisions et leur progression.',
    expectedEducation: 'bachelor',
    keywords: ['enseign', 'pedagog', 'eleve', 'cours', 'accompagn', 'tutorat', 'revision'],
  },
  ambassador: {
    label: 'Ambassadeur SKULLVI',
    description: 'Faire connaître SKULLVI dans votre école ou votre communauté.',
    expectedEducation: 'secondary',
    keywords: ['communaute', 'reseau', 'communication', 'evenement', 'animation', 'partage'],
  },
  content: {
    label: 'Créateur de contenus pédagogiques',
    description: 'Concevoir des cours, des quiz et des ressources pour la plateforme.',
    expectedEducation: 'bachelor',
    keywords: ['contenu', 'redaction', 'quiz', 'programme', 'cours', 'ressource', 'creation'],
  },
}

export const programKeys = Object.keys(programs)
