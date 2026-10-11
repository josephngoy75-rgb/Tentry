import type { HttpContext } from '@adonisjs/core/http'
import CompanyProfile from '#models/company_profile'
import { companyProfileValidator } from '#validators/company_profile'
import { normalizeUrl } from '#services/url_helpers'
import { companySectors, companySizes, socialNetworks } from '#config/companies'

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

/**
 * Profil de l'entreprise connectée.
 * Le profil est toujours retrouvé par l'identifiant de l'utilisateur connecté :
 * une entreprise ne peut modifier que le sien.
 */
export default class CompanyProfileController {
  async edit({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const profile = await CompanyProfile.query().where('user_id', user.id).first()

    return view.render('pages/company/profile/edit', {
      sectorOptions: toOptions(companySectors, 'Choisir un secteur', profile?.sector ?? ''),
      sizeOptions: toOptions(companySizes, 'Choisir une taille', profile?.size ?? ''),
      socialNetworks,
      values: {
        companyName: user.companyName ?? '',
        description: profile?.description ?? '',
        foundedYear: profile?.foundedYear ? String(profile.foundedYear) : '',
        addressLine: profile?.addressLine ?? '',
        city: profile?.city ?? '',
        country: profile?.country ?? '',
        websiteUrl: profile?.websiteUrl ?? '',
        linkedinUrl: profile?.linkedinUrl ?? '',
        facebookUrl: profile?.facebookUrl ?? '',
        instagramUrl: profile?.instagramUrl ?? '',
        xUrl: profile?.xUrl ?? '',
      },
    })
  }

  async update({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(companyProfileValidator)

    // Vérifie chaque lien : forme, protocole et domaine du réseau
    const links = {} as Record<(typeof socialNetworks)[number]['field'], string | null>
    const errors: Record<string, string> = {}

    for (const network of socialNetworks) {
      const raw = data[network.field]
      const normalized = normalizeUrl(raw, network.hosts)

      if (raw && !normalized) {
        errors[network.field] =
          network.hosts.length > 0
            ? `Ce lien doit pointer vers ${network.hosts[0]}.`
            : "Ce lien n'est pas valide."
      }
      links[network.field] = normalized
    }

    if (Object.keys(errors).length > 0) {
      session.flashAll()
      session.flashErrors(errors)
      return response.redirect().back()
    }

    user.companyName = data.companyName
    await user.save()

    await CompanyProfile.updateOrCreate(
      { userId: user.id },
      {
        description: data.description ?? null,
        sector: data.sector ?? null,
        size: data.size ?? null,
        foundedYear: data.foundedYear ?? null,
        addressLine: data.addressLine ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
        ...links,
      }
    )

    return response.redirect().toPath(`/entreprises/${user.id}`)
  }
}
