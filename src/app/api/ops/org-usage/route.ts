import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: orgUsage, error } = await supabase
      .from("org_usage_daily")
      .select("org_id, day, analyses_requested")
      .eq("day", today)
      .order("analyses_requested", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Failed to fetch org usage:", error);
      return NextResponse.json(
        { error: "Failed to fetch org usage" },
        { status: 500 },
      );
    }

    // Transform snake_case to camelCase for frontend
    const transformedUsage =
      orgUsage?.map((item, index) => ({
        id: `${item.org_id}-${index}`, // Generate unique ID for DataTable
        orgId: item.org_id,
        day: item.day,
        analysesRequested: item.analyses_requested,
      })) || [];

    return NextResponse.json(transformedUsage);
  } catch (error) {
    console.error("Failed to fetch org usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch org usage" },
      { status: 500 },
    );
  }
}
