import type { HttpContext } from '@adonisjs/core/http'
import Application from '#models/application'
import { applicationValidator } from '#validators/application'
import { programs, educationLevels, availabilities } from '#config/programs'

export default class ApplicationController {
  /**
   * Affiche le formulaire de candidature
   */
  async create({ view }: HttpContext) {
    const programOptions = [
      { value: '', name: 'Choisir un programme' },
      ...Object.entries(programs).map(([value, program]) => ({ value, name: program.label })),
    ]
    const educationOptions = [
      { value: '', name: "Choisir un niveau d'études" },
      ...Object.entries(educationLevels).map(([value, level]) => ({ value, name: level.label })),
    ]
    const availabilityOptions = [
      { value: '', name: 'Choisir une disponibilité' },
      ...Object.entries(availabilities).map(([value, name]) => ({ value, name })),
    ]

    return view.render('pages/applications/create', {
      programOptions,
      educationOptions,
      availabilityOptions,
    })
  }

  /**
   * Valide puis enregistre la candidature
   */
  async store({ request, response, session }: HttpContext) {
    const { birthDate, ...data } = await request.validateUsing(applicationValidator)

    try {
      await Application.create({
        ...data,
        birthDate: birthDate ?? null,
      })
    } catch (error) {
      // Filet de sécurité : doublon d'email passé entre la validation
      // et l'insertion (double-clic, requêtes simultanées)
      if ((error as { code?: string }).code === '23505') {
        session.flashAll()
        session.flashErrors({ email: 'Une candidature existe déjà avec cette adresse email.' })
        return response.redirect().back()
      }
      throw error
    }

    return response.redirect().toPath('/merci')
  }
}
