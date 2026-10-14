/**
 * Vérification des entreprises.
 * Modifier ce fichier suffit pour changer les libellés ou les limites.
 */

export const verificationStatuses = {
  unverified: 'Non vérifiée',
  pending: "En cours d'examen",
  verified: 'Vérifiée',
  rejected: 'Refusée',
  expired: 'À renouveler',
} as const

/**
 * Types de justificatifs. La clé est enregistrée dans media_files.kind.
 */
export const verificationKinds = {
  verif_registration: {
    label: "Justificatif d'existence légale",
    help: "Registre de commerce, numéro d'identification fiscale ou document équivalent de votre pays.",
  },
  verif_address: {
    label: "Justificatif d'adresse",
    help: "Facture récente (eau, électricité, téléphone), contrat de bail ou attestation de domiciliation.",
  },
} as const

export const verificationLimits = {
  maxSize: '4mb',
  maxFilesPerKind: 2,
}

export type VerificationStatus = keyof typeof verificationStatuses
