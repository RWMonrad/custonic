"use client";

import { useState } from "react";
import { AppLayout } from "@/shared/ui/AppLayout";
import { DataTable } from "@/shared/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { RiskBadge } from "@/shared/ui/RiskBadge";
import { Building, DollarSign, TrendingUp, AlertTriangle, Plus, MoreHorizontal } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  category: string;
  contractCount: number;
  totalValue: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'inactive' | 'under_review';
  lastReview: string;
}

export default function VendorsPage() {
  // Mock data
  const kpiData = [
    {
      title: "Total Vendors",
      value: "47",
      change: { value: 5, type: "increase" as const },
      icon: Building,
    },
    {
      title: "Active Contracts",
      value: "142",
      change: { value: 12, type: "increase" as const },
      icon: DollarSign,
    },
    {
      title: "Total Portfolio Value",
      value: "$2.4M",
      change: { value: 8, type: "increase" as const },
      icon: TrendingUp,
    },
    {
      title: "High Risk Vendors",
      value: "6",
      icon: AlertTriangle,
    },
  ];

  const vendors: Vendor[] = [
    {
      id: "1",
      name: "TechCorp Solutions",
      category: "Software",
      contractCount: 3,
      totalValue: "$450,000",
      riskLevel: "medium",
      status: "active",
      lastReview: "2 weeks ago",
    },
    {
      id: "2",
      name: "Global Logistics Inc",
      category: "Logistics",
      contractCount: 2,
      totalValue: "$1.2M",
      riskLevel: "high",
      status: "active",
      lastReview: "1 month ago",
    },
    {
      id: "3",
      name: "CloudSoft Services",
      category: "Cloud Services",
      contractCount: 1,
      totalValue: "$180,000",
      riskLevel: "low",
      status: "active",
      lastReview: "1 week ago",
    },
    {
      id: "4",
      name: "Legal Eagles LLP",
      category: "Legal",
      contractCount: 4,
      totalValue: "$320,000",
      riskLevel: "low",
      status: "active",
      lastReview: "3 days ago",
    },
    {
      id: "5",
      name: "Supply Chain Co",
      category: "Manufacturing",
      contractCount: 2,
      totalValue: "$850,000",
      riskLevel: "critical",
      status: "under_review",
      lastReview: "2 months ago",
    },
  ];

  const columns = [
    {
      key: 'name' as keyof Vendor,
      title: 'Vendor',
      sortable: true,
      render: (value: string, row: Vendor) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            {value.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contractCount' as keyof Vendor,
      title: 'Contracts',
      sortable: true,
      render: (value: number, row: Vendor) => (
        <div>
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{row.totalValue}</div>
        </div>
      ),
    },
    {
      key: 'riskLevel' as keyof Vendor,
      title: 'Risk Level',
      sortable: true,
      render: (value: string) => <RiskBadge level={value as any} />,
    },
    {
      key: 'status' as keyof Vendor,
      title: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`
          inline-block px-2 py-1 text-xs rounded-full
          ${value === 'active' ? 'bg-success/10 text-success' : ''}
          ${value === 'under_review' ? 'bg-warning/10 text-warning' : ''}
          ${value === 'inactive' ? 'bg-muted text-muted-foreground' : ''}
        `}>
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'lastReview' as keyof Vendor,
      title: 'Last Review',
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendors & Portfolio</h1>
            <p className="text-muted-foreground">
              Manage vendor relationships and portfolio analytics
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KpiCard key={index} {...kpi} />
          ))}
        </div>

        {/* Vendors Table */}
        <DataTable
          data={vendors}
          columns={columns}
          searchPlaceholder="Search vendors..."
        />

        {/* Portfolio Overview */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Software', 'Logistics', 'Cloud Services', 'Legal', 'Manufacturing'].map((category, index) => {
                  const categoryVendors = vendors.filter(v => v.category === category);
                  const totalValue = categoryVendors.reduce((sum, v) => {
                    const value = parseFloat(v.totalValue.replace(/[$,]/g, ''));
                    return sum + value;
                  }, 0);
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{category}</div>
                        <div className="text-sm text-muted-foreground">
                          {categoryVendors.length} vendors
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">
                          ${totalValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {categoryVendors.reduce((sum, v) => sum + v.contractCount, 0)} contracts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { level: 'critical', count: vendors.filter(v => v.riskLevel === 'critical').length, color: 'text-danger' },
                  { level: 'high', count: vendors.filter(v => v.riskLevel === 'high').length, color: 'text-warning' },
                  { level: 'medium', count: vendors.filter(v => v.riskLevel === 'medium').length, color: 'text-primary' },
                  { level: 'low', count: vendors.filter(v => v.riskLevel === 'low').length, color: 'text-success' },
                ].map(({ level, count, color }) => (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RiskBadge level={level as any} />
                      <span className="text-sm text-foreground capitalize">{level}</span>
                    </div>
                    <span className={`font-medium ${color}`}>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
