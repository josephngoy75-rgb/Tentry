/**
 * Assemble les morceaux d'une adresse ("12 avenue X", "Kinshasa", "RD Congo")
 * en ignorant les morceaux vides.
 */
export function addressText(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

/**
 * Lien qui ouvre Google Maps sur une adresse (aucune clé requise).
 * L'adresse est encodée : elle ne peut pas modifier le reste du lien.
 * Retourne null si l'adresse est vide.
 */
export function mapsSearchUrl(address: string | null | undefined): string | null {
  const text = (address ?? '').trim().replace(/\s+/g, ' ').slice(0, 300)
  if (!text) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`
}
