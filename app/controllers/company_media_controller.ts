import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, open, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import MediaFile from '#models/media_file'
import { detectImageType, imageExtension, imageMime } from '#services/image_type'
import { mediaLimits } from '#config/companies'

const uploadDir = () => app.makePath('storage/uploads')
const fileOptions = (size: string) => ({ size, extnames: ['jpg', 'jpeg', 'png', 'webp'] })

/**
 * Lit les 12 premiers octets d'un fichier, de quoi reconnaître son vrai format.
 */
async function readHead(path: string): Promise<Uint8Array> {
  const handle = await open(path, 'r')
  try {
    const buffer = Buffer.alloc(12)
    const { bytesRead } = await handle.read(buffer, 0, 12, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

/**
 * Contrôle puis enregistre une image. Retourne un message d'erreur, ou null si tout va bien.
 */
async function storeImage(
  file: MultipartFile,
  userId: number,
  kind: 'logo' | 'photo'
): Promise<string | null> {
  if (!file.isValid) {
    const reason = file.errors[0]?.type
    return reason === 'size'
      ? `Image trop lourde (maximum ${kind === 'logo' ? mediaLimits.logoMaxSize : mediaLimits.photoMaxSize}).`
      : 'Format non pris en charge : utilisez une image JPEG, PNG ou WebP.'
  }
  if (!file.tmpPath) return 'Fichier illisible, réessayez.'

  // Le vrai format est lu dans le contenu du fichier, pas dans son nom
  const type = detectImageType(await readHead(file.tmpPath))
  if (!type) return "Ce fichier n'est pas une image JPEG, PNG ou WebP valide."

  const filename = `${randomUUID()}.${imageExtension[type]}`
  await mkdir(uploadDir(), { recursive: true })
  await copyFile(file.tmpPath, join(uploadDir(), filename))

  await MediaFile.create({ userId, kind, path: filename, mime: imageMime[type], size: file.size })
  return null
}

async function removeMedia(media: MediaFile) {
  await unlink(join(uploadDir(), media.path)).catch(() => {})
  await media.delete()
}

/**
 * Logo et photos de l'entreprise connectée.
 * Chaque requête est limitée aux fichiers de l'utilisateur connecté.
 */
export default class CompanyMediaController {
  async edit({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const media = await MediaFile.query()
      .where('user_id', user.id)
      .whereIn('kind', ['logo', 'photo'])
      .orderBy('id', 'asc')

    const logo = media.filter((item) => item.kind === 'logo').at(-1) ?? null
    const photos = media.filter((item) => item.kind === 'photo')

    return view.render('pages/company/profile/media', {
      logo,
      photos,
      limits: mediaLimits,
    })
  }

  async uploadLogo({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const file = request.file('logo', fileOptions(mediaLimits.logoMaxSize))

    if (!file) {
      session.flashErrors({ logo: 'Choisissez une image.' })
      return response.redirect().back()
    }

    const previous = await MediaFile.query().where('user_id', user.id).where('kind', 'logo')
    const error = await storeImage(file, user.id, 'logo')

    if (error) {
      session.flashErrors({ logo: error })
      return response.redirect().back()
    }

    // L'ancien logo n'est supprimé qu'une fois le nouveau bien enregistré
    for (const old of previous) await removeMedia(old)

    return response.redirect().toPath('/entreprise/profil/medias')
  }

  async uploadPhotos({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const files = request.files('photos', fileOptions(mediaLimits.photoMaxSize))

    if (files.length === 0) {
      session.flashErrors({ photos: 'Choisissez au moins une image.' })
      return response.redirect().back()
    }

    const existing = await MediaFile.query().where('user_id', user.id).where('kind', 'photo')
    const remaining = mediaLimits.maxPhotos - existing.length

    if (files.length > remaining) {
      session.flashErrors({
        photos:
          remaining > 0
            ? `Vous pouvez ajouter ${remaining} photo(s) de plus (maximum ${mediaLimits.maxPhotos}).`
            : `Vous avez atteint le maximum de ${mediaLimits.maxPhotos} photos. Supprimez-en une d'abord.`,
      })
      return response.redirect().back()
    }

    let firstError: string | null = null
    for (const file of files) {
      const error = await storeImage(file, user.id, 'photo')
      if (error && !firstError) firstError = error
    }

    if (firstError) {
      session.flashErrors({ photos: `Certaines images ont été refusées : ${firstError}` })
      return response.redirect().back()
    }

    return response.redirect().toPath('/entreprise/profil/medias')
  }

  async destroy({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    // Une image d'une autre entreprise (ou un identifiant invalide) donne une 404
    const media = await MediaFile.query()
      .where('id', Number(params.id) || 0)
      .where('user_id', user.id)
      .whereIn('kind', ['logo', 'photo'])
      .firstOrFail()

    await removeMedia(media)
    return response.redirect().toPath('/entreprise/profil/medias')
  }
}
