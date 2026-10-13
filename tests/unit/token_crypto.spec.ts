import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { generateToken, hashToken, isTokenUsable, isWellFormedToken } from '#services/token_crypto'

test.group('hashToken et generateToken', () => {
  test('le hachage SHA-256 est correct (vecteur de référence)', ({ assert }) => {
    assert.equal(
      hashToken('abc'),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })

  test('un jeton fait 64 caractères hexadécimaux et son hachage est différent du jeton', ({
    assert,
  }) => {
    const { token, hash } = generateToken()
    assert.match(token, /^[a-f0-9]{64}$/)
    assert.match(hash, /^[a-f0-9]{64}$/)
    assert.notEqual(token, hash)
    assert.equal(hash, hashToken(token))
  })

  test('deux jetons générés sont toujours différents', ({ assert }) => {
    assert.notEqual(generateToken().token, generateToken().token)
  })
})

test.group('isWellFormedToken', () => {
  test('accepte un jeton généré', ({ assert }) => {
    assert.isTrue(isWellFormedToken(generateToken().token))
  })

  test('refuse un jeton trop court, trop long ou vide', ({ assert }) => {
    assert.isFalse(isWellFormedToken('abc'))
    assert.isFalse(isWellFormedToken('a'.repeat(63)))
    assert.isFalse(isWellFormedToken('a'.repeat(65)))
    assert.isFalse(isWellFormedToken(''))
  })

  test('refuse les caractères non hexadécimaux, les majuscules et les chemins', ({ assert }) => {
    assert.isFalse(isWellFormedToken('g'.repeat(64)))
    assert.isFalse(isWellFormedToken('A'.repeat(64)))
    assert.isFalse(isWellFormedToken('../' + 'a'.repeat(61)))
    assert.isFalse(isWellFormedToken(`${'a'.repeat(63)} `))
  })

  test('refuse ce qui n\'est pas du texte', ({ assert }) => {
    assert.isFalse(isWellFormedToken(null))
    assert.isFalse(isWellFormedToken(undefined))
    assert.isFalse(isWellFormedToken(123))
  })
})

test.group('isTokenUsable', () => {
  const now = DateTime.fromISO('2026-10-08T12:00:00Z')

  test('un jeton non expiré et non utilisé est utilisable', ({ assert }) => {
    assert.isTrue(isTokenUsable({ expiresAt: now.plus({ minutes: 5 }), usedAt: null }, now))
  })

  test('un jeton expiré est refusé', ({ assert }) => {
    assert.isFalse(isTokenUsable({ expiresAt: now.minus({ minutes: 1 }), usedAt: null }, now))
  })

  test('un jeton qui expire pile à cet instant est refusé', ({ assert }) => {
    assert.isFalse(isTokenUsable({ expiresAt: now, usedAt: null }, now))
  })

  test('un jeton déjà utilisé est refusé, même non expiré', ({ assert }) => {
    assert.isFalse(
      isTokenUsable({ expiresAt: now.plus({ hours: 1 }), usedAt: now.minus({ minutes: 1 }) }, now)
    )
  })
})
