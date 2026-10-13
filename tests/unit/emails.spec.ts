import { test } from '@japa/runner'
import { appLink, escapeHtml, passwordChangedEmail, passwordResetEmail } from '#services/emails'

test.group('escapeHtml', () => {
  test('échappe les caractères spéciaux HTML', ({ assert }) => {
    assert.equal(escapeHtml(`<a href="x">&'</a>`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })

  test('laisse un texte ordinaire intact', ({ assert }) => {
    assert.equal(escapeHtml('Kossi Mensah'), 'Kossi Mensah')
  })
})

test.group('appLink', (group) => {
  let previous: string | undefined

  group.each.setup(() => {
    previous = process.env.APP_PUBLIC_URL
  })
  group.each.teardown(() => {
    if (previous === undefined) delete process.env.APP_PUBLIC_URL
    else process.env.APP_PUBLIC_URL = previous
  })

  test("construit le lien depuis APP_PUBLIC_URL, sans double barre oblique", ({ assert }) => {
    process.env.APP_PUBLIC_URL = 'https://talentry.test/'
    assert.equal(appLink('/x'), 'https://talentry.test/x')
  })

  test('utilise localhost en développement si rien n\'est configuré', ({ assert }) => {
    delete process.env.APP_PUBLIC_URL
    assert.equal(appLink('/x'), 'http://localhost:3333/x')
  })
})

test.group('emails de mot de passe', () => {
  test('l\'email de réinitialisation contient le lien dans le texte et dans le HTML', ({
    assert,
  }) => {
    const token = 'a'.repeat(64)
    const mail = passwordResetEmail({ to: 'ana@exemple.com', name: 'Ana', token })

    assert.equal(mail.to, 'ana@exemple.com')
    assert.include(mail.text, `/reinitialiser-mot-de-passe/${token}`)
    assert.include(mail.html, `/reinitialiser-mot-de-passe/${token}`)
  })

  test('un nom contenant du code ne s\'exécute pas dans le HTML', ({ assert }) => {
    const mail = passwordResetEmail({
      to: 'ana@exemple.com',
      name: '<script>alert(1)</script>',
      token: 'a'.repeat(64),
    })

    assert.notInclude(mail.html, '<script>')
    assert.include(mail.html, '&lt;script&gt;')
  })

  test('l\'email de confirmation de changement s\'adresse au bon destinataire', ({ assert }) => {
    const mail = passwordChangedEmail({ to: 'ana@exemple.com', name: null })

    assert.equal(mail.to, 'ana@exemple.com')
    assert.include(mail.text, 'Bonjour,')
  })
})
