import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Offer from '#models/offer'
import User from '#models/user'
import { contractTypes, workModes } from '#config/offers'
import { educationLevels } from '#config/programs'

const PER_PAGE = 12

/**
 * Offres visibles par tous : seules les offres publiées et encore ouvertes.
 */
function openOffers() {
  const today = DateTime.now().toSQLDate()
  return Offer.query()
    .where('status', 'published')
    .where((query) => query.whereNull('deadline').orWhere('deadline', '>=', today!))
}

export default class PublicOffersController {
  /**
   * Liste publique des offres, avec recherche et filtres
   */
  async index({ request, view }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    // Seules les valeurs connues sont acceptées : un filtre trafiqué est ignoré
    const search = String(request.input('q', '')).trim().slice(0, 100)
    const contract = request.input('contract') in contractTypes ? request.input('contract') : ''
    const mode = request.input('mode') in workModes ? request.input('mode') : ''

    const offers = await openOffers()
      .if(search, (query) =>
        query.where((q) => {
          q.whereILike('title', `%${search}%`).orWhereILike('location', `%${search}%`)
        })
      )
      .if(contract, (query) => query.where('contract_type', contract))
      .if(mode, (query) => query.where('work_mode', mode))
      .orderBy('published_at', 'desc')
      .paginate(page, PER_PAGE)

    const activeFilters: Record<string, string> = {}
    if (search) activeFilters.q = search
    if (contract) activeFilters.contract = contract
    if (mode) activeFilters.mode = mode
    offers.baseUrl('/offres').queryString(activeFilters)

    // Nom de l'entreprise de chaque offre
    const companies = await User.query().whereIn(
      'id',
      offers.map((offer) => offer.userId)
    )
    const companyNames: Record<number, string> = {}
    for (const company of companies) {
      companyNames[company.id] = company.companyName ?? company.fullName ?? 'Entreprise'
    }

    return view.render('pages/offers/index', {
      offers,
      companyNames,
      contractTypes,
      workModes,
      filters: { q: search, contract, mode },
    })
  }

  /**
   * Détail d'une offre (404 si elle n'est pas publiée ou si elle est expirée)
   */
  async show({ params, view }: HttpContext) {
    const offer = await openOffers().where('id', Number(params.id) || 0).firstOrFail()
    const company = await User.findOrFail(offer.userId)

    return view.render('pages/offers/show', {
      offer,
      companyName: company.companyName ?? company.fullName ?? 'Entreprise',
      contractTypes,
      workModes,
      educationLevels,
    })
  }
}
