"use client";

interface Finding {
  severity: string;
  title: string;
  confidenceScore: number;
}

interface FindingsSummaryProps {
  findings: Finding[];
}

export function FindingsSummary({ findings }: FindingsSummaryProps) {
  // Count findings by severity
  const severityCounts = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalFindings = findings.length;
  const criticalCount = severityCounts.critical || 0;
  const highCount = severityCounts.high || 0;

  // Get top 3 critical/high findings
  const topCriticalFindings = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 3);

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

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium mb-3">Risk Summary</h4>

      {/* Severity Counts */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-xs text-gray-600">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{highCount}</div>
          <div className="text-xs text-gray-600">High</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {severityCounts.medium || 0}
          </div>
          <div className="text-xs text-gray-600">Medium</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {severityCounts.low || 0}
          </div>
          <div className="text-xs text-gray-600">Low</div>
        </div>
      </div>

      {/* Top Critical/High Findings */}
      {topCriticalFindings.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Top Priority Issues
          </h5>
          <div className="space-y-2">
            {topCriticalFindings.map((finding, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white rounded border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {finding.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence: {Math.round(finding.confidenceScore)}%
                  </p>
                </div>
                <div className="ml-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(finding.severity)}`}
                  >
                    {finding.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>{totalFindings}</strong> total risk findings identified.
          {criticalCount > 0 &&
            ` ${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} require immediate attention.`}
          {criticalCount === 0 &&
            highCount > 0 &&
            ` ${highCount} high-risk issue${highCount > 1 ? "s" : ""} should be reviewed soon.`}
          {criticalCount === 0 &&
            highCount === 0 &&
            totalFindings > 0 &&
            " All findings are low to medium risk."}
        </p>
      </div>
    </div>
  );
}
