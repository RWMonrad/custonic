// Client-safe types only - no DB imports
export interface Analysis {
  id: string;
  orgId: string;
  contractId: string;
  type: string;
  status: string;
  confidenceScore?: number;
  processingTimeMs?: number;
  errorMessage?: string;
  retryCount: number;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  results?: Record<string, unknown>;
}

export interface Finding {
  id: string;
  analysisId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  confidenceScore: number;
  citations: Array<{
    excerpt: string;
    chunkIndex: number;
    startHint?: string;
    endHint?: string;
  }>;
  createdAt: Date;
  // Legacy compatibility for child components
  category: string;
}

export interface AnalysisWithFindings extends Analysis {
  findings: Finding[];
}

// Client-safe metadata parser
export function parseAnalysisMetadata(results: Record<string, unknown> | null) {
  if (!results) return null;

  try {
    return typeof results === "string" ? JSON.parse(results) : results;
  } catch {
    return null;
  }
}
