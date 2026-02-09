import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardProtectedLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/dashboard/signin`);
  }

  // Additional check: ensure user is admin
  if (session.user.role !== "admin") {
    redirect(`/drivers`);
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen bg-gray-50">
        <AppSidebar locale={locale} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 z-10">
            <div className="flex items-center justify-between px-4 py-3">
              <SidebarTrigger className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-2" />
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}