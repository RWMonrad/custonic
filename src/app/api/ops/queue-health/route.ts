import { dbCompat as db } from "@/shared/db";
import { analyses } from "@/shared/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dbInstance = db();

    // Count queued analyses
    const queueResult = await dbInstance
      .select({ count: analyses.id })
      .from(analyses)
      .where(eq(analyses.status, "queued"));

    const queueDepth = queueResult.length;

    // Find oldest queued analysis
    const oldestResult = await dbInstance
      .select({ createdAt: analyses.created_at })
      .from(analyses)
      .where(eq(analyses.status, "queued"))
      .orderBy(analyses.created_at)
      .limit(1);

    const oldestAge =
      oldestResult.length > 0 && oldestResult[0]?.createdAt
        ? Math.floor(
            (Date.now() - oldestResult[0].createdAt.getTime()) / (1000 * 60),
          )
        : 0;

    return NextResponse.json({
      depth: queueDepth,
      oldestAgeMinutes: oldestAge,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Queue health check failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue health" },
      { status: 500 },
    );
  }
}
