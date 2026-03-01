import { cn } from "@/lib/utils";

type RiskLevel = "critical" | "high" | "medium" | "low";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const styles = {
    critical: "bg-danger text-danger-foreground",
    high: "bg-warning text-warning-foreground", 
    medium: "bg-accent text-accent-foreground",
    low: "bg-success text-success-foreground",
  };

  const labels = {
    critical: "Critical",
    high: "High",
    medium: "Medium", 
    low: "Low",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        styles[level],
        className
      )}
    >
      {labels[level]}
    </span>
  );
}
