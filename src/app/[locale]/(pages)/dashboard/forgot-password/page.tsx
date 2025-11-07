"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { gsap } from "gsap";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    if (iconRef.current) {
      tl.fromTo(
        iconRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)" }
      );
    }

    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        "-=0.5"
      );
    }

    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );
    }

    if (cardRef.current) {
      tl.fromTo(
        cardRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
        "-=0.2"
      );
    }

    return () => {
      gsap.killTweensOf("*");
    };
  }, []);

  const handleRequestOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setSuccess("OTP sent to your email. Please check your inbox.");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      setSuccess("OTP verified! Please set your new password.");
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/dashboard/signin");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-10 text-center">
          <div
            ref={iconRef}
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 mb-6 shadow-2xl shadow-primary/40 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
            <KeyRound className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1
            ref={titleRef}
            className="text-5xl font-extrabold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent mb-3"
          >
            Reset Password
          </h1>
          <p
            ref={subtitleRef}
            className="text-muted-foreground text-base flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Secure password recovery
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </p>
        </div>

        <Card
          ref={cardRef}
          className="shadow-2xl border-0 bg-background/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary"></div>
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              {step === "email" && "Request OTP"}
              {step === "otp" && "Verify OTP"}
              {step === "password" && "Set New Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === "email" && "Enter your email to receive an OTP"}
              {step === "otp" && "Enter the 6-digit code sent to your email"}
              {step === "password" && "Create a new secure password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <form
                ref={formRef}
                className="space-y-5"
                onSubmit={handleRequestOTP}
              >
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium flex items-center gap-2"
                    htmlFor="email"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={loading}
                    className="border-primary/20 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                    placeholder="admin@example.com"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-3 font-medium shadow-lg transition-all duration-300 hover:shadow-xl group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Send OTP
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form
                ref={formRef}
                className="space-y-5"
                onSubmit={handleVerifyOTP}
              >
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium flex items-center gap-2"
                    htmlFor="otp"
                  >
                    <Lock className="w-4 h-4 text-primary" />
                    OTP Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    required
                    disabled={loading}
                    maxLength={6}
                    className="border-primary/20 focus:border-primary focus:ring-primary/20 transition-all duration-300 text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Check your email for the 6-digit code
                  </p>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-3 font-medium shadow-lg transition-all duration-300 hover:shadow-xl group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Verify OTP
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("email")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to email
                </Button>
              </form>
            )}

            {step === "password" && (
              <form
                ref={formRef}
                className="space-y-5"
                onSubmit={handleResetPassword}
              >
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium flex items-center gap-2"
                    htmlFor="newPassword"
                  >
                    <Lock className="w-4 h-4 text-primary" />
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="border-primary/20 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                    placeholder="Enter new password"
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium flex items-center gap-2"
                    htmlFor="confirmPassword"
                  >
                    <Lock className="w-4 h-4 text-primary" />
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="border-primary/20 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                    placeholder="Confirm new password"
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-3 font-medium shadow-lg transition-all duration-300 hover:shadow-xl group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Resetting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Reset Password
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/dashboard/signin"
                className="text-sm text-primary hover:underline transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            © 2025 {process.env.NEXT_PUBLIC_WEBSITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
