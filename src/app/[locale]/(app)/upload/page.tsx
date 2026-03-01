import { AppLayout } from "@/shared/ui/AppLayout";
import { UploadDropzone } from "@/shared/ui/UploadDropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { KpiCard } from "@/shared/ui/KpiCard";
import { FileText, Upload, TrendingUp, Clock } from "lucide-react";

export default function UploadPage() {
  // Mock data
  const kpiData = [
    {
      title: "Total Uploaded",
      value: "147",
      change: { value: 12, type: "increase" as const },
      icon: FileText,
    },
    {
      title: "In Queue",
      value: "8",
      change: { value: 3, type: "decrease" as const },
      icon: Clock,
    },
    {
      title: "Processing",
      value: "3",
      icon: Upload,
    },
    {
      title: "Completed Today",
      value: "24",
      change: { value: 8, type: "increase" as const },
      icon: TrendingUp,
    },
  ];

  const recentUploads = [
    {
      id: "1",
      name: "Service_Agreement_TechCorp.pdf",
      status: "completed",
      uploadedAt: "2 hours ago",
      size: "2.4 MB",
    },
    {
      id: "2",
      name: "NDA_Template_LegalDept.docx",
      status: "processing",
      uploadedAt: "1 hour ago",
      size: "1.1 MB",
    },
    {
      id: "3",
      name: "SaaS_Contract_CloudSoft.pdf",
      status: "queued",
      uploadedAt: "30 minutes ago",
      size: "3.7 MB",
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload & Analyze</h1>
          <p className="text-muted-foreground">
            Upload contracts for AI-powered risk analysis
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KpiCard key={index} {...kpi} />
          ))}
        </div>

        {/* Upload Area */}
        <UploadDropzone />

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {upload.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {upload.size} • {upload.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`
                      inline-block px-2 py-1 text-xs rounded-full
                      ${upload.status === 'completed' ? 'bg-success/10 text-success' : ''}
                      ${upload.status === 'processing' ? 'bg-warning/10 text-warning' : ''}
                      ${upload.status === 'queued' ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      {upload.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
