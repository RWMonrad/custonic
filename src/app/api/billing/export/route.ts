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

    // Get current subscription for period dates
    const { data: subscription } = await supabase.rpc("get_current_subscription", {
      p_org_id: orgId,
    });

    const periodStart = subscription?.[0]?.current_period_start || new Date().toISOString().split('T')[0];

    // Get all ledger entries for current period
    const { data, error } = await supabase
      .from("usage_ledger")
      .select("*")
      .eq("org_id", orgId)
      .gte("occurred_at", periodStart)
      .order("occurred_at", { ascending: true });

    if (error) {
      console.error("Failed to export ledger:", error);
      return NextResponse.json(
        { error: "Failed to export ledger entries" },
        { status: 500 }
      );
    }

    // Generate CSV
    const headers = [
      'Date',
      'Event Type',
      'Entity Type',
      'Entity ID',
      'Units',
      'Amount (USD)',
      'Metadata'
    ];

    const rows = (data || []).map(entry => [
      new Date(entry.occurred_at).toLocaleString(),
      entry.event_type,
      entry.entity_type,
      entry.entity_id,
      entry.units.toString(),
      (entry.amount_cents / 100).toFixed(2),
      JSON.stringify(entry.metadata).replace(/"/g, '""') // Escape quotes for CSV
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="billing-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Billing export error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 401 }
    );
  }
}
