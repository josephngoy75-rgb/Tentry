import { test } from '@japa/runner'
import { addressText, mapsSearchUrl } from '#services/maps'

test.group('addressText', () => {
  test('assemble les morceaux avec des virgules', ({ assert }) => {
    assert.equal(addressText(['12 avenue du Commerce', 'Kinshasa', 'RD Congo']), '12 avenue du Commerce, Kinshasa, RD Congo')
  })

  test('ignore les morceaux vides ou absents', ({ assert }) => {
    assert.equal(addressText([null, '  ', 'Kinshasa', undefined]), 'Kinshasa')
  })

  test('retourne une chaîne vide s\'il n\'y a rien', ({ assert }) => {
    assert.equal(addressText([null, undefined, '']), '')
  })
})

test.group('mapsSearchUrl', () => {
  test('construit un lien Google Maps avec l\'adresse encodée', ({ assert }) => {
    assert.equal(
      mapsSearchUrl('Avenue de la Justice, Gombe'),
      'https://www.google.com/maps/search/?api=1&query=Avenue%20de%20la%20Justice%2C%20Gombe'
    )
  })

  test('encode les accents', ({ assert }) => {
    assert.include(mapsSearchUrl('Rue de l\'Éducation') as string, '%C3%89ducation')
  })

  test('un & ou un # dans l\'adresse ne peut pas ajouter de paramètre au lien', ({ assert }) => {
    const url = mapsSearchUrl('Rue & Cie #1') as string
    assert.equal(url, 'https://www.google.com/maps/search/?api=1&query=Rue%20%26%20Cie%20%231')
  })

  test('une adresse vide ou absente donne null', ({ assert }) => {
    assert.isNull(mapsSearchUrl(''))
    assert.isNull(mapsSearchUrl('   '))
    assert.isNull(mapsSearchUrl(null))
    assert.isNull(mapsSearchUrl(undefined))
  })

  test('une adresse trop longue est tronquée à 300 caractères', ({ assert }) => {
    const url = mapsSearchUrl('a'.repeat(500)) as string
    assert.lengthOf(decodeURIComponent(url.split('query=')[1]), 300)
  })
})
