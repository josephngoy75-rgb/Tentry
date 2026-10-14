import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Offer from '#models/offer'
import User from '#models/user'
import CompanyProfile from '#models/company_profile'
import { addressText, mapsSearchUrl } from '#services/maps'
import { isCompanyVerified, verifiedCompanyIds } from '#services/verified_companies'
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

    // Entreprises dont la vérification est approuvée et encore valable
    const verifiedIds = await verifiedCompanyIds(offers.map((offer) => offer.userId))
    const verified: Record<number, boolean> = {}
    for (const id of verifiedIds) verified[id] = true

    return view.render('pages/offers/index', {
      offers,
      companyNames,
      verified,
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
    const profile = await CompanyProfile.query().where('user_id', company.id).first()

    // Adresse de l'entreprise, ou à défaut le lieu indiqué dans l'offre
    const address =
      addressText([profile?.addressLine, profile?.city, profile?.country]) ||
      (offer.location ?? '').trim()

    return view.render('pages/offers/show', {
      offer,
      companyName: company.companyName ?? company.fullName ?? 'Entreprise',
      verified: await isCompanyVerified(company.id),
      address,
      mapsUrl: mapsSearchUrl(address),
      contractTypes,
      workModes,
      educationLevels,
    })
  }
}
