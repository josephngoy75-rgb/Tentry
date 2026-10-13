import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { bucketFor, retryAfterSeconds } from '#services/rate_limit_math'

const now = DateTime.fromISO('2026-10-09T12:00:00Z')
const ago = (...minutes: number[]) => minutes.map((m) => now.minus({ minutes: m }))

test.group('retryAfterSeconds', () => {
  test('autorisé tant que le maximum n\'est pas atteint', ({ assert }) => {
    assert.equal(retryAfterSeconds(ago(1, 2, 3, 4), now, 5, 15), 0)
    assert.equal(retryAfterSeconds([], now, 5, 15), 0)
  })

  test('bloqué quand le maximum est atteint dans la fenêtre', ({ assert }) => {
    // Le plus ancien échec date de 10 min : il sort de la fenêtre dans 5 min
    assert.equal(retryAfterSeconds(ago(10, 9, 8, 7, 6), now, 5, 15), 300)
  })

  test('avec plus d\'échecs que le maximum, attend que le compte repasse sous le seuil', ({
    assert,
  }) => {
    // 7 échecs : il faut que les 3 plus anciens sortent, donc attendre le 3e (12 min) → 3 min
    assert.equal(retryAfterSeconds(ago(14, 13, 12, 11, 10, 9, 8), now, 5, 15), 180)
  })

  test('les échecs plus anciens que la fenêtre sont ignorés', ({ assert }) => {
    assert.equal(retryAfterSeconds(ago(20, 20, 20, 20, 20), now, 5, 15), 0)
  })

  test('un échec exactement à la limite de la fenêtre n\'est plus compté', ({ assert }) => {
    assert.equal(retryAfterSeconds(ago(15, 2, 3, 4, 5), now, 5, 15), 0)
  })

  test('l\'ordre des échecs fournis n\'a pas d\'importance', ({ assert }) => {
    assert.equal(retryAfterSeconds(ago(6, 10, 7, 9, 8), now, 5, 15), 300)
  })

  test('attend toujours au moins une seconde quand c\'est bloqué', ({ assert }) => {
    const almostFree = [now.minus({ minutes: 15 }).plus({ milliseconds: 100 }), ...ago(1, 2, 3, 4)]
    assert.isAtLeast(retryAfterSeconds(almostFree, now, 5, 15), 1)
  })
})

test.group('bucketFor', () => {
  test('est stable et fait 64 caractères hexadécimaux', ({ assert }) => {
    const bucket = bucketFor('secret', 'login:email', 'ana@exemple.com')
    assert.match(bucket, /^[a-f0-9]{64}$/)
    assert.equal(bucket, bucketFor('secret', 'login:email', 'ana@exemple.com'))
  })

  test('change avec le type, la clé et le secret', ({ assert }) => {
    const base = bucketFor('secret', 'login:email', 'ana@exemple.com')
    assert.notEqual(base, bucketFor('secret', 'login:ip', 'ana@exemple.com'))
    assert.notEqual(base, bucketFor('secret', 'login:email', 'bob@exemple.com'))
    assert.notEqual(base, bucketFor('autre', 'login:email', 'ana@exemple.com'))
  })

  test('ne contient pas l\'email', ({ assert }) => {
    assert.notInclude(bucketFor('secret', 'login:email', 'ana@exemple.com'), 'ana')
  })
})
