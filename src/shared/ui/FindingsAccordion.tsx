"use client";

import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "./Card";
import { RiskBadge } from "./RiskBadge";

interface Finding {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  confidenceScore: number;
  citations: Array<{
    excerpt: string;
    chunkIndex: number;
  }>;
}

interface FindingsAccordionProps {
  findings: Finding[];
}

export function FindingsAccordion({ findings }: FindingsAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const groupedFindings = findings.reduce(
    (acc, finding) => {
      if (!acc[finding.severity]) {
        acc[finding.severity] = [];
      }
      acc[finding.severity].push(finding);
      return acc;
    },
    {} as Record<string, Finding[]>,
  );

  const severityOrder = ["critical", "high", "medium", "low"];

  return (
    <div className="space-y-4">
      {severityOrder.map((severity) => {
        const severityFindings = groupedFindings[severity] || [];
        if (severityFindings.length === 0) return null;

        return (
          <Card key={severity}>
            <CardContent className="p-0">
              <div className="flex items-center space-x-2 p-4 border-b border-border">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold capitalize">{severity} Risk</h3>
                <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                  {severityFindings.length}
                </span>
              </div>

              <div className="divide-y divide-border">
                {severityFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="border-l-4 border-l-transparent hover:border-l-primary transition-colors"
                  >
                    <button
                      onClick={() => toggleItem(finding.id)}
                      className="w-full text-left p-4 hover:bg-background transition-colors focus:outline-none focus:bg-background"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            {expandedItems.has(finding.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <RiskBadge
                              level={
                                finding.severity as
                                  | "critical"
                                  | "high"
                                  | "medium"
                                  | "low"
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(finding.confidenceScore * 100)}%
                              confidence
                            </span>
                          </div>
                          <h4 className="font-medium text-foreground mb-1">
                            {finding.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {finding.description}
                          </p>
                        </div>
                      </div>
                    </button>

                    {expandedItems.has(finding.id) && (
                      <div className="px-4 pb-4 bg-background/50">
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-foreground mb-2">
                              Description
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {finding.description}
                            </p>
                          </div>

                          <div>
                            <h5 className="font-medium text-foreground mb-2">
                              Recommendation
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {finding.recommendation}
                            </p>
                          </div>

                          {finding.citations.length > 0 && (
                            <div>
                              <h5 className="font-medium text-foreground mb-2">
                                Evidence
                              </h5>
                              <div className="space-y-2">
                                {finding.citations.map((citation, index) => (
                                  <div
                                    key={index}
                                    className="text-sm text-muted-foreground bg-muted p-3 rounded-md"
                                  >
                                    &quot;{citation.excerpt}&quot;
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
