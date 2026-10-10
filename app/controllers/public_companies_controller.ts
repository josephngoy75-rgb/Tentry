import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Offer from '#models/offer'
import CompanyProfile from '#models/company_profile'
import MediaFile from '#models/media_file'
import { contractTypes, workModes } from '#config/offers'
import { companySectors, companySizes, socialNetworks } from '#config/companies'

/**
 * Page publique d'une entreprise : profil, photos et offres en cours.
 * Seuls les comptes "company" ont une page : un autre identifiant donne une 404.
 */
export default class PublicCompaniesController {
  async show({ params, view }: HttpContext) {
    const company = await User.query()
      .where('id', Number(params.id) || 0)
      .where('role', 'company')
      .firstOrFail()

    const profile = await CompanyProfile.query().where('user_id', company.id).first()

    const media = await MediaFile.query()
      .where('user_id', company.id)
      .whereIn('kind', ['logo', 'photo'])
      .orderBy('id', 'asc')
    const logo = media.filter((item) => item.kind === 'logo').at(-1) ?? null
    const photos = media.filter((item) => item.kind === 'photo')

    // Seules les offres publiées et encore ouvertes
    const today = DateTime.now().toSQLDate()
    const offers = await Offer.query()
      .where('user_id', company.id)
      .where('status', 'published')
      .where((query) => query.whereNull('deadline').orWhere('deadline', '>=', today!))
      .orderBy('published_at', 'desc')

    const links = profile
      ? socialNetworks
          .filter((network) => profile[network.field])
          .map((network) => ({ label: network.label, url: profile[network.field] as string }))
      : []

    return view.render('pages/companies/show', {
      company,
      profile,
      logo,
      photos,
      offers,
      links,
      sectorLabel: profile?.sector ? companySectors[profile.sector as keyof typeof companySectors] : null,
      sizeLabel: profile?.size ? companySizes[profile.size as keyof typeof companySizes] : null,
      contractTypes,
      workModes,
    })
  }
}
