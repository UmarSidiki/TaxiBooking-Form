"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Car,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

export default function DriverLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const t = useTranslations();

  useEffect(() => {
    // Initial animations
    const tl = gsap.timeline();

    // Animate particles
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

    // Animate icon
    if (iconRef.current) {
      tl.fromTo(
        iconRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)" }
      );
    }

    // Animate title
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        "-=0.5"
      );
    }

    // Animate subtitle
    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );
    }

    // Animate card
    if (cardRef.current) {
      tl.fromTo(
        cardRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
        "-=0.2"
      );
    }

    // Animate form elements
    if (formRef.current) {
      const formElements = Array.from(formRef.current.children);
      tl.fromTo(
        formElements,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );
    }

    // Cleanup
    return () => {
      gsap.killTweensOf("*");
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // Form submission animation
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
      callbackUrl: `/drivers`,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? t('Drivers.invalid-email-or-password')
          : result.error
      );

      // Shake animation for error
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: 0 },
          { x: 0, duration: 0.6, ease: "power2.out" }
        );
      }
      return;
    }

    // Success animation
    gsap.to(cardRef.current, {
      scale: 1.05,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: () => {
        router.push(result?.url ?? `/drivers`);
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) particlesRef.current[i] = el;
            }}
            className="absolute rounded-full bg-primary/10"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <div
            ref={iconRef}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 mb-6 shadow-lg shadow-primary/30"
          >
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1
            ref={titleRef}
            className="text-4xl font-bold text-foreground mb-2"
          >
            {t('Drivers.driver-portal')} </h1>
          <p
            ref={subtitleRef}
            className="text-muted-foreground flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {t('Drivers.access-your-driver-dashboard')} <Sparkles className="w-4 h-4 text-primary" />
          </p>
        </div>

        <Card
          ref={cardRef}
          className="shadow-2xl border-0 bg-background/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary"></div>
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              {t('Drivers.sign-in')} </CardTitle>
            <CardDescription className="text-center">
              {t('Drivers.enter-your-credentials-to-access-the-driver-dashboard')} </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="email"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  {t('Drivers.email-address')} </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                  className="border-primary/20 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  placeholder="driver@example.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  htmlFor="password"
                >
                  <Lock className="w-4 h-4 text-primary" />
                  {t('Drivers.password')} </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="border-primary/20 focus:border-primary focus:ring-primary/20 pr-10 transition-all duration-300"
                    placeholder={t('Drivers.enter-your-password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary transition-colors"
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

              {error ? (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm animate-pulse">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-3 font-medium shadow-lg transition-all duration-300 hover:shadow-xl group"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('Drivers.signing-in')} </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {t('Drivers.sign-in')} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('Drivers.need-assistance')}?{" "}
                <a
                  href="#"
                  className="text-primary hover:underline transition-colors"
                >
                  {t('Drivers.contact-support')} </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            © 2025 {process.env.NEXT_PUBLIC_WEBSITE_NAME}{t('Drivers.all-rights-reserved')}
          </p>
        </div>
      </div>
    </div>
  );
}