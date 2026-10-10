import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import MediaFile from '#models/media_file'

/**
 * Types de fichiers visibles par tous. Les justificatifs de vérification
 * (étape suivante) n'en feront jamais partie.
 */
const PUBLIC_KINDS = ['logo', 'photo']

export default class PublicMediaController {
  async show({ params, response }: HttpContext) {
    const media = await MediaFile.query()
      .where('id', Number(params.id) || 0)
      .whereIn('kind', PUBLIC_KINDS)
      .firstOrFail()

    response.header('X-Content-Type-Options', 'nosniff')
    // Une image remplacée reçoit un nouvel identifiant : le cache ne peut pas servir une ancienne version
    response.header('Cache-Control', 'public, max-age=86400')
    response.header('Content-Type', media.mime)

    return response.download(join(app.makePath('storage/uploads'), media.path))
  }
}
