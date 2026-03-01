import { signOutAction } from "@/app/[locale]/(auth)/actions";
import { getUserOrg } from "@/shared/lib/org";
import { getAuthenticatedUser } from "@/shared/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const userOrg = await getUserOrg(user?.id || "");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your contracts and track performance
            </p>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Contracts
            </h3>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Contracts
            </h3>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Risk Alerts
            </h3>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Value
            </h3>
            <p className="text-2xl font-bold text-foreground">$0</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Account Information
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Email:{" "}
              </span>
              <span className="text-sm text-foreground">{user?.email}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Organization:{" "}
              </span>
              <span className="text-sm text-foreground">
                {userOrg?.org?.name || "Not set"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Role:{" "}
              </span>
              <span className="text-sm text-foreground capitalize">
                {userOrg?.membership?.role || "Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border mt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Recent Contracts
          </h2>
          <div className="text-center py-8 text-muted-foreground">
            No contracts yet. Upload your first contract to get started.
          </div>
        </div>
      </div>
    </div>
  );
}
