import { test } from '@japa/runner'
import { normalizeUrl } from '#services/url_helpers'

test.group('normalizeUrl', () => {
  test('une saisie vide ou absente donne null', ({ assert }) => {
    assert.isNull(normalizeUrl(''))
    assert.isNull(normalizeUrl('   '))
    assert.isNull(normalizeUrl(null))
    assert.isNull(normalizeUrl(undefined))
  })

  test('ajoute https:// quand le protocole manque', ({ assert }) => {
    assert.equal(normalizeUrl('exemple.com'), 'https://exemple.com/')
  })

  test('garde un lien http ou https valide', ({ assert }) => {
    assert.equal(normalizeUrl('https://exemple.com/page'), 'https://exemple.com/page')
    assert.equal(normalizeUrl('http://exemple.com'), 'http://exemple.com/')
  })

  test('refuse les protocoles dangereux', ({ assert }) => {
    assert.isNull(normalizeUrl('javascript:alert(1)'))
    assert.isNull(normalizeUrl('data:text/html,<script>alert(1)</script>'))
    assert.isNull(normalizeUrl('ftp://exemple.com'))
  })

  test('refuse un texte qui n\'est pas un lien', ({ assert }) => {
    assert.isNull(normalizeUrl('pas un lien'))
    assert.isNull(normalizeUrl('motseul'))
  })

  test('impose le domaine du réseau social', ({ assert }) => {
    assert.equal(
      normalizeUrl('linkedin.com/company/talentry', ['linkedin.com']),
      'https://linkedin.com/company/talentry'
    )
    assert.equal(
      normalizeUrl('https://www.linkedin.com/in/moi', ['linkedin.com']),
      'https://www.linkedin.com/in/moi'
    )
    assert.isNull(normalizeUrl('https://autre-site.com/linkedin.com', ['linkedin.com']))
  })

  test('un faux domaine qui finit comme le vrai est refusé', ({ assert }) => {
    assert.isNull(normalizeUrl('https://faux-linkedin.com', ['linkedin.com']))
  })
})
