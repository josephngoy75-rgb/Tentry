import { test } from '@japa/runner'
import { verificationDecisionEmail } from '#services/emails'

test.group('verificationDecisionEmail', () => {
  test('l\'email d\'acceptation annonce la vérification', ({ assert }) => {
    const mail = verificationDecisionEmail({ to: 'a@exemple.com', name: 'Ana', approved: true })
    assert.equal(mail.to, 'a@exemple.com')
    assert.include(mail.subject, 'vérifiée')
    assert.include(mail.text, 'Entreprise vérifiée')
  })

  test('l\'email de refus contient le motif', ({ assert }) => {
    const mail = verificationDecisionEmail({
      to: 'a@exemple.com',
      approved: false,
      reason: 'Document illisible',
    })
    assert.include(mail.text, 'Motif : Document illisible')
    assert.include(mail.html, 'Document illisible')
  })

  test('un motif contenant du code ne s\'exécute pas dans le HTML', ({ assert }) => {
    const mail = verificationDecisionEmail({
      to: 'a@exemple.com',
      approved: false,
      reason: '<script>alert(1)</script>',
    })
    assert.notInclude(mail.html, '<script>')
    assert.include(mail.html, '&lt;script&gt;')
  })

  test('sans motif, un texte par défaut est utilisé', ({ assert }) => {
    const mail = verificationDecisionEmail({ to: 'a@exemple.com', approved: false, reason: '  ' })
    assert.include(mail.text, 'Aucun motif précisé.')
  })
})
