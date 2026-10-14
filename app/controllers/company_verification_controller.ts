import { join } from 'node:path'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import CompanyProfile from '#models/company_profile'
import CompanyVerification from '#models/company_verification'
import MediaFile from '#models/media_file'
import { identityKey, isVerificationCurrent } from '#services/company_identity'
import { detectDocumentType, documentExtension, documentMime } from '#services/document_type'
import type { DocumentType } from '#services/document_type'
import { deleteUpload, readHead, saveUpload, uploadDir } from '#services/file_storage'
import { cleanRegistrationNumber } from '#services/registration_number'
import { verificationKinds, verificationLimits, verificationStatuses } from '#config/verification'
import type { VerificationStatus } from '#config/verification'

const KINDS = Object.keys(verificationKinds)
const fileOptions = {
  size: verificationLimits.maxSize,
  extnames: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
}

type CheckedFile = { file: MultipartFile; type: DocumentType }
type CheckResult = { checked: CheckedFile[]; error: string | null }

/**
 * Contrôle un lot de fichiers AVANT d'en enregistrer un seul :
 * un fichier refusé annule tout le lot.
 */
async function checkFiles(files: MultipartFile[]): Promise<CheckResult> {
  if (files.length === 0) return { checked: [], error: 'Ajoutez au moins un document.' }
  if (files.length > verificationLimits.maxFilesPerKind) {
    return {
      checked: [],
      error: `${verificationLimits.maxFilesPerKind} documents maximum pour cette catégorie.`,
    }
  }

  const checked: CheckedFile[] = []
  for (const file of files) {
    if (!file.isValid) {
      return {
        checked: [],
        error:
          file.errors[0]?.type === 'size'
            ? `Document trop lourd (maximum ${verificationLimits.maxSize}).`
            : 'Format non pris en charge : utilisez un PDF, une image JPEG, PNG ou WebP.',
      }
    }
    if (!file.tmpPath) return { checked: [], error: 'Fichier illisible, réessayez.' }

    // Le vrai format est lu dans le contenu du fichier, pas dans son nom
    const type = detectDocumentType(await readHead(file.tmpPath))
    if (!type) return { checked: [], error: "Ce fichier n'est pas un PDF ou une image valide." }

    checked.push({ file, type })
  }
  return { checked, error: null }
}

function describe(doc: MediaFile) {
  const kind = doc.mime === 'application/pdf' ? 'PDF' : 'Image'
  return { id: doc.id, kind: doc.kind, label: `${kind} · ${Math.max(1, Math.round(doc.size / 1024))} Ko` }
}

/**
 * Demande de vérification de l'entreprise connectée.
 * Chaque requête est limitée aux fichiers et à la demande de l'utilisateur connecté.
 */
export default class CompanyVerificationController {
  async show({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    const verification = await CompanyVerification.query().where('user_id', user.id).first()
    const profile = await CompanyProfile.query().where('user_id', user.id).first()
    const docs = (
      await MediaFile.query().where('user_id', user.id).whereIn('kind', KINDS).orderBy('id', 'asc')
    ).map(describe)

    // Approuvée mais nom ou adresse modifiés depuis : "à renouveler"
    const identity = identityKey(
      user.companyName,
      profile?.addressLine,
      profile?.city,
      profile?.country
    )
    let statusKey = (verification?.status ?? 'unverified') as VerificationStatus
    if (
      verification?.status === 'verified' &&
      !isVerificationCurrent(verification.status, verification.verifiedIdentity, identity)
    ) {
      statusKey = 'expired'
    }

    return view.render('pages/company/verification/show', {
      verification,
      statusKey,
      statuses: verificationStatuses,
      kinds: verificationKinds,
      limits: verificationLimits,
      registrationDocs: docs.filter((doc) => doc.kind === 'verif_registration'),
      addressDocs: docs.filter((doc) => doc.kind === 'verif_address'),
      emailVerified: user.isEmailVerified,
      hasAddress: Boolean(profile?.addressLine && profile?.city),
    })
  }

  async submit({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const back = () => response.redirect().back()

    if (!user.isEmailVerified) {
      session.flash('error', "Confirmez d'abord votre adresse email.")
      return back()
    }

    const profile = await CompanyProfile.query().where('user_id', user.id).first()
    if (!profile?.addressLine || !profile.city) {
      session.flash(
        'error',
        "Renseignez d'abord l'adresse (rue et ville) dans le profil : le justificatif doit y correspondre."
      )
      return back()
    }

    // Une demande en cours, ou une vérification encore valable, ne se renvoie pas.
    // Une vérification périmée (nom ou adresse modifiés) peut être renouvelée.
    const identity = identityKey(user.companyName, profile.addressLine, profile.city, profile.country)
    const existing = await CompanyVerification.query().where('user_id', user.id).first()
    if (
      existing &&
      (existing.status === 'pending' ||
        isVerificationCurrent(existing.status, existing.verifiedIdentity, identity))
    ) {
      session.flash('error', 'Une demande est déjà en cours ou acceptée.')
      return back()
    }

    const registrationNumber = cleanRegistrationNumber(request.input('registrationNumber'))
    const registration = await checkFiles(request.files('registration', fileOptions))
    const address = await checkFiles(request.files('address', fileOptions))

    const errors: Record<string, string> = {}
    if (!registrationNumber) {
      errors.registrationNumber =
        'Numéro invalide : 3 à 50 caractères (lettres, chiffres, espaces et . / - _ °).'
    }
    if (registration.error) errors.registration = registration.error
    if (address.error) errors.address = address.error

    if (Object.keys(errors).length > 0) {
      session.flashOnly(['registrationNumber'])
      session.flashErrors(errors)
      return back()
    }

    // Tout est valide : on enregistre. Les anciens documents sont retirés ensuite.
    const oldDocs = await MediaFile.query().where('user_id', user.id).whereIn('kind', KINDS)

    const batches = [
      { kind: 'verif_registration', items: registration.checked },
      { kind: 'verif_address', items: address.checked },
    ]
    for (const batch of batches) {
      for (const { file, type } of batch.items) {
        const filename = await saveUpload(file.tmpPath!, documentExtension[type])
        await MediaFile.create({
          userId: user.id,
          kind: batch.kind,
          path: filename,
          mime: documentMime[type],
          size: file.size,
        })
      }
    }

    await CompanyVerification.updateOrCreate(
      { userId: user.id },
      {
        status: 'pending',
        registrationNumber: registrationNumber!,
        submittedAt: DateTime.now(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        verifiedIdentity: null,
      }
    )

    for (const old of oldDocs) {
      await deleteUpload(old.path)
      await old.delete()
    }

    session.flash('success', 'Votre demande a bien été envoyée. Elle sera examinée par notre équipe.')
    return response.redirect().toPath('/entreprise/verification')
  }

  /**
   * Ouvre un justificatif : réservé à l'entreprise qui l'a envoyé (404 pour tout autre).
   */
  async document({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const media = await MediaFile.query()
      .where('id', Number(params.id) || 0)
      .where('user_id', user.id)
      .whereIn('kind', KINDS)
      .firstOrFail()

    const path = join(uploadDir(), media.path)

    response.header('X-Content-Type-Options', 'nosniff')
    response.header('Cache-Control', 'private, no-store')
    response.header('Content-Security-Policy', "default-src 'none'; sandbox")
    response.header('Content-Type', media.mime)

    // Un PDF est téléchargé, jamais affiché dans la page
    if (media.mime === 'application/pdf') return response.attachment(path, 'justificatif.pdf')
    return response.download(path)
  }
}
