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

    // Get current subscription
    const { data: subscription, error: subError } = await supabase.rpc("get_current_subscription", {
      p_org_id: orgId,
    });

    if (subError || !subscription?.[0]) {
      return NextResponse.json(
        { error: "Failed to get subscription" },
        { status: 500 }
      );
    }

    const sub = subscription[0];

    // Get usage metrics for current period
    const [analysesResult, contractsResult, costResult] = await Promise.all([
      supabase.rpc("get_current_period_usage", {
        p_org_id: orgId,
        p_event_type: "ANALYSIS_COMPLETED",
      }),
      supabase.rpc("get_current_period_usage", {
        p_org_id: orgId,
        p_event_type: "CONTRACT_UPLOADED",
      }),
      // Get total estimated cost
      supabase
        .from("usage_ledger")
        .select("amount_cents")
        .eq("org_id", orgId)
        .gte("occurred_at", sub.current_period_start)
        .then(({ data }) => ({
          total: data?.reduce((sum, entry) => sum + (entry.amount_cents || 0), 0) || 0
        }))
    ]);

    const usageMetrics = {
      analysesCompleted: analysesResult.data || 0,
      contractsUploaded: contractsResult.data || 0,
      estimatedCostCents: costResult.total,
      remainingAnalyses: Math.max(0, sub.included_analyses - (analysesResult.data || 0)),
    };

    return NextResponse.json(usageMetrics);
  } catch (error) {
    console.error("Billing usage error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 401 }
    );
  }
}
