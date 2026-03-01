"use server";

import { db } from "@/shared/db";
import { organizations, orgMembers } from "@/shared/db/schema";
import { getAuthenticatedUser } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100),
});

type CreateOrgState =
  | {
      error?: string;
      fields?: {
        name?: string[];
      };
    }
  | null
  | undefined;

export async function createOrganizationAction(
  prevState: CreateOrgState,
  formData: FormData,
) {
  const validatedFields = createOrgSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid organization name",
      fields: validatedFields.error.flatten().fieldErrors,
    };
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      error: "You must be logged in to create an organization",
    };
  }

  const { name } = validatedFields.data;

  try {
    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      })
      .returning();

    // Add user as owner
    await db.insert(orgMembers).values({
      org_id: org.id,
      user_id: user.id,
      role: "owner",
    });

    redirect("/en/dashboard");
  } catch (error) {
    console.error("Failed to create organization:", error);
    return {
      error: "Failed to create organization. Please try again.",
    };
  }
}
