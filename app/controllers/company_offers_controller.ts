import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Offer from '#models/offer'
import { offerValidator, offerUpdateValidator } from '#validators/offer'
import { parseList } from '#services/text_list'
import { contractTypes, workModes, offerStatuses } from '#config/offers'
import { educationLevels } from '#config/programs'

const statuses = ['draft', 'published', 'closed']

type Option = { value: string; name: string; isSelected?: boolean }

function toOptions(items: Record<string, string>, placeholder: string, selected = ''): Option[] {
  return [
    { value: '', name: placeholder },
    ...Object.entries(items).map(([value, name]) => ({
      value,
      name,
      isSelected: value === selected,
    })),
  ]
}

const educationItems: Record<string, string> = Object.fromEntries(
  Object.entries(educationLevels)
    .filter(([key]) => key !== 'other')
    .map(([key, level]) => [key, level.label])
)

/**
 * Listes déroulantes et valeurs à afficher dans le formulaire.
 * Sans offre (création), le formulaire est vide.
 */
function formData(offer: Offer | null) {
  return {
    contractOptions: toOptions(contractTypes, 'Choisir un contrat', offer?.contractType),
    workModeOptions: toOptions(workModes, 'Choisir un mode', offer?.workMode),
    educationOptions: toOptions(educationItems, 'Aucune exigence', offer?.educationLevel ?? ''),
    values: offer
      ? {
          title: offer.title,
          location: offer.location ?? '',
          salaryRange: offer.salaryRange ?? '',
          deadline: offer.deadline ? offer.deadline.toFormat('yyyy-MM-dd') : '',
          summary: offer.summary,
          missions: offer.missions,
          profile: offer.profile ?? '',
          benefits: offer.benefits ?? '',
          requiredSkills: offer.requiredSkills.join(', '),
          niceSkills: offer.niceSkills.join(', '),
          languages: offer.languages.join(', '),
          minExperienceYears: String(offer.minExperienceYears),
        }
      : {},
  }
}

/**
 * Charge une offre appartenant à l'entreprise connectée.
 * Une offre d'une autre entreprise (ou un identifiant invalide) donne une 404.
 */
async function ownedOffer({ params, auth }: HttpContext) {
  const id = Number(params.id)
  return Offer.query()
    .where('id', Number.isInteger(id) ? id : 0)
    .where('user_id', auth.getUserOrFail().id)
    .firstOrFail()
}

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
    return view.render('pages/company/offers/create', formData(null))
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

  /**
   * Formulaire de modification
   */
  async edit(ctx: HttpContext) {
    const offer = await ownedOffer(ctx)

    return ctx.view.render('pages/company/offers/edit', {
      offer,
      offerStatuses,
      ...formData(offer),
    })
  }

  /**
   * Enregistre les modifications. Les champs vidés sont bien effacés.
   */
  async update(ctx: HttpContext) {
    const offer = await ownedOffer(ctx)
    const { request, response, session } = ctx
    const data = await request.validateUsing(offerUpdateValidator)

    const required = parseList(data.requiredSkills)
    if (required.length === 0) {
      session.flashAll()
      session.flashErrors({ requiredSkills: 'Indiquez au moins une compétence obligatoire.' })
      return response.redirect().back()
    }

    offer.merge({
      title: data.title,
      contractType: data.contractType,
      workMode: data.workMode,
      location: data.location ?? null,
      salaryRange: data.salaryRange ?? null,
      deadline: data.deadline ?? null,
      summary: data.summary,
      missions: data.missions,
      profile: data.profile ?? null,
      benefits: data.benefits ?? null,
      requiredSkills: required,
      niceSkills: parseList(data.niceSkills),
      languages: parseList(data.languages),
      minExperienceYears: data.minExperienceYears,
      educationLevel: data.educationLevel ?? null,
    })
    await offer.save()

    return response.redirect().toPath('/entreprise/offres')
  }

  /**
   * Publie, clôture ou repasse en brouillon
   */
  async updateStatus(ctx: HttpContext) {
    const offer = await ownedOffer(ctx)
    const status = ctx.request.input('status')

    if (statuses.includes(status) && status !== offer.status) {
      offer.status = status
      if (status === 'published') {
        offer.publishedAt = DateTime.now()
      }
      await offer.save()
    }

    return ctx.response.redirect().toPath('/entreprise/offres')
  }

  /**
   * Duplique l'offre en brouillon, pour en créer une proche
   */
  async duplicate(ctx: HttpContext) {
    const offer = await ownedOffer(ctx)

    const copy = await Offer.create({
      userId: offer.userId,
      title: `${offer.title} (copie)`.slice(0, 150),
      contractType: offer.contractType,
      workMode: offer.workMode,
      location: offer.location,
      salaryRange: offer.salaryRange,
      summary: offer.summary,
      missions: offer.missions,
      profile: offer.profile,
      benefits: offer.benefits,
      requiredSkills: offer.requiredSkills,
      niceSkills: offer.niceSkills,
      minExperienceYears: offer.minExperienceYears,
      educationLevel: offer.educationLevel,
      languages: offer.languages,
      status: 'draft',
      publishedAt: null,
      deadline: null,
    })

    return ctx.response.redirect().toPath(`/entreprise/offres/${copy.id}/modifier`)
  }
}
