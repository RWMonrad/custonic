"use client";

interface Finding {
  severity: string;
  category: string;
}

interface Filters {
  severities: string[];
  riskTypes: string[];
  search: string;
}

interface FindingsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  findings: Finding[];
}

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "text-red-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "low", label: "Low", color: "text-blue-600" },
];

export function FindingsFilters({
  filters,
  onFiltersChange,
  findings,
}: FindingsFiltersProps) {
  // Get unique risk types from findings
  const riskTypes = Array.from(new Set(findings.map((f) => f.category))).sort();

  const handleSeverityToggle = (severity: string) => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter((s) => s !== severity)
      : [...filters.severities, severity];

    onFiltersChange({ ...filters, severities: newSeverities });
  };

  const handleRiskTypeChange = (riskType: string) => {
    onFiltersChange({ ...filters, riskTypes: riskType ? [riskType] : [] });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const clearAllFilters = () => {
    onFiltersChange({ severities: [], riskTypes: [], search: "" });
  };

  const hasActiveFilters =
    filters.severities.length > 0 ||
    filters.riskTypes.length > 0 ||
    filters.search.length > 0;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Filters</h4>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Severity Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Severity
          </label>
          <div className="space-y-1">
            {SEVERITY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.severities.includes(option.value)}
                  onChange={() => handleSeverityToggle(option.value)}
                  className="mr-2 h-3 w-3 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className={`text-xs ${option.color}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Risk Type Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Risk Type
          </label>
          <select
            value={filters.riskTypes[0] || ""}
            onChange={(e) => handleRiskTypeChange(e.target.value)}
            className="w-full text-xs border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">All types</option>
            {riskTypes.map((type) => (
              <option key={type} value={type}>
                {type
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search findings..."
            className="w-full text-xs border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.severities.map((severity) => (
              <span
                key={severity}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
              >
                {severity}
                <button
                  onClick={() => handleSeverityToggle(severity)}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.riskTypes.map((riskType) => (
              <span
                key={riskType}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
              >
                {riskType
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                <button
                  onClick={() => handleRiskTypeChange("")}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                "{filters.search}"
                <button
                  onClick={() => handleSearchChange("")}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
