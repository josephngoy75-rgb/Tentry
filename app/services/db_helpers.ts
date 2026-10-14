/**
 * Nombre de lignes touchées par un update ou un delete, quelle que soit la forme
 * du résultat renvoyée par le pilote (nombre ou tableau).
 */
export function affectedRows(result: unknown): number {
  return Array.isArray(result) ? Number(result[0]) : Number(result)
}
