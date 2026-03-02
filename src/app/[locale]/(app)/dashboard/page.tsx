import { AppLayout } from "@/shared/ui/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { KpiCard } from "@/shared/ui/KpiCard";
import { RiskBadge } from "@/shared/ui/RiskBadge";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  Users,
} from "lucide-react";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function DashboardPage() {
  // Create deterministic PRNG for heatmap
  const prng = mulberry32(42); // Fixed seed for consistent heatmap

  // Mock data
  const kpiData = [
    {
      title: "Total Contracts",
      value: "247",
      change: { value: 12, type: "increase" as const },
      icon: FileText,
    },
    {
      title: "Risk Alerts",
      value: "18",
      change: { value: 8, type: "decrease" as const },
      icon: AlertTriangle,
    },
    {
      title: "Active Vendors",
      value: "43",
      change: { value: 3, type: "increase" as const },
      icon: Users,
    },
    {
      title: "Monthly Savings",
      value: "$12.4k",
      change: { value: 15, type: "increase" as const },
      icon: DollarSign,
    },
  ];

  const recentContracts = [
    {
      id: "1",
      name: "Service Agreement - TechCorp",
      status: "completed",
      riskLevel: "high" as const,
      date: "2024-03-01",
      findings: 5,
    },
    {
      id: "2",
      name: "NDA Template - LegalDept",
      status: "in_progress",
      riskLevel: "critical" as const,
      date: "2024-03-01",
      findings: 8,
    },
    {
      id: "3",
      name: "SaaS Contract - CloudSoft",
      status: "completed",
      riskLevel: "medium" as const,
      date: "2024-02-29",
      findings: 3,
    },
    {
      id: "4",
      name: "Employment Agreement - HR",
      status: "queued",
      riskLevel: "low" as const,
      date: "2024-02-28",
      findings: 0,
    },
  ];

  const upcomingDeadlines = [
    {
      id: "1",
      contract: "TechCorp Service Agreement",
      deadline: "2024-03-15",
      daysLeft: 14,
      type: "renewal",
    },
    {
      id: "2",
      contract: "CloudSoft SaaS License",
      deadline: "2024-03-20",
      daysLeft: 19,
      type: "review",
    },
    {
      id: "3",
      contract: "LegalDept NDA Update",
      deadline: "2024-03-25",
      daysLeft: 24,
      type: "termination",
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your contract analysis and risk management
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KpiCard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Contracts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-background transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {contract.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <RiskBadge level={contract.riskLevel} />
                        <span className="text-xs text-muted-foreground">
                          {contract.findings} findings
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {contract.date}
                      </p>
                      <span
                        className={`
                        inline-block px-2 py-1 text-xs rounded-full mt-1
                        ${contract.status === "completed" ? "bg-success/10 text-success" : ""}
                        ${contract.status === "in_progress" ? "bg-warning/10 text-warning" : ""}
                        ${contract.status === "queued" ? "bg-muted text-muted-foreground" : ""}
                      `}
                      >
                        {contract.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Deadlines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {deadline.contract}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`
                          inline-block px-2 py-1 text-xs rounded-full
                          ${deadline.type === "renewal" ? "bg-primary/10 text-primary" : ""}
                          ${deadline.type === "review" ? "bg-warning/10 text-warning" : ""}
                          ${deadline.type === "termination" ? "bg-danger/10 text-danger" : ""}
                        `}
                        >
                          {deadline.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {deadline.deadline}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`
                        text-sm font-medium
                        ${deadline.daysLeft <= 7 ? "text-danger" : ""}
                        ${deadline.daysLeft > 7 && deadline.daysLeft <= 14 ? "text-warning" : ""}
                        ${deadline.daysLeft > 14 ? "text-success" : ""}
                      `}
                      >
                        {deadline.daysLeft} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Overview Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Risk Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Mock heatmap data */}
              {Array.from({ length: 35 }, (_, i) => {
                const riskLevel = prng();
                let bgColor = "bg-muted";
                if (riskLevel > 0.8) bgColor = "bg-danger";
                else if (riskLevel > 0.6) bgColor = "bg-warning";
                else if (riskLevel > 0.3) bgColor = "bg-accent";

                return (
                  <div
                    key={i}
                    className={`
                      aspect-square rounded-sm ${bgColor}
                      ${riskLevel > 0.6 ? "ring-2 ring-ring" : ""}
                    `}
                    title={`Risk level: ${Math.round(riskLevel * 100)}%`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted rounded-sm" />
                <span>Low Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-sm" />
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning rounded-sm" />
                <span>High Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-danger rounded-sm" />
                <span>Critical Risk</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
