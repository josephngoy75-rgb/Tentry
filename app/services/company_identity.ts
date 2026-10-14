/**
 * Met un morceau d'identité sous une forme comparable :
 * sans accents, en minuscules, espaces simplifiés.
 */
export function normalizeIdentityPart(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Empreinte de l'identité d'une entreprise (nom + adresse).
 * Deux écritures du même nom ou de la même adresse (majuscules, accents, espaces)
 * donnent la même empreinte ; tout vrai changement en donne une autre.
 */
export function identityKey(
  companyName: string | null | undefined,
  addressLine: string | null | undefined,
  city: string | null | undefined,
  country: string | null | undefined
): string {
  return [companyName, addressLine, city, country].map(normalizeIdentityPart).join('|')
}
