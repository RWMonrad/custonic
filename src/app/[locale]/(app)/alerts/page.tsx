"use client";

import { AppLayout } from "@/shared/ui/AppLayout";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { DataTable } from "@/shared/ui/DataTable";
import { RiskBadge } from "@/shared/ui/RiskBadge";
import { AlertTriangle, Clock, ExternalLink, FileText } from "lucide-react";
import { useState } from "react";

interface Alert extends Record<string, unknown> {
  id: string;
  contractId: string;
  contractName: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  createdAt: string;
  status: "new" | "reviewing" | "resolved";
}

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Mock data
  const alerts: Alert[] = [
    {
      id: "1",
      contractId: "contract-1",
      contractName: "Service Agreement - TechCorp",
      type: "Liability Clause",
      severity: "critical",
      description: "Unlimited liability clause detected without caps",
      createdAt: "2 hours ago",
      status: "new",
    },
    {
      id: "2",
      contractId: "contract-2",
      contractName: "NDA Template - LegalDept",
      type: "Termination Notice",
      severity: "high",
      description: "Termination notice period shorter than industry standard",
      createdAt: "4 hours ago",
      status: "reviewing",
    },
    {
      id: "3",
      contractId: "contract-3",
      contractName: "SaaS Contract - CloudSoft",
      type: "Auto-Renewal",
      severity: "medium",
      description:
        "Auto-renewal clause without proper notification requirements",
      createdAt: "1 day ago",
      status: "new",
    },
    {
      id: "4",
      contractId: "contract-4",
      contractName: "Employment Agreement - HR",
      type: "Non-Compete",
      severity: "low",
      description: "Non-compete scope may be overly broad",
      createdAt: "2 days ago",
      status: "resolved",
    },
    {
      id: "5",
      contractId: "contract-5",
      contractName: "Vendor Agreement - SupplyCo",
      type: "Payment Terms",
      severity: "high",
      description: "Payment terms exceed company policy limits",
      createdAt: "3 days ago",
      status: "new",
    },
  ];

  const columns = [
    {
      key: "contractName" as keyof Alert,
      title: "Contract",
      sortable: true,
      render: (value: unknown) => {
        const contractName = value as string;
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contractName}</span>
          </div>
        );
      },
    },
    {
      key: "type" as keyof Alert,
      title: "Alert Type",
      sortable: true,
    },
    {
      key: "severity" as keyof Alert,
      title: "Severity",
      sortable: true,
      render: (value: unknown) => {
        const riskLevel = value as "critical" | "high" | "medium" | "low";
        return <RiskBadge level={riskLevel} />;
      },
    },
    {
      key: "status" as keyof Alert,
      title: "Status",
      sortable: true,
      render: (value: unknown) => {
        const status = value as string;
        return (
          <span
            className={`
            inline-block px-2 py-1 text-xs rounded-full
            ${status === "new" ? "bg-danger/10 text-danger" : ""}
            ${status === "reviewing" ? "bg-warning/10 text-warning" : ""}
            ${status === "resolved" ? "bg-success/10 text-success" : ""}
          `}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "createdAt" as keyof Alert,
      title: "Created",
      sortable: true,
      render: (value: unknown) => {
        const createdAt = value as string;
        return (
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{createdAt}</span>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts Inbox</h1>
          <p className="text-muted-foreground">
            Review and manage contract risk alerts
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Alerts List */}
          <div className="lg:col-span-2">
            <DataTable
              data={alerts}
              columns={columns}
              onRowClick={setSelectedAlert}
              selectedRowId={selectedAlert?.id}
              searchPlaceholder="Search alerts..."
            />
          </div>

          {/* Alert Details Panel */}
          <div className="lg:col-span-1">
            {selectedAlert ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Alert Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Contract
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlert.contractName}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Alert Type
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlert.type}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Severity
                    </h4>
                    <RiskBadge level={selectedAlert.severity} />
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlert.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-1">Status</h4>
                    <span
                      className={`
                      inline-block px-2 py-1 text-xs rounded-full
                      ${selectedAlert.status === "new" ? "bg-danger/10 text-danger" : ""}
                      ${selectedAlert.status === "reviewing" ? "bg-warning/10 text-warning" : ""}
                      ${selectedAlert.status === "resolved" ? "bg-success/10 text-success" : ""}
                    `}
                    >
                      {selectedAlert.status}
                    </span>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button className="w-full">View Contract</Button>
                    <Button variant="outline" className="w-full">
                      Mark as Resolved
                    </Button>
                    <Button variant="ghost" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Alert Selected
                  </h3>
                  <p className="text-muted-foreground">
                    Select an alert from the list to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
