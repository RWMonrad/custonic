"use client";

import { useState } from "react";

interface Citation {
  excerpt: string;
  chunkIndex: number;
  startHint?: string;
  endHint?: string;
}

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  confidenceScore: number;
  recommendation: string;
  citations: Citation[];
  createdAt: Date;
}

interface FindingCardProps {
  finding: Finding;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function FindingCard({
  finding,
  isExpanded,
  onToggleExpanded,
}: FindingCardProps) {
  const [copiedExcerpt, setCopiedExcerpt] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const copyExcerpt = async (excerpt: string, citationIndex: number) => {
    try {
      await navigator.clipboard.writeText(excerpt);
      setCopiedExcerpt(`${finding.id}-${citationIndex}`);
      setTimeout(() => setCopiedExcerpt(null), 2000);
    } catch (err) {
      console.error("Failed to copy excerpt:", err);
    }
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(finding.severity)}`}
              >
                {finding.severity}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {finding.category
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              <span className="text-xs text-gray-400">
                {Math.round(finding.confidenceScore)}% confidence
              </span>
            </div>

            <h5 className="text-sm font-medium text-gray-900 mb-2">
              {finding.title}
            </h5>

            <p className="text-sm text-gray-600 mb-3">{finding.description}</p>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <strong>Recommended:</strong> {finding.recommendation}
              </p>

              {finding.citations.length > 0 && (
                <button
                  onClick={onToggleExpanded}
                  className="text-xs text-primary hover:text-primary/80 underline"
                >
                  {isExpanded ? "Hide" : "Show"} Evidence (
                  {finding.citations.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Accordion */}
      {isExpanded && finding.citations.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4">
            <h6 className="text-xs font-medium text-gray-700 mb-3">
              Evidence & Citations
            </h6>

            <div className="space-y-3">
              {finding.citations.map((citation, index) => (
                <div key={index} className="bg-white border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      Excerpt {index + 1}
                    </span>
                    <button
                      onClick={() => copyExcerpt(citation.excerpt, index)}
                      className="text-xs text-primary hover:text-primary/80 underline"
                    >
                      {copiedExcerpt === `${finding.id}-${index}`
                        ? "Copied!"
                        : "Copy"}
                    </button>
                  </div>

                  <blockquote className="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3 py-1">
                    &ldquo;{citation.excerpt}&rdquo;
                  </blockquote>

                  <div className="mt-2 text-xs text-gray-500">
                    Located in section {citation.chunkIndex + 1} of the contract
                    {citation.startHint && (
                      <span> • Context: {citation.startHint}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> These excerpts are provided as evidence
                for the identified risk. Please review the full contract context
                for complete understanding.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
