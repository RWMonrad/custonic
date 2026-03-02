"use server";

import { createInvite, revokeInvite, acceptInvite, getOrgInvites as getInvites } from "@/modules/invites/server/invite-service";
import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export async function createInviteAction(formData: FormData) {
  const orgId = await getCurrentOrgIdOrThrow();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }

  return await createInvite({ orgId, actorUserId: user.id, formData });
}

export async function revokeInviteAction(formData: FormData) {
  const orgId = await getCurrentOrgIdOrThrow();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }

  return await revokeInvite({ orgId, actorUserId: user.id, formData });
}

export async function acceptInviteAction(token: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }

  return await acceptInvite({ token, userId: user.id, userEmail: user.email });
}

export async function getOrgInvitesAction() {
  const orgId = await getCurrentOrgIdOrThrow();
  return await getInvites({ orgId });
}
