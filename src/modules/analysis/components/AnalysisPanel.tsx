"use client";

import {
    enqueueAnalysisAction,
    initialEnqueueAnalysisState
} from "@/app/[locale]/(app)/contracts/[contractId]/analysis-actions";
import { ContractList } from "@/modules/contracts/lib/contracts";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AnalysisWithFindings, parseAnalysisMetadata } from "../lib/queries";
import { FindingsFilters } from "./FindingsFilters";
import { FindingsList } from "./FindingsList";
import { FindingsSummary } from "./FindingsSummary";

interface AnalysisPanelProps {
  contract: ContractList;
  analysis: AnalysisWithFindings | null;
}

interface Filters {
  severities: string[];
  riskTypes: string[];
  search: string;
}

export function AnalysisPanel({ contract, analysis }: AnalysisPanelProps) {
  const [filters, setFilters] = useState<Filters>({
    severities: [],
    riskTypes: [],
    search: "",
  });

  const [enqueueState, enqueueFormAction] = useFormState(
    enqueueAnalysisAction,
    initialEnqueueAnalysisState,
  );

  // Handle enqueue success
  if (enqueueState.status === "success") {
    // Force page refresh to show new analysis status
    window.location.reload();
  }

  const getStatusDisplay = () => {
    if (!analysis) {
      return {
        state: "no-analysis",
        title: "No Analysis",
        description:
          "Run an AI analysis to identify potential risks in this contract.",
        showCTA: true,
      };
    }

    switch (analysis.status) {
      case "queued":
        return {
          state: "queued",
          title: "Analysis Queued",
          description:
            "Your analysis is in the queue and will start processing soon.",
          timestamp: analysis.createdAt,
          showCTA: false,
        };

      case "processing":
        return {
          state: "processing",
          title: "Analyzing Contract",
          description:
            "AI is analyzing your contract for potential risks and compliance issues.",
          timestamp: analysis.startedAt,
          showCTA: false,
        };

      case "failed":
        return {
          state: "failed",
          title: "Analysis Failed",
          description:
            analysis.errorMessage || "An error occurred during analysis.",
          timestamp: analysis.finishedAt,
          showCTA: analysis.retryCount < 3,
          retryCount: analysis.retryCount,
        };

      case "completed":
        return {
          state: "completed",
          title: "Analysis Complete",
          description: `Found ${analysis.findings.length} risk findings that may require review.`,
          timestamp: analysis.finishedAt,
          metadata: parseAnalysisMetadata(analysis.results || null),
          showCTA: false,
        };

      default:
        return {
          state: "no-analysis",
          title: "No Analysis",
          description:
            "Run an AI analysis to identify potential risks in this contract.",
          showCTA: true,
        };
    }
  };

  const status = getStatusDisplay();

  // Filter findings based on current filters
  const filteredFindings =
    analysis?.findings.filter((finding) => {
      if (
        filters.severities.length > 0 &&
        !filters.severities.includes(finding.severity)
      ) {
        return false;
      }
      if (
        filters.riskTypes.length > 0 &&
        !filters.riskTypes.includes(finding.category)
      ) {
        return false;
      }
      if (
        filters.search &&
        !finding.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !finding.description
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    }) || [];

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Status Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{status.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{status.description}</p>
            {status.timestamp && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {status.timestamp.toLocaleString()}
              </p>
            )}
          </div>

          {/* Status indicator */}
          <div
            className={`w-3 h-3 rounded-full ${
              status.state === "processing"
                ? "bg-blue-500 animate-pulse"
                : status.state === "completed"
                  ? "bg-green-500"
                  : status.state === "failed"
                    ? "bg-red-500"
                    : status.state === "queued"
                      ? "bg-yellow-500"
                      : "bg-gray-300"
            }`}
          />
        </div>

        {/* Call to Action */}
        {status.showCTA && (
          <div className="mt-4">
            <form action={enqueueFormAction}>
              <input type="hidden" name="contractId" value={contract.id} />
              <input
                type="hidden"
                name="analysisType"
                value="risk_assessment"
              />
              <SubmitButton>Run Analysis</SubmitButton>
            </form>
          </div>
        )}

        {/* Retry button for failed analysis */}
        {status.state === "failed" && status.showCTA && (
          <div className="mt-4">
            <form action={enqueueFormAction}>
              <input type="hidden" name="contractId" value={contract.id} />
              <input
                type="hidden"
                name="analysisType"
                value="risk_assessment"
              />
              <SubmitButton variant="secondary">
                Retry Analysis{" "}
                {status.retryCount && `(Attempt ${status.retryCount + 1}/3)`}
              </SubmitButton>
            </form>
          </div>
        )}

        {/* Error message */}
        {enqueueState.status === "error" && (
          <p className="mt-3 text-sm text-red-600">{enqueueState.message}</p>
        )}
      </div>

      {/* Analysis Metadata */}
      {status.state === "completed" && status.metadata && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Analysis Details</h4>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Provider:</span>{" "}
              {status.metadata.provider || "Unknown"}
            </div>
            <div>
              <span className="font-medium">Model:</span>{" "}
              {status.metadata.model || "Unknown"}
            </div>
            <div>
              <span className="font-medium">Prompt Version:</span>{" "}
              {status.metadata.promptVersion || "Unknown"}
            </div>
            <div>
              <span className="font-medium">Text Length:</span>{" "}
              {status.metadata.charCount?.toLocaleString() || "Unknown"} chars
            </div>
            {status.metadata.truncated && (
              <div className="col-span-2 text-yellow-600">
                ⚠️ Contract was truncated due to size limits
              </div>
            )}
          </div>
        </div>
      )}

      {/* Findings UI */}
      {status.state === "completed" && analysis && (
        <>
          {/* Summary */}
          <FindingsSummary findings={analysis.findings} />

          {/* Filters */}
          <div className="mb-6">
            <FindingsFilters
              filters={filters}
              onFiltersChange={setFilters}
              findings={analysis.findings}
            />
          </div>

          {/* Findings List */}
          <FindingsList findings={filteredFindings} />

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> Automated risk signals generated by
              AI. Review recommended; not legal advice.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  const baseClasses =
    "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary/90 focus:ring-ring",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}
