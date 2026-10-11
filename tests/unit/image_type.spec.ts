import { test } from '@japa/runner'
import { detectImageType } from '#services/image_type'

const text = (value: string) => new TextEncoder().encode(value)

test.group('detectImageType', () => {
  test('reconnaît un JPEG', ({ assert }) => {
    assert.equal(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])), 'jpeg')
  })

  test('reconnaît un PNG', ({ assert }) => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])
    assert.equal(detectImageType(png), 'png')
  })

  test('reconnaît un WebP', ({ assert }) => {
    const webp = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50,
    ])
    assert.equal(detectImageType(webp), 'webp')
  })

  test('refuse un fichier texte, même renommé en image', ({ assert }) => {
    assert.isNull(detectImageType(text('ceci est du texte, pas une image')))
  })

  test('refuse un SVG, qui peut contenir des scripts', ({ assert }) => {
    assert.isNull(detectImageType(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')))
  })

  test('refuse du HTML', ({ assert }) => {
    assert.isNull(detectImageType(text('<html><script>alert(1)</script></html>')))
  })

  test('refuse un fichier trop court ou vide', ({ assert }) => {
    assert.isNull(detectImageType(new Uint8Array()))
    assert.isNull(detectImageType(Uint8Array.from([0xff, 0xd8])))
  })

  test("refuse un conteneur RIFF qui n'est pas du WebP (ex. un fichier audio WAV)", ({ assert }) => {
    const wav = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])
    assert.isNull(detectImageType(wav))
  })
})
