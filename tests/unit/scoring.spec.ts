import { test } from '@japa/runner'
import { evaluate, priorityFor } from '#services/scoring_service'
import type { ScoringInput } from '#services/scoring_service'

/**
 * Dossier de base : le plus pauvre possible (0 point sauf motivation et
 * disponibilité). Chaque test ne change que ce dont il a besoin.
 * 'a'.repeat(n) ne contient aucun mot-clé et sert à fixer la longueur.
 */
function base(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    program: 'tutor',
    educationLevel: 'other',
    motivation: 'a'.repeat(100),
    experienceYears: 0,
    experienceDescription: null,
    availability: 'later',
    phone: null,
    city: null,
    birthDate: null,
    portfolioUrl: null,
    ...overrides,
  }
}

test.group('Scoring | dossiers complets', () => {
  test('un dossier parfait obtient 100 points et la priorité haute', ({ assert }) => {
    const result = evaluate(
      base({
        educationLevel: 'master',
        motivation:
          "Je veux devenir tuteur pour l'enseignement, la pedagogie et accompagner les élèves." +
          ' lorem'.repeat(80),
        experienceYears: 5,
        experienceDescription: "Dix ans d'enseignement",
        availability: 'immediate',
        phone: '+22890000000',
        city: 'Lomé',
        birthDate: '1990-01-01',
        portfolioUrl: 'https://linkedin.com/in/test',
      })
    )

    assert.deepEqual(result.breakdown, {
      completeness: 20,
      fit: 25,
      motivation: 20,
      experience: 15,
      availability: 10,
      portfolio: 10,
    })
    assert.equal(result.score, 100)
    assert.equal(result.priority, 'high')
  })

  test('un dossier minimal obtient 8 points et la priorité faible', ({ assert }) => {
    const result = evaluate(base())

    assert.deepEqual(result.breakdown, {
      completeness: 0,
      fit: 0,
      motivation: 6,
      experience: 0,
      availability: 2,
      portfolio: 0,
    })
    assert.equal(result.score, 8)
    assert.equal(result.priority, 'low')
  })

  test('le score est la somme exacte du détail', ({ assert }) => {
    const result = evaluate(base({ experienceYears: 2, availability: 'within_month' }))
    const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0)

    assert.equal(result.score, sum)
  })
})

test.group('Scoring | complétude', () => {
  test('chaque champ optionnel rempli rapporte 5 points', ({ assert }) => {
    assert.equal(evaluate(base({ phone: '+22890000000' })).breakdown.completeness, 5)
    assert.equal(evaluate(base({ phone: '+22890000000', city: 'Lomé' })).breakdown.completeness, 10)
  })

  test('les quatre champs remplis donnent 20 points', ({ assert }) => {
    const result = evaluate(
      base({ phone: '+228', city: 'Lomé', birthDate: '2000-01-01', experienceDescription: 'ok' })
    )
    assert.equal(result.breakdown.completeness, 20)
  })

  test("un champ fait d'espaces ne compte pas", ({ assert }) => {
    assert.equal(evaluate(base({ city: '   ' })).breakdown.completeness, 0)
  })
})

test.group('Scoring | adéquation au programme', () => {
  test("niveau d'études égal ou supérieur à l'attendu : 10 points", ({ assert }) => {
    assert.equal(evaluate(base({ educationLevel: 'bachelor' })).breakdown.fit, 10)
    assert.equal(evaluate(base({ educationLevel: 'doctorate' })).breakdown.fit, 10)
  })

  test("niveau juste en dessous de l'attendu : 5 points", ({ assert }) => {
    // Tuteur attend une licence ; le secondaire est un niveau en dessous
    assert.equal(evaluate(base({ educationLevel: 'secondary' })).breakdown.fit, 5)
  })

  test('le niveau "autre" ne rapporte rien', ({ assert }) => {
    assert.equal(evaluate(base({ educationLevel: 'other' })).breakdown.fit, 0)
  })

  test("l'attendu dépend du programme (ambassadeur : secondaire suffit)", ({ assert }) => {
    const result = evaluate(base({ program: 'ambassador', educationLevel: 'secondary' }))
    assert.equal(result.breakdown.fit, 10)
  })

  test('un mot-clé trouvé rapporte 5 points', ({ assert }) => {
    const result = evaluate(base({ motivation: 'Je veux faire de la pedagogie.' }))
    assert.equal(result.breakdown.fit, 5)
  })

  test('les mots-clés sont plafonnés à 15 points', ({ assert }) => {
    const result = evaluate(
      base({ motivation: 'enseign pedagog eleve cours accompagn tutorat revision' })
    )
    assert.equal(result.breakdown.fit, 15)
  })

  test('études et mots-clés au maximum donnent 25 points', ({ assert }) => {
    const result = evaluate(
      base({
        educationLevel: 'master',
        motivation: 'enseign pedagog eleve cours accompagn tutorat revision',
      })
    )
    assert.equal(result.breakdown.fit, 25)
  })

  test("un mot-clé répété ne compte qu'une fois", ({ assert }) => {
    const result = evaluate(base({ motivation: 'enseign '.repeat(10) }))
    assert.equal(result.breakdown.fit, 5)
  })

  test('les accents et les majuscules sont ignorés', ({ assert }) => {
    const result = evaluate(base({ motivation: 'Élèves' }))
    assert.equal(result.breakdown.fit, 5)
  })

  test('un programme inconnu ne fait pas planter et donne 0', ({ assert }) => {
    const result = evaluate(base({ program: 'inconnu', educationLevel: 'master' }))
    assert.equal(result.breakdown.fit, 0)
  })
})

test.group('Scoring | qualité de la motivation', () => {
  test('les paliers de longueur : 99 → 0, 100 → 6, 200 → 12, 400 → 16', ({ assert }) => {
    assert.equal(evaluate(base({ motivation: 'a'.repeat(99) })).breakdown.motivation, 0)
    assert.equal(evaluate(base({ motivation: 'a'.repeat(100) })).breakdown.motivation, 6)
    assert.equal(evaluate(base({ motivation: 'a'.repeat(199) })).breakdown.motivation, 6)
    assert.equal(evaluate(base({ motivation: 'a'.repeat(200) })).breakdown.motivation, 12)
    assert.equal(evaluate(base({ motivation: 'a'.repeat(399) })).breakdown.motivation, 12)
    assert.equal(evaluate(base({ motivation: 'a'.repeat(400) })).breakdown.motivation, 16)
  })

  test('citer le programme ajoute 4 points', ({ assert }) => {
    const result = evaluate(base({ motivation: 'a'.repeat(100) + ' tuteur' }))
    assert.equal(result.breakdown.motivation, 10)
  })

  test('le maximum est de 20 points', ({ assert }) => {
    const result = evaluate(base({ motivation: 'a'.repeat(500) + ' Tuteur' }))
    assert.equal(result.breakdown.motivation, 20)
  })
})

test.group('Scoring | expérience, disponibilité, portfolio', () => {
  test("l'expérience : 0 → 0, 1-2 ans → 10, 3 ans et plus → 15", ({ assert }) => {
    assert.equal(evaluate(base({ experienceYears: 0 })).breakdown.experience, 0)
    assert.equal(evaluate(base({ experienceYears: 1 })).breakdown.experience, 10)
    assert.equal(evaluate(base({ experienceYears: 2 })).breakdown.experience, 10)
    assert.equal(evaluate(base({ experienceYears: 3 })).breakdown.experience, 15)
    assert.equal(evaluate(base({ experienceYears: 40 })).breakdown.experience, 15)
  })

  test('la disponibilité : immédiate 10, dans le mois 6, plus tard 2', ({ assert }) => {
    assert.equal(evaluate(base({ availability: 'immediate' })).breakdown.availability, 10)
    assert.equal(evaluate(base({ availability: 'within_month' })).breakdown.availability, 6)
    assert.equal(evaluate(base({ availability: 'later' })).breakdown.availability, 2)
  })

  test('une disponibilité inconnue donne 0', ({ assert }) => {
    assert.equal(evaluate(base({ availability: 'demain' })).breakdown.availability, 0)
  })

  test('un lien fourni donne 10 points, sinon 0', ({ assert }) => {
    assert.equal(evaluate(base({ portfolioUrl: 'https://exemple.com' })).breakdown.portfolio, 10)
    assert.equal(evaluate(base({ portfolioUrl: null })).breakdown.portfolio, 0)
    assert.equal(evaluate(base({ portfolioUrl: '   ' })).breakdown.portfolio, 0)
  })
})

test.group('Scoring | niveaux de priorité', () => {
  test('les bornes : 74 → moyenne, 75 → haute', ({ assert }) => {
    assert.equal(priorityFor(74), 'medium')
    assert.equal(priorityFor(75), 'high')
  })

  test('les bornes : 49 → faible, 50 → moyenne', ({ assert }) => {
    assert.equal(priorityFor(49), 'low')
    assert.equal(priorityFor(50), 'medium')
  })

  test('les extrêmes : 0 → faible, 100 → haute', ({ assert }) => {
    assert.equal(priorityFor(0), 'low')
    assert.equal(priorityFor(100), 'high')
  })
})
