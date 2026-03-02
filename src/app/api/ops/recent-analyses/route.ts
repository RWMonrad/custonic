import { dbCompat as db } from "@/shared/db";
import { analyses } from "@/shared/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dbInstance = db();
    const recentAnalyses = await dbInstance
      .select({
        id: analyses.id,
        orgId: analyses.org_id,
        status: analyses.status,
        duration: analyses.processing_time_ms,
        provider: analyses.ai_model_version, // Use ai_model_version as provider
        errorMessage: analyses.error_message,
        createdAt: analyses.created_at,
      })
      .from(analyses)
      .orderBy(desc(analyses.created_at))
      .limit(20);

    return NextResponse.json(recentAnalyses);
  } catch (error) {
    console.error("Failed to fetch recent analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent analyses" },
      { status: 500 },
    );
  }
}
