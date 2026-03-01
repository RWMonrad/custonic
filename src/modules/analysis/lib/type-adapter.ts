import "server-only";
import { AnalysisWithFindings as ClientAnalysisWithFindings } from "../types/analysis";
import { AnalysisWithFindings as ServerAnalysisWithFindings } from "./queries";

// Convert server types to client types
export function adaptAnalysisForClient(
  serverAnalysis: ServerAnalysisWithFindings | null,
): ClientAnalysisWithFindings | null {
  if (!serverAnalysis) return null;

  return {
    ...serverAnalysis,
    results:
      typeof serverAnalysis.results === "string"
        ? JSON.parse(serverAnalysis.results)
        : serverAnalysis.results,
    findings: serverAnalysis.findings.map((finding) => ({
      id: finding.id,
      analysisId: serverAnalysis.id, // Use parent analysis ID
      type: finding.category, // Map category -> type
      category: finding.category, // Keep for compatibility
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      recommendation: finding.recommendation || "",
      confidenceScore: finding.confidenceScore,
      citations: finding.citations.map((citation) =>
        typeof citation === "string"
          ? { excerpt: citation, chunkIndex: 0 }
          : citation,
      ),
      createdAt: finding.createdAt,
    })),
  };
}
