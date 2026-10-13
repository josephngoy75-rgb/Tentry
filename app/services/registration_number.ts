/**
 * Nettoie un numéro d'enregistrement saisi (registre de commerce, identifiant fiscal...).
 * Accepte lettres, chiffres, espaces et . / - _ °. Retourne null si la saisie est invalide.
 */
export function cleanRegistrationNumber(input: unknown): string | null {
  if (typeof input !== 'string') return null

  const value = input.trim().replace(/\s+/g, ' ')
  if (value.length < 3 || value.length > 50) return null
  if (!/^[\p{L}\p{N} ./\-_°]+$/u.test(value)) return null

  return value
}
