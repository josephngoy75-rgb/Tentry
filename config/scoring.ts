/**
 * Barème de scoring SKULLVI (total : 100 points).
 * Modifier ce fichier suffit pour ajuster la notation :
 * aucun chiffre n'est écrit en dur dans la logique.
 *
 *   Complétude    20  (4 champs × 5)
 *   Adéquation    25  (études 10 + mots-clés 15)
 *   Motivation    20  (longueur 16 + programme cité 4)
 *   Expérience    15
 *   Disponibilité 10
 *   Portfolio     10
 */
export const scoring = {
  completeness: {
    pointsPerField: 5,
  },

  fit: {
    educationMatch: 10,
    educationOneLevelBelow: 5,
    pointsPerKeyword: 5,
    maxKeywordPoints: 15,
  },

  motivation: {
    /** Du palier le plus haut au plus bas : le premier atteint s'applique */
    lengthTiers: [
      { minLength: 400, points: 16 },
      { minLength: 200, points: 12 },
      { minLength: 100, points: 6 },
    ],
    programMentionBonus: 4,
  },

  experience: {
    /** Du palier le plus haut au plus bas : le premier atteint s'applique */
    yearsTiers: [
      { minYears: 3, points: 15 },
      { minYears: 1, points: 10 },
    ],
  },

  availability: {
    immediate: 10,
    within_month: 6,
    later: 2,
  } as Record<string, number>,

  portfolio: {
    points: 10,
  },

  priority: {
    /** Score minimal pour la priorité haute */
    high: 75,
    /** Score minimal pour la priorité moyenne */
    medium: 50,
  },
}
