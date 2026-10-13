import { test } from '@japa/runner'
import { cleanRegistrationNumber } from '#services/registration_number'

test.group('cleanRegistrationNumber', () => {
  test('accepte un numéro d\'enregistrement courant', ({ assert }) => {
    assert.equal(cleanRegistrationNumber('CD/KIN/RCCM/21-B-01234'), 'CD/KIN/RCCM/21-B-01234')
    assert.equal(cleanRegistrationNumber('N° 123.456'), 'N° 123.456')
  })

  test('retire les espaces superflus', ({ assert }) => {
    assert.equal(cleanRegistrationNumber('  123   456  '), '123 456')
  })

  test('refuse un numéro trop court ou trop long', ({ assert }) => {
    assert.isNull(cleanRegistrationNumber('ab'))
    assert.isNull(cleanRegistrationNumber('a'.repeat(51)))
    assert.equal(cleanRegistrationNumber('a'.repeat(50)), 'a'.repeat(50))
  })

  test('refuse les caractères dangereux', ({ assert }) => {
    assert.isNull(cleanRegistrationNumber('<script>alert(1)</script>'))
    assert.isNull(cleanRegistrationNumber("123'; DROP TABLE users;--"))
    assert.isNull(cleanRegistrationNumber('123 & 456'))
  })

  test('refuse une saisie vide ou qui n\'est pas du texte', ({ assert }) => {
    assert.isNull(cleanRegistrationNumber(''))
    assert.isNull(cleanRegistrationNumber('   '))
    assert.isNull(cleanRegistrationNumber(null))
    assert.isNull(cleanRegistrationNumber(undefined))
    assert.isNull(cleanRegistrationNumber(12345))
  })
})
