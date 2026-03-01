"use server";

import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100),
});

export type CreateOrgState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialCreateOrgState: CreateOrgState = { status: "idle" };

export async function createOrganizationAction(
  prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const validatedFields = createOrgSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      message: "Invalid organization name",
    };
  }

  const { name } = validatedFields.data;
  const supabase = await createServerSupabaseClient();

  try {
    // Use the secure RPC function instead of direct DB inserts
    const { error } = await supabase.rpc("create_org_and_make_owner", {
      org_name: name,
    });

    if (error) {
      console.error("RPC error:", error);
      return {
        status: "error",
        message: "Failed to create organization. Please try again.",
      };
    }

    redirect("/en/dashboard");
  } catch (error) {
    console.error("Failed to create organization:", error);
    return {
      status: "error",
      message: "Failed to create organization. Please try again.",
    };
  }
}
