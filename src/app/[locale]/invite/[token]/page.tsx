"use client";

import { acceptInviteAction } from "@/app/[locale]/(app)/org/invites/actions";
import { Button } from "@/shared/ui/Button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/Card";
import { CheckCircle, Loader2, Mail, Users, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    orgId?: string;
  }>();

  useEffect(() => {
    async function acceptInvite() {
      if (!token) {
        setResult({
          success: false,
          message: "Invalid invite link",
        });
        setLoading(false);
        return;
      }

      try {
        const acceptResult = await acceptInviteAction(token);
        setResult(acceptResult);
      } catch {
        setResult({
          success: false,
          message: "Failed to accept invite",
        });
      } finally {
        setLoading(false);
      }
    }

    acceptInvite();
  }, [token]);

  const handleGoToDashboard = () => {
    if (result?.success && result.orgId) {
      router.push(`/dashboard?org=${result.orgId}`);
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h2 className="text-lg font-semibold">Accepting Invite...</h2>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your invitation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-red-600">Invite Failed</CardTitle>
            <CardDescription>
              We couldn&apos;t process your invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{result?.message}</p>
            </div>

            <div className="space-y-2">
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-green-600">Welcome Aboard!</CardTitle>
          <CardDescription>
            You&apos;ve successfully joined the organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">{result.message}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4" />
                <span>Invite accepted</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Organization access granted</span>
              </div>
            </div>

            <Button onClick={handleGoToDashboard} className="w-full">
              Go to Dashboard
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            You now have access to the organization&apos;s workspace and can
            collaborate with your team.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
