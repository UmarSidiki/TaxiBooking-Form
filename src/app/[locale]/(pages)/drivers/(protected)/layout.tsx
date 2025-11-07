import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";

import { authOptions } from "@/lib/auth/options";
import LogoutButton from "@/components/auth/LogoutButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";

type DriverLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DriverProtectedLayout({
  children,
}: DriverLayoutProps) {
  const session = await getServerSession(authOptions);
  const t = await getTranslations();

  if (!session?.user) {
    redirect(`/drivers/login`);
  }

  // Check if user is a driver
  if (session.user.role !== "driver") {
    // If admin, redirect to admin dashboard
    if (session.user.role === "admin") {
      redirect(`/dashboard`);
    }
    // Otherwise, redirect to home
    redirect(`/`);
  }

  // Check if drivers module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {t("Drivers.driver-dashboard")}
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile: Show only essential items */}
              <div className="hidden sm:block text-sm text-gray-500">
                Welcome, {session.user.name}
              </div>
              <div className="hidden md:block text-sm text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <LanguageSwitcher />
              <LogoutButton callbackUrl={`/drivers/login`} />
            </div>
          </div>
          {/* Mobile welcome message */}
          <div className="sm:hidden pb-2">
            <div className="text-sm text-gray-500">
              Welcome, {session.user.name}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
