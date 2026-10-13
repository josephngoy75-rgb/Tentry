import { createTransport } from 'nodemailer'
import type { Transporter } from 'nodemailer'

export type MailMessage = { to: string; subject: string; text: string; html: string }

/** Derniers emails "envoyés" en mode log (utile pour les tests). */
export const outbox: MailMessage[] = []

let transporter: Transporter | null = null

function smtpTransport(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587)
    transporter = createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    })
  }
  return transporter
}

/**
 * Envoie un email.
 * - MAIL_DRIVER=smtp : envoi réel
 * - MAIL_DRIVER=log (défaut) : affiche l'email dans le terminal, sans rien envoyer
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const driver = process.env.MAIL_DRIVER ?? 'log'
  const from = process.env.MAIL_FROM ?? 'Talentry <no-reply@talentry.local>'

  if (driver === 'smtp') {
    await smtpTransport().sendMail({ from, ...message })
    return
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'MAIL_DRIVER=smtp est obligatoire en production : le mode log afficherait les liens dans les journaux.'
    )
  }

  outbox.push(message)
  if (outbox.length > 50) outbox.shift()

  console.log(
    [
      '',
      '──────────── EMAIL (mode log, rien n\'est envoyé) ────────────',
      `À      : ${message.to}`,
      `Objet  : ${message.subject}`,
      '',
      message.text,
      '───────────────────────────────────────────────────────────────',
      '',
    ].join('\n')
  )
}
