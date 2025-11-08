"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface PartnerDocument {
  type: string;
  fileName: string;
  fileData: string;
  mimeType: string;
  fileSize: number;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  rejectionReason?: string;
}

interface PartnerData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  documents: PartnerDocument[];
  rejectionReason?: string;
}

interface RideStats {
  totalRides: number;
  upcomingRides: number;
  completedRides: number;
  canceledRides: number;
  totalEarnings: number;
}

export default function PartnerDashboardPage() {
  const t = useTranslations("Dashboard.Partners.Dashboard");
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RideStats | null>(null);

  useEffect(() => {
    fetchPartnerData();
  }, []);

  useEffect(() => {
    if (partner?.status === "approved") {
      fetchStats();
    }
  }, [partner]);

  const fetchPartnerData = async () => {
    try {
      const response = await fetch("/api/partners/profile");
      const data = await response.json();

      if (response.ok) {
        setPartner(data.partner);
      }
    } catch (error) {
      console.error("Error fetching partner data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/partners/stats");
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t("failed-to-load-partner-data")}</p>
      </div>
    );
  }

  const isApproved = partner.status === "approved";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("your-partner-account-details")}
        </p>
      </div>

      {/* Stats Dashboard for Approved Partners */}
      {isApproved && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("total-rides")}
                  </p>
                  <p className="text-2xl font-bold">{stats.totalRides}</p>
                </div>
                <FileText className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("upcoming")}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.upcomingRides}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("completed")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedRides}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("total-earnings")}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    €{stats.totalEarnings.toFixed(2)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isApproved && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {t("account-not-approved")}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {t("dashboard-available-after-approval")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
