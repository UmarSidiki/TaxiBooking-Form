import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import LogoutButton from "@/components/auth/LogoutButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type DriverLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DriverProtectedLayout({
  children,
  params,
}: DriverLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile: Show only essential items */}
              <div className="hidden sm:block text-sm text-gray-500">
                Welcome, {session.user.name}
              </div>
              <div className="hidden md:block text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <LanguageSwitcher />
              <LogoutButton callbackUrl={`/${locale}/drivers/login`} />
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