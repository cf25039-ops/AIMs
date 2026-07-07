"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { AdminRoleManager } from "@/components/settings/admin-role-manager";
import { exportMyData, deleteMyAccount } from "@/app/actions/user-data-rights";
import {
  Settings,
  Moon,
  Sun,
  User,
  Database,
  Shield,
  Loader2,
  Lock,
  Copy,
  Check as CheckIcon,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStatus, setMfaStatus] = useState<"none" | "enrolling" | "verifying" | "enabled">(
    "none",
  );
  const [mfaError, setMfaError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch current user and profile details
  const { data: userProfile, isLoading: loadingUser } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      return { user, profile, factors };
    },
  });

  // Check MFA status on load
  useEffect(() => {
    if (userProfile?.factors?.totp && userProfile.factors.totp.length > 0) {
      setMfaStatus("enabled");
    }
  }, [userProfile?.factors]);

  async function startMFAEnrollment() {
    setMfaLoading(true);
    setMfaError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;
      setMfaQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setMfaFactorId(data.id);
      setMfaStatus("enrolling");
    } catch (err: any) {
      setMfaError(err.message || "Failed to start MFA setup");
    } finally {
      setMfaLoading(false);
    }
  }

  async function verifyMFA() {
    if (!mfaCode || mfaCode.length !== 6) {
      setMfaError("Please enter a 6-digit code");
      return;
    }
    setMfaLoading(true);
    setMfaError("");
    try {
      const supabase = createClient();
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });
      if (verifyError) throw verifyError;
      setMfaStatus("enabled");
      setMfaCode("");
    } catch (err: any) {
      setMfaError(err.message || "Verification failed. Check your code.");
    } finally {
      setMfaLoading(false);
    }
  }

  async function removeMFA() {
    if (!userProfile?.factors?.totp?.[0]) return;
    setMfaLoading(true);
    setMfaError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: userProfile.factors.totp[0].id,
      });
      if (error) throw error;
      setMfaStatus("none");
    } catch (err: any) {
      setMfaError(err.message || "Failed to disable MFA");
    } finally {
      setMfaLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(mfaSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const result = await exportMyData();
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `my-aims-data-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to export data: " + err.message);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const result = await deleteMyAccount();
      if (result.success) {
        window.location.href = "/login?message=account_deleted";
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
      setDeleteLoading(false);
    }
  }

  // Read theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark" || document.documentElement.classList.contains("dark");
    setIsDark(dark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">System Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure application preferences and view system info
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Appearance */}
      <FadeIn delay={0.1}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {isDark ? (
                <Moon className="h-5 w-5 text-indigo-400" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              Appearance
            </CardTitle>
            <CardDescription>Manage theme and visual preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">
                  {isDark ? "Dark theme is currently active" : "Light theme is currently active"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Switch to Light" : "Switch to Dark"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Profile Information */}
      <FadeIn delay={0.2}>
        <Card className="glass-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <Badge
                variant="success"
                className="uppercase text-[10px] tracking-wider px-2.5 py-0.5"
              >
                Authenticated
              </Badge>
            </div>
            <CardDescription>
              Your account details retrieved from the authentication provider
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingUser ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : userProfile ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <span className="text-sm font-semibold text-foreground">
                    User Profile:{" "}
                    {(() => {
                      const id = userProfile.user.id;
                      let hash = 0;
                      for (let i = 0; i < id.length; i++) {
                        hash += id.charCodeAt(i);
                      }
                      return (hash % 90) + 10;
                    })()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  {/* Row 1 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Group
                    </span>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {(() => {
                        const role = userProfile.profile?.role;
                        if (role === "super_admin") return "Super Administrator";
                        if (role === "project_admin") return "Project Administrator";
                        if (role === "technician") return "Technician / Support Engineer";
                        if (role === "department_user") return "Department User";
                        return role?.replace("_", " ") || "Staff";
                      })()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      User ID
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {userProfile.user.email?.split("@")[0] || "N/A"}
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Name
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {userProfile.profile?.full_name || "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email
                    </span>
                    <span className="text-sm font-medium text-foreground break-all">
                      {userProfile.user.email || "N/A"}
                    </span>
                  </div>

                  {/* Row 3 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Phone
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {(() => {
                        const role = userProfile.profile?.role;
                        if (role === "super_admin") return "+60 3-2178 4000";
                        if (role === "project_admin") return "+60 3-8883 3888";
                        if (role === "technician") return "+60 9-513 5555";
                        if (role === "department_user") return "+60 9-513 5555 (Ext. 210)";
                        return "+60 3-8318 0000";
                      })()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Site Office
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {(() => {
                        const role = userProfile.profile?.role;
                        if (role === "super_admin") return "HQ AIMS Control Center, KL";
                        if (role === "project_admin") return "KKM Putrajaya HQ, Blok E";
                        if (role === "technician") return "Hospital Kuantan IT Room";
                        if (role === "department_user") return "Hospital Kuantan Emergency Dept";
                        return "DWSB Cyberjaya";
                      })()}
                    </span>
                  </div>

                  {/* Row 4 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Timezone
                    </span>
                    <span className="text-sm font-medium text-foreground">Asia/Kuala_Lumpur</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      User Status
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium text-foreground">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Failed to load user profile.
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Two-Factor Authentication */}
      <FadeIn delay={0.25}>
        <Card className="glass-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-500" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <Badge
                variant={mfaStatus === "enabled" ? "success" : "warning"}
                className="uppercase text-[10px] tracking-wider px-2.5 py-0.5"
              >
                {mfaStatus === "enabled"
                  ? "Active"
                  : mfaStatus === "enrolling"
                    ? "Setting Up"
                    : "Not Set"}
              </Badge>
            </div>
            <CardDescription>
              Protect your account with a time-based one-time password (TOTP)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {mfaStatus === "none" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">2FA is currently disabled</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use an authenticator app (Google Authenticator, Authy, 1Password) to scan a QR
                    code.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startMFAEnrollment}
                  disabled={mfaLoading}
                  className="gap-2"
                >
                  {mfaLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Enable 2FA
                </Button>
              </div>
            )}

            {mfaStatus === "enrolling" && (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div
                    className="flex h-48 w-48 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white p-3"
                    dangerouslySetInnerHTML={{ __html: mfaQrCode }}
                  />
                  <div className="space-y-2 flex-1 text-sm">
                    <p className="font-medium text-foreground">Scan the QR code above</p>
                    <p className="text-muted-foreground text-xs">
                      Use Google Authenticator, Authy, or 1Password to scan this QR code.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-mono break-all">
                        {mfaSecret}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copySecret}
                        className="gap-1 shrink-0"
                      >
                        {copied ? (
                          <CheckIcon className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Enter 6-digit code to verify
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => {
                        setMfaCode(e.target.value.replace(/\D/g, ""));
                        setMfaError("");
                      }}
                      placeholder="000000"
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-center text-lg font-mono tracking-widest outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <Button
                    onClick={verifyMFA}
                    disabled={mfaLoading || mfaCode.length !== 6}
                    className="gap-1"
                  >
                    {mfaLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify & Enable
                  </Button>
                </div>

                {mfaError && (
                  <p className="text-xs text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">
                    {mfaError}
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMfaStatus("none");
                    setMfaQrCode("");
                    setMfaSecret("");
                    setMfaCode("");
                    setMfaError("");
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {mfaStatus === "enabled" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <CheckIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Two-Factor Authentication is active
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeMFA}
                  disabled={mfaLoading}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  {mfaLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Disable 2FA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Data Rights (PDPA) */}
      <FadeIn delay={0.3}>
        <Card className="glass-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-500" />
                Your Data Rights (PDPA)
              </CardTitle>
            </div>
            <CardDescription>
              Manage your personal data in accordance with the Personal Data Protection Act
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 p-4">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Download className="h-4 w-4 text-sky-500" />
                  Export My Data
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download all your personal data as a JSON file
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exportLoading}
                className="gap-1"
              >
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div>
                <p className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your account and all associated data
                </p>
              </div>
              {!deleteConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(true)}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Delete Account
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive">Are you sure?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="gap-1"
                  >
                    {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Yes, Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteConfirm(false);
                      setDeleteError("");
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {deleteError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* System Information */}
      {userProfile?.profile?.role === "super_admin" && (
        <>
          <FadeIn delay={0.3}>
            <AdminRoleManager currentUserId={userProfile.user.id} />
          </FadeIn>

          <FadeIn delay={0.4}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-sky-500" />
                  System Information
                </CardTitle>
                <CardDescription>Technical details about the current deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Application Version</span>
                    </div>
                    <Badge variant="info">v1.0.0</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Database Status</span>
                    </div>
                    <Badge variant="success">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Auth Provider</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Supabase Auth</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Environment</span>
                    </div>
                    <Badge variant="warning">Development</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </>
      )}
    </div>
  );
}
