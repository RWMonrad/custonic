"use client";

import { useState } from "react";
import { AppLayout } from "@/shared/ui/AppLayout";
import { SettingsRow } from "@/shared/ui/SettingsRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Bell, Mail, Smartphone, Webhook } from "lucide-react";

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    // Email Notifications
    emailAlerts: true,
    emailWeekly: false,
    emailCritical: true,
    emailDigest: true,
    
    // Push Notifications
    pushAlerts: true,
    pushCritical: true,
    pushUpdates: false,
    
    // In-App Notifications
    inAppAlerts: true,
    inAppContracts: true,
    inAppDeadlines: true,
    
    // Webhook Settings
    webhookEnabled: false,
    webhookUrl: "",
    
    // Frequency Settings
    immediateAlerts: true,
    hourlyDigest: false,
    dailyDigest: true,
    weeklyDigest: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // TODO: Save to backend
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
          <p className="text-muted-foreground">
            Configure how and when you receive notifications
          </p>
        </div>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingsRow
              title="Critical Alerts"
              description="Receive immediate email for critical risk alerts"
              type="toggle"
              value={settings.emailCritical}
              onValueChange={(value) => handleSettingChange('emailCritical', value)}
            />
            <SettingsRow
              title="Daily Digest"
              description="Daily summary of all contract activities"
              type="toggle"
              value={settings.emailDigest}
              onValueChange={(value) => handleSettingChange('emailDigest', value)}
            />
            <SettingsRow
              title="Weekly Report"
              description="Weekly analytics and risk overview"
              type="toggle"
              value={settings.emailWeekly}
              onValueChange={(value) => handleSettingChange('emailWeekly', value)}
            />
            <SettingsRow
              title="All Alerts"
              description="Email notification for all alert types"
              type="toggle"
              value={settings.emailAlerts}
              onValueChange={(value) => handleSettingChange('emailAlerts', value)}
            />
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Push Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingsRow
              title="Critical Alerts"
              description="Push notifications for critical alerts"
              type="toggle"
              value={settings.pushCritical}
              onValueChange={(value) => handleSettingChange('pushCritical', value)}
            />
            <SettingsRow
              title="All Alerts"
              description="Push notifications for all alert types"
              type="toggle"
              value={settings.pushAlerts}
              onValueChange={(value) => handleSettingChange('pushAlerts', value)}
            />
            <SettingsRow
              title="System Updates"
              description="Notifications about system updates and maintenance"
              type="toggle"
              value={settings.pushUpdates}
              onValueChange={(value) => handleSettingChange('pushUpdates', value)}
            />
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>In-App Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingsRow
              title="Risk Alerts"
              description="Show risk alerts in notification center"
              type="toggle"
              value={settings.inAppAlerts}
              onValueChange={(value) => handleSettingChange('inAppAlerts', value)}
            />
            <SettingsRow
              title="Contract Updates"
              description="Notifications for contract status changes"
              type="toggle"
              value={settings.inAppContracts}
              onValueChange={(value) => handleSettingChange('inAppContracts', value)}
            />
            <SettingsRow
              title="Deadline Reminders"
              description="Reminders for upcoming contract deadlines"
              type="toggle"
              value={settings.inAppDeadlines}
              onValueChange={(value) => handleSettingChange('inAppDeadlines', value)}
            />
          </CardContent>
        </Card>

        {/* Webhook Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Webhook className="h-5 w-5" />
              <span>Webhook Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingsRow
              title="Enable Webhooks"
              description="Send notifications to external systems"
              type="toggle"
              value={settings.webhookEnabled}
              onValueChange={(value) => handleSettingChange('webhookEnabled', value)}
            />
            <SettingsRow
              title="Webhook URL"
              description="Endpoint URL for webhook notifications"
              type="input"
              value={settings.webhookUrl}
              onValueChange={(value) => handleSettingChange('webhookUrl', value)}
              placeholder="https://your-webhook-url.com"
              disabled={!settings.webhookEnabled}
            />
            <SettingsRow
              title="Test Webhook"
              description="Send a test notification to your webhook"
              type="button"
              buttonText="Send Test"
              disabled={!settings.webhookEnabled || !settings.webhookUrl}
            />
          </CardContent>
        </Card>

        {/* Frequency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Frequency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingsRow
              title="Immediate Alerts"
              description="Send notifications immediately when events occur"
              type="toggle"
              value={settings.immediateAlerts}
              onValueChange={(value) => handleSettingChange('immediateAlerts', value)}
            />
            <SettingsRow
              title="Hourly Digest"
              description="Batch notifications into hourly summaries"
              type="toggle"
              value={settings.hourlyDigest}
              onValueChange={(value) => handleSettingChange('hourlyDigest', value)}
            />
            <SettingsRow
              title="Daily Digest"
              description="Batch notifications into daily summaries"
              type="toggle"
              value={settings.dailyDigest}
              onValueChange={(value) => handleSettingChange('dailyDigest', value)}
            />
            <SettingsRow
              title="Weekly Digest"
              description="Batch notifications into weekly summaries"
              type="toggle"
              value={settings.weeklyDigest}
              onValueChange={(value) => handleSettingChange('weeklyDigest', value)}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Settings
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
