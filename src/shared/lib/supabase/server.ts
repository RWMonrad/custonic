import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabase = createServerComponentClient({ 
    cookies,
    options: {
      db: { schema: 'public' }
    }
  })

  return supabase
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}
