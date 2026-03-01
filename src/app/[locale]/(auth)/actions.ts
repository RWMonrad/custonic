"use server";

import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialAuthState: AuthState = { status: "idle" };

export async function signInAction(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const validatedFields = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      message: "Invalid email or password",
    };
  }

  const { email, password } = validatedFields.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: "Invalid email or password",
    };
  }

  redirect("/en/dashboard");
}

export async function signUpAction(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const validatedFields = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      message: "Invalid email or password",
    };
  }

  const { email, password } = validatedFields.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  redirect("/en/dashboard");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/en/login");
}
