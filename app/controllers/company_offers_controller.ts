import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Offer from '#models/offer'
import { offerValidator } from '#validators/offer'
import { parseList } from '#services/text_list'
import { contractTypes, workModes, offerStatuses } from '#config/offers'
import { educationLevels } from '#config/programs'

const toOptions = (items: Record<string, string>) =>
  Object.entries(items).map(([value, name]) => ({ value, name }))

/**
 * Offres de l'entreprise connectée.
 * Chaque requête est limitée aux offres de l'utilisateur : une entreprise
 * ne voit jamais celles d'une autre.
 */
export default class CompanyOffersController {
  /**
   * Liste des offres de l'entreprise
   */
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const offers = await Offer.query().where('user_id', user.id).orderBy('created_at', 'desc')

    return view.render('pages/company/offers/index', {
      offers,
      contractTypes,
      workModes,
      offerStatuses,
    })
  }

  /**
   * Formulaire de création d'une offre
   */
  async create({ view }: HttpContext) {
    return view.render('pages/company/offers/create', {
      contractOptions: [{ value: '', name: 'Choisir un contrat' }, ...toOptions(contractTypes)],
      workModeOptions: [{ value: '', name: 'Choisir un mode' }, ...toOptions(workModes)],
      educationOptions: [
        { value: '', name: 'Aucune exigence' },
        ...Object.entries(educationLevels)
          .filter(([value]) => value !== 'other')
          .map(([value, level]) => ({ value, name: level.label })),
      ],
    })
  }

  /**
   * Valide puis enregistre l'offre (brouillon ou publiée)
   */
  async store({ request, response, auth, session }: HttpContext) {
    const { intent, requiredSkills, niceSkills, languages, deadline, ...data } =
      await request.validateUsing(offerValidator)

    const required = parseList(requiredSkills)
    if (required.length === 0) {
      session.flashAll()
      session.flashErrors({ requiredSkills: 'Indiquez au moins une compétence obligatoire.' })
      return response.redirect().back()
    }

    const publish = intent === 'publish'

    await Offer.create({
      ...data,
      userId: auth.getUserOrFail().id,
      requiredSkills: required,
      niceSkills: parseList(niceSkills),
      languages: parseList(languages),
      deadline: deadline ?? null,
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? DateTime.now() : null,
    })

    return response.redirect().toPath('/entreprise/offres')
  }
}
