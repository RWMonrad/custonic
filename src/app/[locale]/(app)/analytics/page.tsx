"use client";

import { AppLayout } from "@/shared/ui/AppLayout";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { DataTable } from "@/shared/ui/DataTable";
import { KpiCard } from "@/shared/ui/KpiCard";
import {
  Calendar,
  DollarSign,
  Download,
  FileText,
  Filter,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";

interface SavingsData extends Record<string, unknown> {
  id: string;
  category: string;
  description: string;
  identifiedSavings: string;
  realizedSavings: string;
  status: "identified" | "in_progress" | "realized";
  dateIdentified: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data
  const kpiData = [
    {
      title: "Total Savings",
      value: "$124,500",
      change: { value: 18, type: "increase" as const },
      icon: DollarSign,
    },
    {
      title: "Risk Reduction",
      value: "32%",
      change: { value: 8, type: "increase" as const },
      icon: TrendingDown,
    },
    {
      title: "Contracts Analyzed",
      value: "1,247",
      change: { value: 156, type: "increase" as const },
      icon: FileText,
    },
    {
      title: "Avg. Processing Time",
      value: "2.4h",
      change: { value: 25, type: "decrease" as const },
      icon: Calendar,
    },
  ];

  const savingsData: SavingsData[] = [
    {
      id: "1",
      category: "Negotiation",
      description: "SaaS contract renewal - Better terms secured",
      identifiedSavings: "$45,000",
      realizedSavings: "$42,000",
      status: "realized",
      dateIdentified: "2024-02-15",
    },
    {
      id: "2",
      category: "Termination",
      description: "Unused software licenses identified and cancelled",
      identifiedSavings: "$28,000",
      realizedSavings: "$28,000",
      status: "realized",
      dateIdentified: "2024-02-10",
    },
    {
      id: "3",
      category: "Renegotiation",
      description: "Logistics contract terms optimization",
      identifiedSavings: "$67,000",
      realizedSavings: "$0",
      status: "in_progress",
      dateIdentified: "2024-02-08",
    },
    {
      id: "4",
      category: "Compliance",
      description: "Penalty avoidance through early renewal",
      identifiedSavings: "$15,000",
      realizedSavings: "$15,000",
      status: "realized",
      dateIdentified: "2024-02-05",
    },
    {
      id: "5",
      category: "Optimization",
      description: "Cloud services cost optimization",
      identifiedSavings: "$32,000",
      realizedSavings: "$0",
      status: "identified",
      dateIdentified: "2024-02-01",
    },
  ];

  const columns = [
    {
      key: "category" as keyof SavingsData,
      title: "Category",
      sortable: true,
      render: (value: unknown) => {
        const category = value as string;
        return (
          <span
            className={`
            inline-block px-2 py-1 text-xs rounded-full
            ${category === "Negotiation" ? "bg-primary/10 text-primary" : ""}
            ${category === "Termination" ? "bg-success/10 text-success" : ""}
            ${category === "Renegotiation" ? "bg-warning/10 text-warning" : ""}
            ${category === "Compliance" ? "bg-info/10 text-info" : ""}
            ${category === "Optimization" ? "bg-muted text-muted-foreground" : ""}
          `}
          >
            {category}
          </span>
        );
      },
    },
    {
      key: "description" as keyof SavingsData,
      title: "Description",
      sortable: true,
    },
    {
      key: "identifiedSavings" as keyof SavingsData,
      title: "Identified",
      sortable: true,
      render: (value: unknown) => {
        const savings = value as string;
        return <span className="font-medium text-foreground">{savings}</span>;
      },
    },
    {
      key: "realizedSavings" as keyof SavingsData,
      title: "Realized",
      sortable: true,
      render: (value: unknown, row: SavingsData) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-foreground">{value as string}</span>
          {row.status === "realized" &&
            row.realizedSavings !== row.identifiedSavings && (
              <span className="text-xs text-muted-foreground">
                (
                {Math.round(
                  (parseFloat(row.realizedSavings.replace(/[$,]/g, "")) /
                    parseFloat(row.identifiedSavings.replace(/[$,]/g, ""))) *
                    100,
                )}
                %)
              </span>
            )}
        </div>
      ),
    },
    {
      key: "status" as keyof SavingsData,
      title: "Status",
      sortable: true,
      render: (value: unknown) => {
        const status = value as string;
        return (
          <span
            className={`
            inline-block px-2 py-1 text-xs rounded-full
            ${status === "realized" ? "bg-success/10 text-success" : ""}
            ${status === "in_progress" ? "bg-warning/10 text-warning" : ""}
            ${status === "identified" ? "bg-muted text-muted-foreground" : ""}
          `}
          >
            {status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "dateIdentified" as keyof SavingsData,
      title: "Date Identified",
      sortable: true,
    },
  ];

  const totalIdentified = savingsData.reduce(
    (sum, item) =>
      sum + parseFloat(item.identifiedSavings.replace(/[$,]/g, "")),
    0,
  );
  const totalRealized = savingsData.reduce(
    (sum, item) => sum + parseFloat(item.realizedSavings.replace(/[$,]/g, "")),
    0,
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Savings & Analytics
            </h1>
            <p className="text-muted-foreground">
              Track cost savings and contract analytics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KpiCard key={index} {...kpi} />
          ))}
        </div>

        {/* Savings Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Savings Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Identified
                    </span>
                    <span className="font-medium text-foreground">
                      ${totalIdentified.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Realized
                    </span>
                    <span className="font-medium text-success">
                      ${totalRealized.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Realization Rate
                    </span>
                    <span className="font-medium text-foreground">
                      {Math.round((totalRealized / totalIdentified) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Savings by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Negotiation",
                  "Termination",
                  "Renegotiation",
                  "Compliance",
                  "Optimization",
                ].map((category) => {
                  const categorySavings = savingsData.filter(
                    (s) => s.category === category,
                  );
                  const total = categorySavings.reduce(
                    (sum, s) =>
                      sum + parseFloat(s.realizedSavings.replace(/[$,]/g, "")),
                    0,
                  );

                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-foreground">
                        {category}
                      </span>
                      <span className="font-medium text-foreground">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Realization Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    status: "realized",
                    label: "Realized",
                    color: "text-success",
                  },
                  {
                    status: "in_progress",
                    label: "In Progress",
                    color: "text-warning",
                  },
                  {
                    status: "identified",
                    label: "Identified",
                    color: "text-muted-foreground",
                  },
                ].map(({ status, label, color }) => {
                  const count = savingsData.filter(
                    (s) => s.status === status,
                  ).length;
                  const percentage = Math.round(
                    (count / savingsData.length) * 100,
                  );

                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-foreground">{label}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${color}`}>{count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Savings Table */}
        <DataTable
          data={savingsData}
          columns={columns}
          searchPlaceholder="Search savings opportunities..."
        />
      </div>
    </AppLayout>
  );
}
