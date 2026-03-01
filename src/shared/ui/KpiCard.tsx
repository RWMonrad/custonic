import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: LucideIcon;
  className?: string;
}

export function KpiCard({ title, value, change, icon: Icon, className }: KpiCardProps) {
  const getTrendIcon = (type: "increase" | "decrease" | "neutral") => {
    switch (type) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-danger" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (type: "increase" | "decrease" | "neutral") => {
    switch (type) {
      case "increase":
        return "text-success";
      case "decrease":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className="flex items-center space-x-1 text-xs">
            {getTrendIcon(change.type)}
            <span className={cn(getTrendColor(change.type))}>
              {Math.abs(change.value)}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
