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

    const { data, error } = await supabase.rpc("get_current_subscription", {
      p_org_id: orgId,
    });

    if (error) {
      console.error("Failed to get billing summary:", error);
      return NextResponse.json(
        { error: "Failed to fetch billing summary" },
        { status: 500 }
      );
    }

    return NextResponse.json(data?.[0] || null);
  } catch (error) {
    console.error("Billing summary error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 401 }
    );
  }
}
