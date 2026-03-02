"use client";

import { AppLayout } from "@/shared/ui/AppLayout";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { DataTable } from "@/shared/ui/DataTable";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Activity, AlertTriangle, Clock, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface QueueHealth {
  depth: number;
  oldestAgeMinutes: number;
}

interface AnalysisRecord extends Record<string, unknown> {
  id: string;
  orgId: string;
  status: string;
  duration: number;
  provider: string;
  errorMessage?: string;
  truncated: boolean;
  createdAt: string;
}

interface OrgUsage extends Record<string, unknown> {
  id: string; // Required for DataTable
  orgId: string;
  day: string;
  analysesRequested: number;
}

export default function OpsPage() {
  const [queueHealth, setQueueHealth] = useState<QueueHealth>({
    depth: 0,
    oldestAgeMinutes: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRecord[]>([]);
  const [orgUsage, setOrgUsage] = useState<OrgUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch queue health
      const healthResponse = await fetch("/api/ops/queue-health");
      const healthData = await healthResponse.json();
      setQueueHealth(healthData);

      // Fetch recent analyses
      const analysesResponse = await fetch("/api/ops/recent-analyses");
      const analysesData = await analysesResponse.json();
      setRecentAnalyses(analysesData);

      // Fetch org usage
      const usageResponse = await fetch("/api/ops/org-usage");
      const usageData = await usageResponse.json();
      setOrgUsage(usageData);

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch ops data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const kpiData = [
    {
      title: "Queue Depth",
      value: queueHealth.depth.toString(),
      icon: Activity,
    },
    {
      title: "Oldest Queue Age",
      value: `${queueHealth.oldestAgeMinutes}m`,
      icon: Clock,
    },
    {
      title: "Recent Analyses",
      value: recentAnalyses.length.toString(),
      icon: AlertTriangle,
    },
    {
      title: "Active Orgs",
      value: orgUsage.length.toString(),
      icon: Users,
    },
  ];

  const analysisColumns = [
    {
      key: "id" as keyof AnalysisRecord,
      title: "Analysis ID",
      sortable: true,
      render: (value: unknown) => {
        const id = value as string;
        return (
          <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
        );
      },
    },
    {
      key: "status" as keyof AnalysisRecord,
      title: "Status",
      sortable: true,
      render: (value: unknown) => {
        const status = value as string;
        return (
          <span
            className={`
            inline-block px-2 py-1 text-xs rounded-full
            ${status === "completed" ? "bg-success/10 text-success" : ""}
            ${status === "failed" ? "bg-danger/10 text-danger" : ""}
            ${status === "queued" ? "bg-warning/10 text-warning" : ""}
            ${status === "processing" ? "bg-primary/10 text-primary" : ""}
          `}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "duration" as keyof AnalysisRecord,
      title: "Duration",
      sortable: true,
      render: (value: unknown) => {
        const duration = value as number;
        return `${duration}s`;
      },
    },
    {
      key: "provider" as keyof AnalysisRecord,
      title: "Provider",
      sortable: true,
    },
    {
      key: "truncated" as keyof AnalysisRecord,
      title: "Truncated",
      sortable: true,
      render: (value: unknown) => {
        const isTruncated = value as boolean;
        return (
          <span
            className={`
            inline-block px-2 py-1 text-xs rounded-full
            ${isTruncated ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}
          `}
          >
            {isTruncated ? "Yes" : "No"}
          </span>
        );
      },
    },
    {
      key: "createdAt" as keyof AnalysisRecord,
      title: "Created",
      sortable: true,
      render: (value: unknown) => {
        const dateStr = value as string;
        return new Date(dateStr).toLocaleString();
      },
    },
  ];

  const usageColumns = [
    {
      key: "orgId" as string,
      title: "Organization",
      sortable: true,
      render: (value: unknown) => {
        const orgId = value as string;
        return (
          <span className="font-mono text-xs">{orgId.substring(0, 8)}...</span>
        );
      },
    },
    {
      key: "day" as string,
      title: "Date",
      sortable: true,
    },
    {
      key: "analysesRequested" as string,
      title: "Analyses Requested",
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Operations Dashboard
            </h1>
            <p className="text-muted-foreground">
              System health and usage monitoring
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KpiCard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Analyses (Last 20)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentAnalyses}
                columns={analysisColumns}
                searchPlaceholder="Search analyses..."
              />
            </CardContent>
          </Card>

          {/* Organization Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage (Top 10 Orgs)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={orgUsage}
                columns={usageColumns}
                searchPlaceholder="Search organizations..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
