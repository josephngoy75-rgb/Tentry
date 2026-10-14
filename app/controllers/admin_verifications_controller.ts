import { join } from 'node:path'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import CompanyProfile from '#models/company_profile'
import CompanyVerification from '#models/company_verification'
import MediaFile from '#models/media_file'
import User from '#models/user'
import { identityKey } from '#services/company_identity'
import { affectedRows } from '#services/db_helpers'
import { verificationDecisionEmail } from '#services/emails'
import { uploadDir } from '#services/file_storage'
import { addressText } from '#services/maps'
import { sendMail } from '#services/mailer'
import { verificationKinds, verificationStatuses } from '#config/verification'

const STATUSES = ['pending', 'verified', 'rejected']
const KINDS = Object.keys(verificationKinds)
const TABS = { pending: 'À traiter', verified: 'Vérifiées', rejected: 'Refusées' }

function describe(doc: MediaFile) {
  const type = doc.mime === 'application/pdf' ? 'PDF' : 'Image'
  return { id: doc.id, kind: doc.kind, label: `${type} · ${Math.max(1, Math.round(doc.size / 1024))} Ko` }
}

/**
 * File de vérification des entreprises (rôle admin uniquement, voir les routes).
 */
export default class AdminVerificationsController {
  async index({ request, view }: HttpContext) {
    const requested = request.input('status')
    const status = STATUSES.includes(requested) ? requested : 'pending'

    const verifications = await CompanyVerification.query()
      .where('status', status)
      .orderBy('submitted_at', status === 'pending' ? 'asc' : 'desc')
      .limit(100)

    const users = await User.query().whereIn(
      'id',
      verifications.map((item) => item.userId)
    )
    const companyNames: Record<number, string> = {}
    for (const user of users) {
      companyNames[user.id] = user.companyName ?? user.fullName ?? 'Entreprise'
    }

    const rows = await db.from('company_verifications').select('status').count('* as total').groupBy('status')
    const counts: Record<string, number> = { pending: 0, verified: 0, rejected: 0 }
    for (const row of rows) counts[row.status] = Number(row.total)

    return view.render('pages/admin/verifications/index', {
      verifications,
      companyNames,
      counts,
      status,
      tabs: TABS,
    })
  }

  async show({ params, view }: HttpContext) {
    const verification = await CompanyVerification.query()
      .where('id', Number(params.id) || 0)
      .firstOrFail()
    const company = await User.findOrFail(verification.userId)
    const profile = await CompanyProfile.query().where('user_id', company.id).first()

    const docs = (
      await MediaFile.query().where('user_id', company.id).whereIn('kind', KINDS).orderBy('id', 'asc')
    ).map(describe)

    return view.render('pages/admin/verifications/show', {
      verification,
      company,
      address: addressText([profile?.addressLine, profile?.city, profile?.country]),
      // Ce que l'admin voit à l'écran : renvoyé avec le formulaire d'approbation
      seen: identityKey(company.companyName, profile?.addressLine, profile?.city, profile?.country),
      registrationDocs: docs.filter((doc) => doc.kind === 'verif_registration'),
      addressDocs: docs.filter((doc) => doc.kind === 'verif_address'),
      kinds: verificationKinds,
      statuses: verificationStatuses,
    })
  }

  async approve({ params, request, auth, response, session }: HttpContext) {
    const admin = auth.getUserOrFail()
    const verification = await CompanyVerification.query()
      .where('id', Number(params.id) || 0)
      .firstOrFail()
    const company = await User.findOrFail(verification.userId)
    const profile = await CompanyProfile.query().where('user_id', company.id).first()
    const back = `/admin/verifications/${verification.id}`

    const identity = identityKey(
      company.companyName,
      profile?.addressLine,
      profile?.city,
      profile?.country
    )

    // L'admin n'approuve que ce qu'il a vu : si le profil a changé depuis, on refuse
    if (String(request.input('seen') ?? '') !== identity) {
      session.flash(
        'error',
        "Le profil de l'entreprise a changé depuis votre examen. Relisez-le, puis approuvez à nouveau."
      )
      return response.redirect().toPath(back)
    }

    // Décision atomique : seulement si la demande est encore en cours d'examen
    const updated = await db
      .from('company_verifications')
      .where('id', verification.id)
      .where('status', 'pending')
      .update({
        status: 'verified',
        reviewed_at: new Date(),
        reviewed_by: admin.id,
        rejection_reason: null,
        verified_identity: identity,
        updated_at: new Date(),
      })

    if (affectedRows(updated) !== 1) {
      session.flash('error', 'Cette demande a déjà été traitée.')
      return response.redirect().toPath(back)
    }

    sendMail(
      verificationDecisionEmail({ to: company.email, name: company.fullName, approved: true })
    ).catch((error) => logger.error({ err: error }, "Échec de l'envoi de l'email de décision"))

    session.flash('success', 'Entreprise vérifiée.')
    return response.redirect().toPath('/admin/verifications')
  }

  async reject({ params, request, auth, response, session }: HttpContext) {
    const admin = auth.getUserOrFail()
    const verification = await CompanyVerification.query()
      .where('id', Number(params.id) || 0)
      .firstOrFail()
    const company = await User.findOrFail(verification.userId)
    const back = `/admin/verifications/${verification.id}`

    const reason = String(request.input('reason') ?? '').trim()
    if (reason.length < 5 || reason.length > 500) {
      session.flashOnly(['reason'])
      session.flashErrors({ reason: 'Indiquez le motif du refus (5 à 500 caractères).' })
      return response.redirect().toPath(back)
    }

    const updated = await db
      .from('company_verifications')
      .where('id', verification.id)
      .where('status', 'pending')
      .update({
        status: 'rejected',
        reviewed_at: new Date(),
        reviewed_by: admin.id,
        rejection_reason: reason,
        verified_identity: null,
        updated_at: new Date(),
      })

    if (affectedRows(updated) !== 1) {
      session.flash('error', 'Cette demande a déjà été traitée.')
      return response.redirect().toPath(back)
    }

    sendMail(
      verificationDecisionEmail({
        to: company.email,
        name: company.fullName,
        approved: false,
        reason,
      })
    ).catch((error) => logger.error({ err: error }, "Échec de l'envoi de l'email de décision"))

    session.flash('success', 'Demande refusée. Le motif a été transmis à l\'entreprise.')
    return response.redirect().toPath('/admin/verifications')
  }

  /**
   * Ouvre un justificatif (réservé à l'admin). Tout autre type de fichier donne une 404.
   */
  async document({ params, response }: HttpContext) {
    const media = await MediaFile.query()
      .where('id', Number(params.id) || 0)
      .whereIn('kind', KINDS)
      .firstOrFail()

    const path = join(uploadDir(), media.path)

    response.header('X-Content-Type-Options', 'nosniff')
    response.header('Cache-Control', 'private, no-store')
    response.header('Content-Security-Policy', "default-src 'none'; sandbox")
    response.header('Content-Type', media.mime)

    if (media.mime === 'application/pdf') return response.attachment(path, 'justificatif.pdf')
    return response.download(path)
  }
}
