"use client";

import {
    InviteForm,
    PendingInvites,
} from "@/modules/invites/components/invite-components";
import { AppLayout } from "@/shared/ui/AppLayout";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { DataTable } from "@/shared/ui/DataTable";
import { KpiCard } from "@/shared/ui/KpiCard";
import { SettingsRow } from "@/shared/ui/SettingsRow";
import { Building, Mail, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrgInvitesAction } from "./invites/actions";

interface User extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  lastActive: string;
  joinedAt: string;
}

export default function OrgPage() {
  const [settings, setSettings] = useState({
    allowInvites: true,
    requireApproval: false,
    defaultRole: "member",
    sessionTimeout: "24h",
    twoFactorAuth: false,
    auditLogging: true,
  });

  const [invites, setInvites] = useState<
    Array<{
      id: string;
      email: string;
      role: string;
      expiresAt: string;
      status: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvites() {
      try {
        const result = await getOrgInvitesAction();
        if (result.success) {
          setInvites(
            result.invites.filter(
              (invite: { status: string }) => invite.status === "pending",
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load invites:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInvites();
  }, []);

  // Mock data
  const kpiData = [
    {
      title: "Total Users",
      value: "24",
      change: { value: 3, type: "increase" as const },
      icon: Users,
    },
    {
      title: "Active Users",
      value: "18",
      change: { value: 2, type: "increase" as const },
      icon: Shield,
    },
    {
      title: "Pending Invites",
      value: invites.length.toString(),
      icon: Mail,
    },
  ];

  const mockUsers: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@company.com",
      role: "owner",
      status: "active",
      lastActive: "2 hours ago",
      joinedAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@company.com",
      role: "admin",
      status: "active",
      lastActive: "1 day ago",
      joinedAt: "2024-01-20",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@company.com",
      role: "member",
      status: "active",
      lastActive: "3 days ago",
      joinedAt: "2024-02-01",
    },
  ];

  const userColumns = [
    {
      key: "name",
      title: "Name",
      render: (value: unknown, row: User) => (
        <div>
          <div className="font-medium">{value as string}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      render: (value: unknown) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value === "owner"
              ? "bg-purple-100 text-purple-800"
              : value === "admin"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value: unknown) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : value === "inactive"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: "lastActive",
      title: "Last Active",
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">{value as string}</span>
      ),
    },
    {
      key: "joinedAt",
      title: "Joined",
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">{value as string}</span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organization</h1>
            <p className="text-gray-600">
              Manage your organization settings and members
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Building className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {kpiData.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Invite Form */}
          <InviteForm />

          {/* Organization Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsRow
                title="Allow Invites"
                description="Enable team members to invite others"
                type="toggle"
                value={settings.allowInvites}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    allowInvites: value as boolean,
                  }))
                }
              />
              <SettingsRow
                title="Require Approval"
                description="New members need admin approval"
                type="toggle"
                value={settings.requireApproval}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    requireApproval: value as boolean,
                  }))
                }
              />
              <SettingsRow
                title="Default Role"
                description="Default role for new members"
                type="input"
                value={settings.defaultRole}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultRole: value as string,
                  }))
                }
              />
              <SettingsRow
                title="Session Timeout"
                description="Automatic logout after inactivity"
                type="input"
                value={settings.sessionTimeout}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    sessionTimeout: value as string,
                  }))
                }
              />
              <SettingsRow
                title="Two-Factor Auth"
                description="Require 2FA for all members"
                type="toggle"
                value={settings.twoFactorAuth}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    twoFactorAuth: value as boolean,
                  }))
                }
              />
              <SettingsRow
                title="Audit Logging"
                description="Log all organization activities"
                type="toggle"
                value={settings.auditLogging}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    auditLogging: value as boolean,
                  }))
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Pending Invites */}
        {!loading && <PendingInvites invites={invites} />}

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={mockUsers} columns={userColumns} searchable />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
