import { db } from '@/shared/db'
import { orgMembers, organizations } from '@/shared/db/schema'
import { eq } from 'drizzle-orm'

export async function getUserOrgId(userId: string): Promise<string | null> {
  const result = await db
    .select({ orgId: orgMembers.org_id })
    .from(orgMembers)
    .where(eq(orgMembers.user_id, userId))
    .limit(1)

  return result[0]?.orgId || null
}

export async function getUserOrg(userId: string) {
  const result = await db
    .select({
      org: organizations,
      membership: orgMembers,
    })
    .from(orgMembers)
    .innerJoin(organizations, eq(orgMembers.org_id, organizations.id))
    .where(eq(orgMembers.user_id, userId))
    .limit(1)

  return result[0] || null
}
