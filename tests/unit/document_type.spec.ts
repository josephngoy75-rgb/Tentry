import { test } from '@japa/runner'
import { detectDocumentType } from '#services/document_type'

const text = (value: string) => new TextEncoder().encode(value)

test.group('detectDocumentType', () => {
  test('reconnaît un PDF', ({ assert }) => {
    assert.equal(detectDocumentType(text('%PDF-1.7\n%âãÏÓ')), 'pdf')
  })

  test('reconnaît toujours les images', ({ assert }) => {
    assert.equal(detectDocumentType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])), 'jpeg')
    assert.equal(
      detectDocumentType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])),
      'png'
    )
  })

  test('refuse un fichier texte renommé en .pdf', ({ assert }) => {
    assert.isNull(detectDocumentType(text('ceci est du texte, pas un PDF')))
  })

  test('refuse une signature PDF qui ne commence pas le fichier', ({ assert }) => {
    assert.isNull(detectDocumentType(text('x%PDF-1.7')))
  })

  test('refuse du HTML, un SVG et un document Word', ({ assert }) => {
    assert.isNull(detectDocumentType(text('<html><script>alert(1)</script></html>')))
    assert.isNull(detectDocumentType(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>')))
    assert.isNull(detectDocumentType(Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])))
  })

  test('refuse un fichier vide ou trop court', ({ assert }) => {
    assert.isNull(detectDocumentType(new Uint8Array()))
    assert.isNull(detectDocumentType(text('%PDF')))
  })
})
