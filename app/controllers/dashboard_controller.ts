import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Application from '#models/application'
import { programs, programKeys, educationLevels, availabilities } from '#config/programs'
import { scoring } from '#config/scoring'

const PER_PAGE = 20
const priorities = ['high', 'medium', 'low']
const statuses = ['new', 'reviewed', 'accepted', 'rejected']

/**
 * Les critères du score, avec leur maximum déduit du barème
 * (aucun chiffre en dur : tout vient de config/scoring.ts).
 */
const criteria = [
  {
    key: 'completeness',
    label: 'Complétude du dossier',
    max: 4 * scoring.completeness.pointsPerField,
  },
  {
    key: 'fit',
    label: 'Adéquation au programme',
    max: scoring.fit.educationMatch + scoring.fit.maxKeywordPoints,
  },
  {
    key: 'motivation',
    label: 'Qualité de la motivation',
    max: scoring.motivation.lengthTiers[0].points + scoring.motivation.programMentionBonus,
  },
  { key: 'experience', label: 'Expérience', max: scoring.experience.yearsTiers[0].points },
  {
    key: 'availability',
    label: 'Disponibilité',
    max: Math.max(...Object.values(scoring.availability)),
  },
  { key: 'portfolio', label: 'Portfolio / lien', max: scoring.portfolio.points },
]

export default class DashboardController {
  /**
   * Liste classée des candidatures, avec filtres
   */
  async index({ request, view }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    // Seules les valeurs connues sont acceptées : un filtre trafiqué est ignoré
    const program = programKeys.includes(request.input('program')) ? request.input('program') : ''
    const priority = priorities.includes(request.input('priority')) ? request.input('priority') : ''
    const status = statuses.includes(request.input('status')) ? request.input('status') : ''

    const applications = await Application.query()
      .if(program, (query) => query.where('program', program))
      .if(priority, (query) => query.where('priority', priority))
      .if(status, (query) => query.where('status', status))
      .orderBy('score', 'desc')
      .orderBy('created_at', 'asc')
      .paginate(page, PER_PAGE)

    // Garde les filtres dans les liens de pagination
    const activeFilters: Record<string, string> = {}
    if (program) activeFilters.program = program
    if (priority) activeFilters.priority = priority
    if (status) activeFilters.status = status
    applications.baseUrl('/dashboard').queryString(activeFilters)

    // Compteurs par priorité (sur l'ensemble des candidatures)
    const rows = await db
      .from('applications')
      .select('priority')
      .count('* as total')
      .groupBy('priority')
    const counts = { high: 0, medium: 0, low: 0 }
    for (const row of rows) {
      counts[row.priority as keyof typeof counts] = Number(row.total)
    }

    return view.render('pages/dashboard', {
      applications,
      programs,
      filters: { program, priority, status },
      counts,
      total: counts.high + counts.medium + counts.low,
      rankOffset: (page - 1) * PER_PAGE,
    })
  }

  /**
   * Fiche détaillée d'une candidature
   */
  async show({ params, view }: HttpContext) {
    const application = await Application.findOrFail(params.id)
    const breakdown = (application.scoreBreakdown ?? {}) as Record<string, number>

    const scoreLines = criteria.map((criterion) => {
      const points = Number(breakdown[criterion.key] ?? 0)
      return {
        label: criterion.label,
        points,
        max: criterion.max,
        percent: Math.round((points / criterion.max) * 100),
      }
    })

    return view.render('pages/applications/show', {
      application,
      scoreLines,
      programs,
      educationLevels,
      availabilities,
    })
  }

  /**
   * Change le statut d'une candidature
   */
  async updateStatus({ params, request, response }: HttpContext) {
    const application = await Application.findOrFail(params.id)
    const status = request.input('status')

    // Seules les valeurs connues sont acceptées
    if (statuses.includes(status)) {
      application.status = status
      await application.save()
    }

    return response.redirect().toPath(`/dashboard/${application.id}`)
  }
}
