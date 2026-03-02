interface AnalysisLogEntry {
  analysisId: string;
  orgId: string;
  provider: string;
  duration: number;
  chunkCount: number;
  truncated: boolean;
  status: string;
  errorMessage?: string;
  tokensIn?: number;
  tokensOut?: number;
}

export class AnalysisLogger {
  static log(entry: AnalysisLogEntry) {
    // Safe logging - never include full contract text
    const logData = {
      analysisId: entry.analysisId,
      orgId: entry.orgId,
      provider: entry.provider,
      duration: entry.duration,
      chunkCount: entry.chunkCount,
      truncated: entry.truncated,
      status: entry.status,
      errorMessage: entry.errorMessage,
      tokensIn: entry.tokensIn,
      tokensOut: entry.tokensOut,
      timestamp: new Date().toISOString(),
    };

    if (entry.status === "error") {
      console.error("Analysis failed:", logData);
    } else {
      console.log("Analysis completed:", logData);
    }
  }

  static logQueueHealth(depth: number, oldestAgeMinutes: number) {
    console.log("Queue health:", {
      depth,
      oldestAgeMinutes,
      timestamp: new Date().toISOString(),
    });
  }

  static logWorkerCycle(processed: number, errors: number) {
    console.log("Worker cycle:", {
      processed,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper to safely extract citations without full text
  static extractCitations(
    findings: unknown[],
  ): Array<{ excerpt: string; chunkIndex: number }> {
    return findings
      .map((finding) => {
        const findingWithCitations = finding as { citations?: unknown[] };
        const citations = Array.isArray(findingWithCitations.citations)
          ? findingWithCitations.citations
          : [];

        return citations.map((citation) => {
          const citationObj = citation as {
            excerpt?: string;
            chunkIndex?: number;
          };
          return {
            excerpt: citationObj.excerpt?.substring(0, 200) || "", // Limit excerpt length
            chunkIndex: citationObj.chunkIndex || 0,
          };
        });
      })
      .flat();
  }
}

// Safe logging middleware for analyses
export function withSafeLogging<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      console.log(`${operation} completed`, {
        duration,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`${operation} failed`, {
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  };
}
