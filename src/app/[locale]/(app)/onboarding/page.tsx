"use client";

import { useFormState } from "react-dom";
import { createOrganizationAction } from "./actions";

export default function OnboardingPage() {
  const [state, formAction] = useFormState(createOrganizationAction, null);

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

        {state?.error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
            {state.error}
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
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              Create organization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
