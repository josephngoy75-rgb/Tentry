import { test } from '@japa/runner'
import { identityKey, normalizeIdentityPart } from '#services/company_identity'

test.group('normalizeIdentityPart', () => {
  test('retire les accents, les majuscules et les espaces superflus', ({ assert }) => {
    assert.equal(normalizeIdentityPart('  Société   Générale  '), 'societe generale')
  })

  test('une valeur absente donne une chaîne vide', ({ assert }) => {
    assert.equal(normalizeIdentityPart(null), '')
    assert.equal(normalizeIdentityPart(undefined), '')
  })
})

test.group('identityKey', () => {
  test('deux écritures du même nom et de la même adresse donnent la même empreinte', ({ assert }) => {
    assert.equal(
      identityKey('Acme SARL', '12 Avenue du Commerce', 'Kinshasa', 'RD Congo'),
      identityKey(' ACME  sarl ', '12 avenue  du commerce', 'kinshasa', 'rd congo')
    )
  })

  test('ignore les accents', ({ assert }) => {
    assert.equal(
      identityKey('Éducation Plus', 'Rue 1', 'Kinshasa', 'RDC'),
      identityKey('Education Plus', 'Rue 1', 'Kinshasa', 'RDC')
    )
  })

  test('un changement de nom, de rue, de ville ou de pays change l\'empreinte', ({ assert }) => {
    const base = identityKey('Acme', 'Rue 1', 'Kinshasa', 'RDC')
    assert.notEqual(base, identityKey('Acme Plus', 'Rue 1', 'Kinshasa', 'RDC'))
    assert.notEqual(base, identityKey('Acme', 'Rue 2', 'Kinshasa', 'RDC'))
    assert.notEqual(base, identityKey('Acme', 'Rue 1', 'Lubumbashi', 'RDC'))
    assert.notEqual(base, identityKey('Acme', 'Rue 1', 'Kinshasa', 'Togo'))
  })

  test('un morceau déplacé dans un autre champ change l\'empreinte', ({ assert }) => {
    assert.notEqual(
      identityKey('Acme', 'Kinshasa', 'Rue 1', 'RDC'),
      identityKey('Acme', 'Rue 1', 'Kinshasa', 'RDC')
    )
  })

  test('les champs absents donnent une empreinte stable', ({ assert }) => {
    assert.equal(identityKey('Acme', null, null, null), 'acme|||')
    assert.equal(identityKey(null, undefined, '', '  '), '|||')
  })
})
