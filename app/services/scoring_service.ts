import { programs, educationLevels } from '#config/programs'
import type { EducationLevel } from '#config/programs'
import { scoring } from '#config/scoring'

export type Priority = 'high' | 'medium' | 'low'

/**
 * Données nécessaires au calcul. On ne dépend pas du modèle Lucid :
 * la fonction reste pure et testable sans base de données.
 */
export type ScoringInput = {
  program: string
  educationLevel: string
  motivation: string
  experienceYears: number
  experienceDescription?: string | null
  availability: string
  phone?: string | null
  city?: string | null
  birthDate?: unknown
  portfolioUrl?: string | null
}

export type ScoreBreakdown = {
  completeness: number
  fit: number
  motivation: number
  experience: number
  availability: number
  portfolio: number
}

export type ScoreResult = {
  score: number
  breakdown: ScoreBreakdown
  priority: Priority
}

/**
 * Minuscules et sans accents, pour comparer "Enseignant" et "enseign".
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  return String(value).trim().length > 0
}

function completenessScore(input: ScoringInput): number {
  const fields = [input.phone, input.city, input.birthDate, input.experienceDescription]
  return fields.filter(isFilled).length * scoring.completeness.pointsPerField
}

function fitScore(input: ScoringInput): number {
  const program = programs[input.program]
  if (!program) return 0

  // 1. Niveau d'études (le niveau "autre" ne rapporte rien)
  let educationPoints = 0
  const level = educationLevels[input.educationLevel as EducationLevel]
  if (level && input.educationLevel !== 'other') {
    const gap = educationLevels[program.expectedEducation].rank - level.rank
    if (gap <= 0) educationPoints = scoring.fit.educationMatch
    else if (gap === 1) educationPoints = scoring.fit.educationOneLevelBelow
  }

  // 2. Mots-clés distincts, plafonnés (évite la motivation "bourrée" de mots-clés)
  const text = normalize(`${input.motivation} ${input.experienceDescription ?? ''}`)
  const found = program.keywords.filter((keyword) => text.includes(keyword)).length
  const keywordPoints = Math.min(found * scoring.fit.pointsPerKeyword, scoring.fit.maxKeywordPoints)

  return educationPoints + keywordPoints
}

function motivationScore(input: ScoringInput): number {
  const length = input.motivation.trim().length
  const tier = scoring.motivation.lengthTiers.find((t) => length >= t.minLength)
  let points = tier ? tier.points : 0

  // Bonus si le candidat cite le programme visé (premier mot du libellé :
  // "tuteur", "ambassadeur", "createur")
  const program = programs[input.program]
  if (program) {
    const programName = normalize(program.label.split(' ')[0])
    if (normalize(input.motivation).includes(programName)) {
      points += scoring.motivation.programMentionBonus
    }
  }

  return points
}

function experienceScore(input: ScoringInput): number {
  const tier = scoring.experience.yearsTiers.find((t) => input.experienceYears >= t.minYears)
  return tier ? tier.points : 0
}

function availabilityScore(input: ScoringInput): number {
  return scoring.availability[input.availability] ?? 0
}

function portfolioScore(input: ScoringInput): number {
  return isFilled(input.portfolioUrl) ? scoring.portfolio.points : 0
}

export function priorityFor(score: number): Priority {
  if (score >= scoring.priority.high) return 'high'
  if (score >= scoring.priority.medium) return 'medium'
  return 'low'
}

/**
 * Calcule le score (0 à 100), son détail par critère et la priorité.
 */
export function evaluate(input: ScoringInput): ScoreResult {
  const breakdown: ScoreBreakdown = {
    completeness: completenessScore(input),
    fit: fitScore(input),
    motivation: motivationScore(input),
    experience: experienceScore(input),
    availability: availabilityScore(input),
    portfolio: portfolioScore(input),
  }

  const total = Object.values(breakdown).reduce((sum, points) => sum + points, 0)
  const score = Math.max(0, Math.min(100, total))

  return { score, breakdown, priority: priorityFor(score) }
}
