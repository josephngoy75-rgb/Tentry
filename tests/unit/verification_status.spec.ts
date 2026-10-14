import { test } from '@japa/runner'
import { identityKey, isVerificationCurrent } from '#services/company_identity'

const approved = identityKey('Acme SARL', '12 avenue du Commerce', 'Kinshasa', 'RD Congo')

test.group('isVerificationCurrent', () => {
  test('valable : approuvée et identité inchangée', ({ assert }) => {
    assert.isTrue(isVerificationCurrent('verified', approved, approved))
  })

  test('toujours valable après une simple correction de majuscules, d\'accents ou d\'espaces', ({
    assert,
  }) => {
    const rewritten = identityKey(' ACME  sarl ', '12 Avenue du  commerce', 'KINSHASA', 'rd congo')
    assert.isTrue(isVerificationCurrent('verified', approved, rewritten))
  })

  test('perdue si l\'adresse change', ({ assert }) => {
    const moved = identityKey('Acme SARL', '40 boulevard Lumumba', 'Kinshasa', 'RD Congo')
    assert.isFalse(isVerificationCurrent('verified', approved, moved))
  })

  test('perdue si le nom change', ({ assert }) => {
    const renamed = identityKey('Acme Holding', '12 avenue du Commerce', 'Kinshasa', 'RD Congo')
    assert.isFalse(isVerificationCurrent('verified', approved, renamed))
  })

  test('jamais valable tant que la demande n\'est pas approuvée', ({ assert }) => {
    assert.isFalse(isVerificationCurrent('pending', approved, approved))
    assert.isFalse(isVerificationCurrent('rejected', approved, approved))
    assert.isFalse(isVerificationCurrent(null, approved, approved))
    assert.isFalse(isVerificationCurrent(undefined, approved, approved))
  })

  test('jamais valable sans identité enregistrée', ({ assert }) => {
    assert.isFalse(isVerificationCurrent('verified', null, approved))
    assert.isFalse(isVerificationCurrent('verified', '', ''))
  })
})
