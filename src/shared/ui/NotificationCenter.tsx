"use client";

import { X, Bell, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "./Button";

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Analysis Complete",
    message: "Contract 'Service Agreement' analysis completed with 3 findings.",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "2", 
    type: "warning",
    title: "High Risk Detected",
    message: "Contract 'NDA Template' contains critical liability clauses.",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "New Feature Available",
    message: "Advanced risk scoring is now available for your organization.",
    time: "1 hour ago",
    read: true,
  },
];

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  if (!open) return null;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-danger" />;
      default:
        return <Info className="h-4 w-4 text-accent" />;
    }
  };

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border transition-colors cursor-pointer
                    ${notification.read 
                      ? 'bg-background border-border' 
                      : 'bg-background-alt border-primary/20'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`
                          text-sm font-medium text-foreground
                          ${!notification.read ? 'font-semibold' : ''}
                        `}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button variant="outline" className="w-full">
              Mark all as read
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
