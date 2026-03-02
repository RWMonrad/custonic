import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";

export async function GET() {
  try {
    const orgId = await getCurrentOrgIdOrThrow();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("usage_ledger")
      .select("*")
      .eq("org_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch ledger:", error);
      return NextResponse.json(
        { error: "Failed to fetch ledger entries" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Billing ledger error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 401 }
    );
  }
}
