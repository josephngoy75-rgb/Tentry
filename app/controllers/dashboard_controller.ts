import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Application from '#models/application'
import { programs, programKeys } from '#config/programs'

const PER_PAGE = 20
const priorities = ['high', 'medium', 'low']
const statuses = ['new', 'reviewed', 'accepted', 'rejected']

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
}
