import { test } from '@japa/runner'
import {
  codeMatches,
  formatCode,
  generateLoginCode,
  hashLoginCode,
  maskEmail,
  normalizeCodeInput,
} from '#services/login_code_crypto'

test.group('génération du code', () => {
  test('complète avec des zéros devant', ({ assert }) => {
    assert.equal(formatCode(7), '000007')
    assert.equal(formatCode(0), '000000')
    assert.equal(formatCode(999999), '999999')
  })

  test('le code généré fait toujours 6 chiffres', ({ assert }) => {
    for (let i = 0; i < 300; i++) {
      assert.match(generateLoginCode(), /^\d{6}$/)
    }
  })

  test('les codes ne sont pas tous identiques', ({ assert }) => {
    const codes = new Set(Array.from({ length: 50 }, () => generateLoginCode()))
    assert.isAbove(codes.size, 40)
  })
})

test.group('hashLoginCode et codeMatches', () => {
  const secret = 'secret-de-test'

  test('le haché est stable et fait 64 caractères hexadécimaux', ({ assert }) => {
    const hash = hashLoginCode(secret, 1, '123456')
    assert.match(hash, /^[a-f0-9]{64}$/)
    assert.equal(hash, hashLoginCode(secret, 1, '123456'))
  })

  test('le haché change avec le code, l\'utilisateur et la clé', ({ assert }) => {
    const base = hashLoginCode(secret, 1, '123456')
    assert.notEqual(base, hashLoginCode(secret, 1, '123457'))
    assert.notEqual(base, hashLoginCode(secret, 2, '123456'))
    assert.notEqual(base, hashLoginCode('autre-secret', 1, '123456'))
  })

  test('le haché ne contient pas le code', ({ assert }) => {
    assert.notInclude(hashLoginCode(secret, 1, '123456'), '123456')
  })

  test('accepte le bon code et refuse un mauvais code', ({ assert }) => {
    const hash = hashLoginCode(secret, 5, '482915')
    assert.isTrue(codeMatches(secret, 5, '482915', hash))
    assert.isFalse(codeMatches(secret, 5, '482916', hash))
  })

  test('refuse le bon code pour un autre utilisateur', ({ assert }) => {
    const hash = hashLoginCode(secret, 5, '482915')
    assert.isFalse(codeMatches(secret, 6, '482915', hash))
  })

  test('refuse un haché enregistré mal formé sans planter', ({ assert }) => {
    assert.isFalse(codeMatches(secret, 5, '482915', 'abc'))
    assert.isFalse(codeMatches(secret, 5, '482915', ''))
  })
})

test.group('normalizeCodeInput', () => {
  test('accepte 6 chiffres, avec espaces ou tirets', ({ assert }) => {
    assert.equal(normalizeCodeInput('123456'), '123456')
    assert.equal(normalizeCodeInput(' 123 456 '), '123456')
    assert.equal(normalizeCodeInput('123-456'), '123456')
  })

  test('refuse tout le reste', ({ assert }) => {
    assert.isNull(normalizeCodeInput('12345'))
    assert.isNull(normalizeCodeInput('1234567'))
    assert.isNull(normalizeCodeInput('12345a'))
    assert.isNull(normalizeCodeInput(''))
    assert.isNull(normalizeCodeInput(null))
    assert.isNull(normalizeCodeInput(123456))
  })
})

test.group('maskEmail', () => {
  test('masque le début de l\'adresse', ({ assert }) => {
    assert.equal(maskEmail('kossi@gmail.com'), 'k***@gmail.com')
    assert.equal(maskEmail('ab@x.com'), 'a***@x.com')
  })

  test('une adresse sans arobase est entièrement masquée', ({ assert }) => {
    assert.equal(maskEmail('pasunemail'), '***')
    assert.equal(maskEmail('@x.com'), '***')
  })
})
