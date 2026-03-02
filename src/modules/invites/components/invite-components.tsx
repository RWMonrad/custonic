"use client";

import {
    createInviteAction,
    revokeInviteAction,
} from "@/app/[locale]/(app)/org/invites/actions";
import { Button } from "@/shared/ui/Button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/Card";
import { formatDistanceToNow } from "date-fns";
import { Check, Copy, Mail, Plus, X } from "lucide-react";
import { useState } from "react";

function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating..." : children}
    </Button>
  );
}

export function InviteForm() {
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    inviteUrl?: string;
  }>();
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await createInviteAction(formData);
    setResult(result);
    setCopied(false);
  }

  async function handleCopyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Create Invite
        </CardTitle>
        <CardDescription>
          Invite team members to join your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="colleague@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              name="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select role</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <SubmitButton pending={false}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invite
          </SubmitButton>
        </form>

        {result && (
          <div
            className={`mt-4 p-3 rounded-md ${
              result.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {result.success && result.inviteUrl ? (
              <div className="space-y-2">
                <p className="font-medium">✅ {result.message}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white px-2 py-1 rounded border">
                    {result.inviteUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(result.inviteUrl!)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p>❌ {result.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PendingInvites({
  invites,
}: {
  invites: Array<{
    id: string;
    email: string;
    role: string;
    expiresAt: string;
  }>;
}) {
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
  }>();

  async function handleRevoke(formData: FormData) {
    const result = await revokeInviteAction(formData);
    setResult(result);
    // Refresh invites list
    window.location.reload();
  }

  if (invites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invites</CardTitle>
          <CardDescription>No pending invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Create an invite to add team members.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invites ({invites.length})</CardTitle>
        <CardDescription>
          Manage pending organization invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{invite.email}</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      invite.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {invite.role}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Expires{" "}
                  {formatDistanceToNow(new Date(invite.expiresAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>

              <form action={handleRevoke}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <Button type="submit" variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ))}
        </div>

        {result && (
          <div
            className={`mt-4 p-3 rounded-md ${
              result.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <p>
              {result.success ? "✅" : "❌"} {result.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
