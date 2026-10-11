import type { MailMessage } from '#services/mailer'

/**
 * Échappe les caractères spéciaux HTML : un nom contenant du code ne doit jamais l'exécuter.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Construit un lien absolu à partir de l'adresse publique configurée (APP_PUBLIC_URL).
 * On n'utilise jamais l'en-tête Host de la requête : il peut être falsifié pour piéger les liens.
 */
export function appLink(path: string): string {
  const base = (process.env.APP_PUBLIC_URL ?? 'http://localhost:3333').replace(/\/+$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

function greeting(name?: string | null): string {
  return name ? `Bonjour ${name},` : 'Bonjour,'
}

function wrap(contentHtml: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0f0f0f; line-height: 1.5;">
  <p style="font-size: 22px; font-weight: bold; color: #0b8f3a; margin-bottom: 24px;">Talentry</p>
  ${contentHtml}
  <p style="font-size: 12px; color: #6b7280; margin-top: 32px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
</div>`
}

function button(link: string, label: string): string {
  return `<p style="margin: 24px 0;"><a href="${escapeHtml(link)}" style="background: #0b8f3a; color: #ffffff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: bold;">${escapeHtml(label)}</a></p>`
}

export function passwordResetEmail(input: {
  to: string
  name?: string | null
  token: string
}): MailMessage {
  const link = appLink(`/reinitialiser-mot-de-passe/${input.token}`)
  const hello = greeting(input.name)

  return {
    to: input.to,
    subject: 'Réinitialisation de votre mot de passe Talentry',
    text: [
      hello,
      '',
      'Vous avez demandé à réinitialiser votre mot de passe. Ouvrez ce lien (valable 1 heure) :',
      link,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe ne change pas.",
    ].join('\n'),
    html: wrap(`
  <p>${escapeHtml(hello)}</p>
  <p>Vous avez demandé à réinitialiser votre mot de passe. Le lien ci-dessous est valable 1 heure.</p>
  ${button(link, 'Choisir un nouveau mot de passe')}
  <p style="font-size: 13px; color: #6b7280;">Ou copiez ce lien dans votre navigateur :<br />${escapeHtml(link)}</p>
  <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe ne change pas.</p>`),
  }
}

export function passwordChangedEmail(input: { to: string; name?: string | null }): MailMessage {
  const hello = greeting(input.name)

  return {
    to: input.to,
    subject: 'Votre mot de passe Talentry a été modifié',
    text: [
      hello,
      '',
      "Le mot de passe de votre compte vient d'être modifié.",
      "Si ce n'est pas vous, demandez immédiatement un nouveau mot de passe depuis la page de connexion.",
    ].join('\n'),
    html: wrap(`
  <p>${escapeHtml(hello)}</p>
  <p>Le mot de passe de votre compte vient d'être modifié.</p>
  <p>Si ce n'est pas vous, demandez immédiatement un nouveau mot de passe depuis la page de connexion.</p>`),
  }
}

export function verificationEmail(input: {
  to: string
  name?: string | null
  token: string
}): MailMessage {
  const link = appLink(`/confirmer-email/${input.token}`)
  const hello = greeting(input.name)

  return {
    to: input.to,
    subject: 'Confirmez votre adresse email Talentry',
    text: [
      hello,
      '',
      'Bienvenue sur Talentry. Confirmez votre adresse email avec ce lien (valable 24 heures) :',
      link,
      '',
      "Si vous n'avez pas créé de compte, ignorez cet email.",
    ].join('\n'),
    html: wrap(`
  <p>${escapeHtml(hello)}</p>
  <p>Bienvenue sur Talentry. Confirmez votre adresse email avec le bouton ci-dessous (valable 24 heures).</p>
  ${button(link, 'Confirmer mon adresse')}
  <p style="font-size: 13px; color: #6b7280;">Ou copiez ce lien dans votre navigateur :<br />${escapeHtml(link)}</p>
  <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>`),
  }
}
