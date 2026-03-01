"use client";

import { useState } from "react";
import { AppLayout } from "@/shared/ui/AppLayout";
import { DataTable } from "@/shared/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { SettingsRow } from "@/shared/ui/SettingsRow";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Users, Building, Mail, Shield, Plus, MoreHorizontal } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  joinedAt: string;
}

export default function OrgPage() {
  const [settings, setSettings] = useState({
    allowInvites: true,
    requireApproval: false,
    defaultRole: 'member',
    sessionTimeout: '24h',
    twoFactorAuth: false,
    auditLogging: true,
  });

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
      value: "3",
      icon: Mail,
    },
    {
      title: "Departments",
      value: "5",
      icon: Building,
    },
  ];

  const users: User[] = [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@company.com",
      role: "Admin",
      status: "active",
      lastActive: "2 hours ago",
      joinedAt: "Jan 15, 2024",
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob@company.com",
      role: "Member",
      status: "active",
      lastActive: "1 day ago",
      joinedAt: "Feb 1, 2024",
    },
    {
      id: "3",
      name: "Carol Davis",
      email: "carol@company.com",
      role: "Member",
      status: "pending",
      lastActive: "Never",
      joinedAt: "Mar 1, 2024",
    },
    {
      id: "4",
      name: "David Wilson",
      email: "david@company.com",
      role: "Viewer",
      status: "inactive",
      lastActive: "1 week ago",
      joinedAt: "Dec 10, 2023",
    },
  ];

  const columns = [
    {
      key: 'name' as keyof User,
      title: 'User',
      sortable: true,
      render: (value: string, row: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            {value.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role' as keyof User,
      title: 'Role',
      sortable: true,
      render: (value: string) => (
        <span className={`
          inline-block px-2 py-1 text-xs rounded-full
          ${value === 'Admin' ? 'bg-danger/10 text-danger' : ''}
          ${value === 'Member' ? 'bg-primary/10 text-primary' : ''}
          ${value === 'Viewer' ? 'bg-muted text-muted-foreground' : ''}
        `}>
          {value}
        </span>
      ),
    },
    {
      key: 'status' as keyof User,
      title: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`
          inline-block px-2 py-1 text-xs rounded-full
          ${value === 'active' ? 'bg-success/10 text-success' : ''}
          ${value === 'pending' ? 'bg-warning/10 text-warning' : ''}
          ${value === 'inactive' ? 'bg-muted text-muted-foreground' : ''}
        `}>
          {value}
        </span>
      ),
    },
    {
      key: 'lastActive' as keyof User,
      title: 'Last Active',
      sortable: true,
    },
    {
      key: 'joinedAt' as keyof User,
      title: 'Joined',
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Organization</h1>
            <p className="text-muted-foreground">
              Manage users, roles, and organization settings
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KpiCard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Users Table */}
          <div className="lg:col-span-2">
            <DataTable
              data={users}
              columns={columns}
              searchPlaceholder="Search users..."
            />
          </div>

          {/* Organization Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingsRow
                  title="Allow Invites"
                  description="Members can invite new users"
                  type="toggle"
                  value={settings.allowInvites}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, allowInvites: value }))}
                />
                <SettingsRow
                  title="Require Approval"
                  description="Admin approval required for new users"
                  type="toggle"
                  value={settings.requireApproval}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, requireApproval: value }))}
                />
                <SettingsRow
                  title="Default Role"
                  description="Default role for new users"
                  type="input"
                  value={settings.defaultRole}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, defaultRole: value }))}
                />
                <SettingsRow
                  title="Session Timeout"
                  description="Automatic logout after inactivity"
                  type="input"
                  value={settings.sessionTimeout}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, sessionTimeout: value }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingsRow
                  title="Two-Factor Auth"
                  description="Require 2FA for all users"
                  type="toggle"
                  value={settings.twoFactorAuth}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, twoFactorAuth: value }))}
                />
                <SettingsRow
                  title="Audit Logging"
                  description="Log all user actions and changes"
                  type="toggle"
                  value={settings.auditLogging}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, auditLogging: value }))}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
