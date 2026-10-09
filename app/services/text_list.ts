/**
 * Transforme une saisie libre ("React, Node.js ; SQL") en liste propre :
 * séparée par virgule, point-virgule ou retour à la ligne, sans espaces
 * superflus ni doublons (sans tenir compte des majuscules).
 */
export function parseList(text: string | null | undefined, maxItems = 30): string[] {
  if (!text) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of text.split(/[,;\n]/)) {
    const item = raw.trim().replace(/\s+/g, ' ')
    if (item.length === 0 || item.length > 60) continue

    const key = item.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    result.push(item)
    if (result.length >= maxItems) break
  }

  return result
}
