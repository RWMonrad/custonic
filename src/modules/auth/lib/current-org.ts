import { getAuthenticatedUser } from '@/shared/lib/supabase/server'
import { getUserOrgId } from '@/shared/lib/org'

export async function getCurrentOrgIdOrThrow(): Promise<string> {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const orgId = await getUserOrgId(user.id)
  
  if (!orgId) {
    throw new Error('User is not a member of any organization')
  }

  return orgId
}

export async function getCurrentOrgId(): Promise<string | null> {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    return null
  }

  return getUserOrgId(user.id)
}
