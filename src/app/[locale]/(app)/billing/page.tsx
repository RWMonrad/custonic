"use client";

import { AppLayout } from "@/shared/ui/AppLayout";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { DataTable } from "@/shared/ui/DataTable";
import { KpiCard } from "@/shared/ui/KpiCard";
import {
    CreditCard,
    DollarSign,
    Download,
    FileText,
    RefreshCw,
    TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface BillingSummary {
  planKey: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  includedAnalyses: number;
  maxFileSizeBytes: number;
}

interface UsageMetrics {
  analysesCompleted: number;
  contractsUploaded: number;
  estimatedCostCents: number;
  remainingAnalyses: number;
}

interface LedgerEntry extends Record<string, unknown> {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  units: number;
  amountCents: number;
  metadata: Record<string, unknown>;
}

export default function BillingPage() {
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(
    null,
  );
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch billing summary
      const summaryResponse = await fetch("/api/billing/summary");
      const summaryData = await summaryResponse.json();
      setBillingSummary(summaryData);

      // Fetch usage metrics
      const usageResponse = await fetch("/api/billing/usage");
      const usageData = await usageResponse.json();
      setUsageMetrics(usageData);

      // Fetch ledger entries
      const ledgerResponse = await fetch("/api/billing/ledger");
      const ledgerData = await ledgerResponse.json();
      setLedgerEntries(ledgerData);

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportCSV = async () => {
    try {
      const response = await fetch("/api/billing/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  const kpiData = [
    {
      title: "Current Plan",
      value: billingSummary?.planKey.toUpperCase() || "FREE",
      icon: TrendingUp,
    },
    {
      title: "Analyses Used",
      value: `${usageMetrics?.analysesCompleted || 0}/${billingSummary?.includedAnalyses || 0}`,
      icon: FileText,
    },
    {
      title: "Contracts Uploaded",
      value: (usageMetrics?.contractsUploaded || 0).toString(),
      icon: FileText,
    },
    {
      title: "Est. Cost",
      value: `$((usageMetrics?.estimatedCostCents || 0) / 100).toFixed(2)`,
      icon: DollarSign,
    },
  ];

  const ledgerColumns = [
    {
      key: "occurredAt" as string,
      title: "Date",
      sortable: true,
      render: (value: unknown) => {
        const dateStr = value as string;
        return new Date(dateStr).toLocaleString();
      },
    },
    {
      key: "eventType" as string,
      title: "Event",
      sortable: true,
      render: (value: unknown) => {
        const eventStr = value as string;
        return (
          <span
            className={`
            inline-block px-2 py-1 text-xs rounded-full
            ${eventStr.includes("UPLOAD") ? "bg-blue/10 text-blue" : ""}
            ${eventStr.includes("ANALYSIS") ? "bg-purple/10 text-purple" : ""}
            ${eventStr.includes("DOWNLOAD") ? "bg-green/10 text-green" : ""}
          `}
          >
            {eventStr.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "entityType" as string,
      title: "Type",
      sortable: true,
    },
    {
      key: "units" as string,
      title: "Units",
      sortable: true,
    },
    {
      key: "amountCents" as string,
      title: "Cost",
      sortable: true,
      render: (value: unknown) => {
        const num = value as number;
        return `$${(num / 100).toFixed(2)}`;
      },
    },
    {
      key: "entityId" as string,
      title: "Entity ID",
      sortable: true,
      render: (value: unknown) => {
        const str = value as string;
        return (
          <span className="font-mono text-xs">{str.substring(0, 8)}...</span>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Billing & Usage
            </h1>
            <p className="text-muted-foreground">
              Monitor your plan usage and billing activity
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Manual Billing Mode Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-md">
              <CreditCard className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Manual Billing Mode
              </span>
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
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Billing Summary */}
          {billingSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-semibold capitalize">
                      {billingSummary.planKey}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">
                      {billingSummary.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-semibold">
                      {new Date(
                        billingSummary.currentPeriodStart,
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        billingSummary.currentPeriodEnd,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Max File Size
                    </p>
                    <p className="font-semibold">
                      {Math.round(
                        billingSummary.maxFileSizeBytes / 1024 / 1024,
                      )}
                      MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi, index) => (
              <KpiCard key={index} {...kpi} />
            ))}
          </div>

          {/* Usage Ledger */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity (Last 50)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={ledgerEntries}
                columns={ledgerColumns}
                searchPlaceholder="Search activity..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
