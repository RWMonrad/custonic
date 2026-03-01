import { getUserOrgId } from "@/shared/lib/org";
import { getAuthenticatedUser } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/en/login");
  }

  const orgId = await getUserOrgId(user.id);

  if (!orgId) {
    redirect("/en/onboarding");
  }

  return <>{children}</>;
}
