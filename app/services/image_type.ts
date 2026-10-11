export type ImageType = 'jpeg' | 'png' | 'webp'

export const imageMime: Record<ImageType, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export const imageExtension: Record<ImageType, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false
  return signature.every((value, index) => bytes[offset + index] === value)
}

/**
 * Détecte le vrai format d'une image d'après ses premiers octets.
 * Le nom ou l'extension du fichier ne comptent pas : ils sont modifiables
 * par l'utilisateur. Retourne null pour tout autre contenu (texte, SVG, HTML...).
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(bytes, PNG_SIGNATURE)) return 'png'
  // WebP : "RIFF" + 4 octets de taille + "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'webp'
  }
  return null
}
