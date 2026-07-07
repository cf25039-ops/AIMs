"use client";

import { useState } from "react";
import { Loader2, Shield, CheckCircle } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        setError(result?.error || "Unable to sign in");
        return;
      }

      if (result.mfaRequired) {
        // Fetch MFA factor ID for challenge
        const supabase = createClient();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors?.totp && factors.totp.length > 0) {
          setMfaFactorId(factors.totp[0].id);
          setMfaStep(true);
        } else {
          window.location.href = "/";
        }
        return;
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMFAVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!mfaCode || mfaCode.length !== 6 || !mfaFactorId) return;
    setMfaError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });
      if (verifyErr) throw verifyErr;

      window.location.href = "/";
    } catch (err: any) {
      setMfaError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <FadeIn className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AIMS Enterprise</h1>
          <p className="text-muted-foreground mt-2">Advanced Infrastructure Management System</p>
        </div>

        <Card className="glass-card border-border/60 shadow-xl">
          {!mfaStep ? (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Secure Access</CardTitle>
                <CardDescription>
                  Enter your enterprise credentials to access the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">
                      Work Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@aims.gov.my"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium" htmlFor="password">
                        Password
                      </label>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {error ? (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                      {error}
                    </div>
                  ) : null}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-xl">Two-Factor Verification</CardTitle>
                </div>
                <CardDescription>
                  Enter the 6-digit code from your authenticator app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMFAVerify} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="mfa-code">
                      Authentication Code
                    </label>
                    <Input
                      id="mfa-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => {
                        setMfaCode(e.target.value.replace(/\D/g, ""));
                        setMfaError(null);
                      }}
                      placeholder="000000"
                      required
                      className="text-center text-2xl tracking-widest font-mono"
                      autoFocus
                    />
                  </div>

                  {mfaError ? (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                      {mfaError}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || mfaCode.length !== 6}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => {
                      setMfaStep(false);
                      setMfaCode("");
                      setMfaError(null);
                    }}
                  >
                    Back to login
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </FadeIn>
    </div>
  );
}
