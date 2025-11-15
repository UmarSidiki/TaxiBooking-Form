"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Users,
  Sparkles,
  ArrowRight,
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

export default function PartnerSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const tl = gsap.timeline();

    particlesRef.current.forEach((particle, index) => {
      if (particle) {
        gsap.to(particle, {
          y: -20,
          x: Math.random() * 20 - 10,
          opacity: 0,
          duration: 2 + Math.random() * 2,
          repeat: -1,
          delay: index * 0.2,
          ease: "power1.out",
        });
      }
    });

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    gsap.to(formRef.current, {
      scale: 0.98,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: `/partners`,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Invalid email or password"
          : result.error
      );

      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: 0 },
          { x: 0, duration: 0.6, ease: "power2.out" }
        );
      }
      return;
    }

    gsap.to(cardRef.current, {
      scale: 1.05,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: () => {
        router.push(result?.url ?? `/partners`);
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 overflow-hidden relative"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) particlesRef.current[i] = el;
            }}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: `${Math.random() * 6 + 3}px`,
              height: `${Math.random() * 6 + 3}px`,
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-10 text-center">
          <div
            ref={iconRef}
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 mb-6 shadow-2xl shadow-primary/40 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
            <Users className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1
            ref={titleRef}
            className="text-5xl font-extrabold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent mb-3"
          >
            Partner Portal
          </h1>
          <p
            ref={subtitleRef}
            className="text-muted-foreground text-base flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Access your partner dashboard
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </p>
        </div>

        <Card
          ref={cardRef}
          className="shadow-2xl border border-primary/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden"
        >
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary"></div>
          <CardHeader className="space-y-2 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-base">
              Sign in to continue to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold flex items-center gap-2 text-foreground"
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
                  className="h-12 border-2 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-base"
                  placeholder="partner@example.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold flex items-center gap-2 text-foreground"
                  htmlFor="password"
                >
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="h-12 border-2 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 pr-12 transition-all duration-300 text-base"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm font-medium flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 dark:text-red-400 text-xs">
                      ✕
                    </span>
                  </div>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 text-white text-base font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] group"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/partners/register"
                  className="text-primary font-medium hover:underline"
                >
                  Register as Partner
                </Link>
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Need assistance?{" "}
                  <a
                    href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                    className="text-primary font-medium hover:underline transition-colors"
                  >
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            © 2025 {process.env.NEXT_PUBLIC_WEBSITE_NAME || "Partner Portal"}.
            All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
