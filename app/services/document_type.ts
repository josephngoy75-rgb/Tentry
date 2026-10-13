import { detectImageType, imageExtension, imageMime } from '#services/image_type'
import type { ImageType } from '#services/image_type'

export type DocumentType = ImageType | 'pdf'

export const documentMime: Record<DocumentType, string> = { ...imageMime, pdf: 'application/pdf' }
export const documentExtension: Record<DocumentType, string> = { ...imageExtension, pdf: 'pdf' }

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] // "%PDF-"

/**
 * Détecte le vrai format d'un justificatif (PDF, JPEG, PNG, WebP) d'après ses premiers octets.
 * Le nom et l'extension du fichier ne comptent pas. Retourne null pour tout autre contenu.
 */
export function detectDocumentType(bytes: Uint8Array): DocumentType | null {
  if (bytes.length >= PDF_SIGNATURE.length && PDF_SIGNATURE.every((v, i) => bytes[i] === v)) {
    return 'pdf'
  }
  return detectImageType(bytes)
}
