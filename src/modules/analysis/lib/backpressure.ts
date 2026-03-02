import { dbCompat as db } from "@/shared/db";
import { analyses } from "@/shared/db/schema";
import { and, eq } from "drizzle-orm";

const MAX_QUEUE_DEPTH = parseInt(process.env.MAX_QUEUE_DEPTH || "200");
const MAX_QUEUE_AGE_MINUTES = parseInt(
  process.env.MAX_QUEUE_AGE_MINUTES || "60",
);

interface BackpressureResult {
  allowed: boolean;
  queueDepth: number;
  oldestAgeMinutes: number;
  message: string;
}

export async function checkBackpressure(
  orgId?: string,
): Promise<BackpressureResult> {
  try {
    // Count queued analyses
    let queueDepth = 0;
    if (orgId) {
      const queueResult = await db
        .select({ count: analyses.id })
        .from(analyses)
        .where(and(eq(analyses.status, "queued"), eq(analyses.org_id, orgId)));
      queueDepth = queueResult.length;
    } else {
      const queueResult = await db
        .select({ count: analyses.id })
        .from(analyses)
        .where(eq(analyses.status, "queued"));
      queueDepth = queueResult.length;
    }

    // Find oldest queued analysis
    let oldestAge = 0;
    if (orgId) {
      const oldestResult = await db
        .select({ createdAt: analyses.created_at })
        .from(analyses)
        .where(and(eq(analyses.status, "queued"), eq(analyses.org_id, orgId)))
        .orderBy(analyses.created_at)
        .limit(1);

      if (oldestResult.length > 0 && oldestResult[0]?.createdAt) {
        oldestAge = Math.floor(
          (Date.now() - oldestResult[0].createdAt.getTime()) / (1000 * 60),
        );
      }
    } else {
      const oldestResult = await db
        .select({ createdAt: analyses.created_at })
        .from(analyses)
        .where(eq(analyses.status, "queued"))
        .orderBy(analyses.created_at)
        .limit(1);

      if (oldestResult.length > 0 && oldestResult[0]?.createdAt) {
        oldestAge = Math.floor(
          (Date.now() - oldestResult[0].createdAt.getTime()) / (1000 * 60),
        );
      }
    }

    // Check thresholds
    const depthExceeded = queueDepth >= MAX_QUEUE_DEPTH;
    const ageExceeded = oldestAge >= MAX_QUEUE_AGE_MINUTES;

    const allowed = !depthExceeded && !ageExceeded;

    let message = "Queue capacity available";
    if (depthExceeded) {
      message = `Queue depth exceeded (${queueDepth}/${MAX_QUEUE_DEPTH}). Please try later.`;
    } else if (ageExceeded) {
      message = `Queue age exceeded (${oldestAge}/${MAX_QUEUE_AGE_MINUTES} minutes). Please try later.`;
    }

    return {
      allowed,
      queueDepth,
      oldestAgeMinutes: oldestAge,
      message,
    };
  } catch (error) {
    console.error("Backpressure check failed:", error);
    // Fail open - allow if check fails
    return {
      allowed: true,
      queueDepth: 0,
      oldestAgeMinutes: 0,
      message: "Backpressure check failed - allowing request",
    };
  }
}

export function logQueueHealth() {
  console.log(
    `Queue health check - Max depth: ${MAX_QUEUE_DEPTH}, Max age: ${MAX_QUEUE_AGE_MINUTES}min`,
  );
}
