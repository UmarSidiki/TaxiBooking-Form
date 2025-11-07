import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";

import { authOptions } from "@/lib/auth/options";
import { PartnerSidebar } from "@/components/PartnerSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type PartnerLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PartnerProtectedLayout({
  children,
  params,
}: PartnerLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/partners/login`);
  }

  // Check if user is a partner
  if (session.user.role !== "partner") {
    // If admin, redirect to admin dashboard
    if (session.user.role === "admin") {
      redirect(`/dashboard`);
    }
    // Otherwise, redirect to home
    redirect(`/`);
  }

  // Check if partners module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enablePartners === false) {
    redirect(`/`);
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen bg-gray-50">
        <PartnerSidebar locale={locale} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 z-10">
            <div className="flex items-center justify-between px-4 py-3">
              <SidebarTrigger className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-2" />
              <div className="flex items-center space-x-4">
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
