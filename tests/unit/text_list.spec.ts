import { test } from '@japa/runner'
import { parseList } from '#services/text_list'

test.group('parseList', () => {
  test('sépare par virgules, points-virgules et retours à la ligne', ({ assert }) => {
    assert.deepEqual(parseList('React, Node.js; SQL\nDocker'), ['React', 'Node.js', 'SQL', 'Docker'])
  })

  test('retire les espaces superflus et les éléments vides', ({ assert }) => {
    assert.deepEqual(parseList('  React ,, , Vue   JS  '), ['React', 'Vue JS'])
  })

  test('supprime les doublons sans tenir compte des majuscules', ({ assert }) => {
    assert.deepEqual(parseList('SQL, sql, Sql'), ['SQL'])
  })

  test('une saisie vide ou absente donne une liste vide', ({ assert }) => {
    assert.deepEqual(parseList(''), [])
    assert.deepEqual(parseList(null), [])
    assert.deepEqual(parseList(undefined), [])
  })

  test('le nombre de compétences est plafonné', ({ assert }) => {
    const text = Array.from({ length: 50 }, (_, i) => `skill${i}`).join(',')
    assert.lengthOf(parseList(text, 30), 30)
  })

  test('un élément de plus de 60 caractères est ignoré', ({ assert }) => {
    assert.deepEqual(parseList(`${'a'.repeat(61)}, ok`), ['ok'])
  })
})
