import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DriverSidebar } from "@/components/DriverSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { authOptions } from "@/lib/auth/options";
import { getTranslations } from "next-intl/server";

type DriverLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DriverProtectedLayout({
  children,
  params,
}: DriverLayoutProps) {
  const session = await getServerSession(authOptions);
  const t = await getTranslations();
  const { locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/drivers/login`);
  }

  // Check if user is a driver
  if (session.user.role !== "driver") {
    // If admin, redirect to admin dashboard
    if (session.user.role === "admin") {
      redirect(`/${locale}/dashboard`);
    }
    // Otherwise, redirect to home
    redirect(`/${locale}`);
  }

  // Check if drivers module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/${locale}`);
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DriverSidebar locale={locale} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {t("Drivers.driver-dashboard")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("Sidebar.welcome")}, {session.user.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground hidden md:block">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
