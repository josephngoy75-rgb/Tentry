import CompanyProfile from '#models/company_profile'
import CompanyVerification from '#models/company_verification'
import User from '#models/user'
import { identityKey, isVerificationCurrent } from '#services/company_identity'

/**
 * Parmi ces entreprises, lesquelles ont une vérification approuvée ET encore valable
 * (nom et adresse inchangés depuis l'approbation) ? Trois requêtes pour toute la liste.
 */
export async function verifiedCompanyIds(userIds: number[]): Promise<Set<number>> {
  const ids = [...new Set(userIds)]
  const result = new Set<number>()
  if (ids.length === 0) return result

  const verifications = await CompanyVerification.query()
    .whereIn('user_id', ids)
    .where('status', 'verified')
  if (verifications.length === 0) return result

  const verifiedIds = verifications.map((item) => item.userId)
  const users = await User.query().whereIn('id', verifiedIds)
  const profiles = await CompanyProfile.query().whereIn('user_id', verifiedIds)

  const userById = new Map(users.map((user) => [user.id, user]))
  const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]))

  for (const verification of verifications) {
    const user = userById.get(verification.userId)
    if (!user) continue

    const profile = profileByUser.get(verification.userId)
    const current = identityKey(
      user.companyName,
      profile?.addressLine,
      profile?.city,
      profile?.country
    )

    if (isVerificationCurrent(verification.status, verification.verifiedIdentity, current)) {
      result.add(verification.userId)
    }
  }

  return result
}

export async function isCompanyVerified(userId: number): Promise<boolean> {
  return (await verifiedCompanyIds([userId])).has(userId)
}
