import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, FileText, TrendingUp, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Custonic</h1>
            </div>
            <Badge variant="secondary">Contract Monitoring Platform</Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Monitor Contracts with Confidence
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Track, analyze, and manage your contracts in real-time. Never miss
            an important deadline or renewal opportunity again.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contracts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">248</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Contracts
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">186</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">+3 new this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-900 mb-4">
            Powerful Contract Management Features
          </h3>
          <p className="text-lg text-slate-600">
            Everything you need to keep your contracts organized and under
            control
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>
                Track contract status, deadlines, and performance metrics in
                real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Get instant notifications about important events and changes in
                your contracts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automated Alerts</CardTitle>
              <CardDescription>
                Never miss a renewal deadline with intelligent alert system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Configure custom alerts for renewals, expirations, and other
                critical events.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive insights into your contract portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Visualize contract performance, value trends, and client
                relationships.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-600">
            <p>
              &copy; 2026 Custonic. Part of the comprehensive platform suite.
            </p>
            <p className="mt-2">
              Create proposals → Monitor contracts → Negotiate terms → Predict
              churn
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
