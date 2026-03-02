import "server-only";

import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { db } from "@/shared/db";
import {
    auditLogs,
    orgInvites,
    orgMembers,
    rateLimits,
} from "@/shared/db/schema";
import { INVITE_ACTIONS } from "@/shared/db/schema/invites";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { createHash } from "crypto";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

const INVITE_EXPIRY_HOURS = 72; // 3 days
const RATE_LIMITS = {
  invite: { max: 5, window: 3600 }, // 5 invites per hour per org
  accept: { max: 3, window: 3600 }, // 3 accepts per hour per user
  login: { max: 10, window: 900 }, // 10 logins per 15 min per IP
} as const;

export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIP = headersList.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; resetTime?: Date }> {
  const dbInstance = db();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // Clean old entries
  await dbInstance
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, windowStart));

  // Get current count
  const existing = await dbInstance
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.key, key))
    .limit(1);

  if (existing.length === 0) {
    // First request in window
    await dbInstance.insert(rateLimits).values({
      key,
      windowStart: now,
      count: 1,
    });
    return { allowed: true };
  }

  const current = existing[0];

  // Reset window if expired
  if (current.windowStart < windowStart) {
    await dbInstance
      .update(rateLimits)
      .set({ windowStart: now, count: 1 })
      .where(eq(rateLimits.key, key));
    return { allowed: true };
  }

  // Check limit
  if (current.count >= maxRequests) {
    return {
      allowed: false,
      resetTime: new Date(current.windowStart.getTime() + windowSeconds * 1000),
    };
  }

  // Increment count
  await dbInstance
    .update(rateLimits)
    .set({ count: current.count + 1 })
    .where(eq(rateLimits.key, key));

  return { allowed: true };
}

export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: string,
) {
  const dbInstance = db();
  const user = await getCurrentUser();
  const orgId = await getCurrentOrgIdOrThrow().catch(() => null);
  const ip = await getClientIP();

  await dbInstance.insert(auditLogs).values({
    orgId,
    userId: user?.id,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: ip,
  });
}

async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createInvite({
  orgId,
  actorUserId,
  formData,
}: {
  orgId: string;
  actorUserId: string;
  formData: FormData;
}) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  if (!email || !role) {
    throw new Error("Email and role are required");
  }

  // Check user permissions (owner/admin only)
  const memberCheck = await db()
    .select()
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.org_id, orgId),
        eq(orgMembers.user_id, actorUserId),
        eq(orgMembers.role, "owner"),
      ),
    )
    .limit(1);

  if (memberCheck.length === 0) {
    // Check admin too
    const adminCheck = await db()
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.org_id, orgId),
          eq(orgMembers.user_id, actorUserId),
          eq(orgMembers.role, "admin"),
        ),
      )
      .limit(1);

    if (adminCheck.length === 0) {
      throw new Error("Only owners and admins can create invites");
    }
  }

  // Rate limiting
  const rateLimitKey = `org:${orgId}:invite`;
  const rateLimit = await checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.invite.max,
    RATE_LIMITS.invite.window,
  );

  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Try again later.`);
  }

  // Check for existing pending invite
  const existing = await db()
    .select()
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.orgId, orgId),
        eq(orgInvites.email, email.toLowerCase()),
        eq(orgInvites.status, "pending"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Invite already exists for this email");
  }

  // Generate secure token
  const token = nanoid(32);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  // Create invite
  await db()
    .insert(orgInvites)
    .values({
      orgId,
      email: email.toLowerCase(),
      role: role as "member" | "admin",
      tokenHash,
      expiresAt,
    });

  // Log audit event
  await logAuditEvent(
    INVITE_ACTIONS.CREATED,
    "org_invite",
    undefined,
    `Invite created for ${email} with role ${role}`,
  );

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  return {
    success: true,
    inviteUrl,
    message: "Invite created successfully",
  };
}

export async function revokeInvite({
  orgId,
  actorUserId,
  formData,
}: {
  orgId: string;
  actorUserId: string;
  formData: FormData;
}) {
  const inviteId = formData.get("inviteId") as string;

  if (!inviteId) {
    throw new Error("Invite ID is required");
  }

  // Check permissions and get invite
  const invite = await db()
    .select()
    .from(orgInvites)
    .where(and(eq(orgInvites.id, inviteId), eq(orgInvites.orgId, orgId)))
    .limit(1);

  if (invite.length === 0) {
    throw new Error("Invite not found");
  }

  const memberCheck = await db()
    .select()
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.org_id, orgId),
        eq(orgMembers.user_id, actorUserId),
        eq(orgMembers.role, "owner"),
      ),
    )
    .limit(1);

  if (memberCheck.length === 0) {
    const adminCheck = await db()
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.org_id, orgId),
          eq(orgMembers.user_id, actorUserId),
          eq(orgMembers.role, "admin"),
        ),
      )
      .limit(1);

    if (adminCheck.length === 0) {
      throw new Error("Only owners and admins can revoke invites");
    }
  }

  // Rate limiting
  const rateLimitKey = `org:${orgId}:revoke`;
  const rateLimit = await checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.invite.max,
    RATE_LIMITS.invite.window,
  );

  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Try again later.`);
  }

  // Revoke invite
  await db()
    .update(orgInvites)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(eq(orgInvites.id, inviteId));

  // Log audit event
  await logAuditEvent(
    INVITE_ACTIONS.REVOKED,
    "org_invite",
    inviteId,
    `Invite revoked for ${invite[0].email}`,
  );

  return {
    success: true,
    message: "Invite revoked successfully",
  };
}

export async function acceptInvite({
  token,
  userId,
  userEmail,
}: {
  token: string;
  userId: string;
  userEmail?: string | null;
}) {
  if (!token) {
    throw new Error("Token is required");
  }

  // Rate limiting
  const rateLimitKey = `user:${userId}:accept`;
  const rateLimit = await checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.accept.max,
    RATE_LIMITS.accept.window,
  );

  if (!rateLimit.allowed) {
    throw new Error("Rate limit exceeded. Try again later.");
  }

  // Find invite by token
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const inviteRecord = await db()
    .select()
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.tokenHash, tokenHash),
        eq(orgInvites.status, "pending"),
        gt(orgInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (inviteRecord.length === 0) {
    throw new Error("Invalid or expired invite");
  }

  const inviteData = inviteRecord[0];

  // Add to organization
  await db().insert(orgMembers).values({
    org_id: inviteData.orgId,
    user_id: userId,
    role: inviteData.role,
  });

  // Mark invite as accepted
  await db()
    .update(orgInvites)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
    })
    .where(eq(orgInvites.id, inviteData.id));

  // Log audit event
  await logAuditEvent(
    INVITE_ACTIONS.ACCEPTED,
    "org_invite",
    inviteData.id,
    `Invite accepted by ${userEmail || userId}`,
  );

  return {
    success: true,
    orgId: inviteData.orgId,
    message: "Invite accepted successfully",
  };
}

export async function getOrgInvites({ orgId }: { orgId: string }) {
  const invites = await db()
    .select()
    .from(orgInvites)
    .where(eq(orgInvites.orgId, orgId))
    .orderBy(desc(orgInvites.createdAt));

  return {
    success: true,
    invites,
  };
}
