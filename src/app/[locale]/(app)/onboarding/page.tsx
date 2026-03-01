"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createOrganizationAction, initialCreateOrgState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Creating organization..." : "Create organization"}
    </button>
  );
}

export default function OnboardingPage() {
  const [state, formAction] = useFormState(
    createOrganizationAction,
    initialCreateOrgState,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Create your organization
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Get started by creating your first organization
          </p>
        </div>

        {state?.status === "error" && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
            {state.message}
          </div>
        )}

        <form action={formAction} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Organization name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
