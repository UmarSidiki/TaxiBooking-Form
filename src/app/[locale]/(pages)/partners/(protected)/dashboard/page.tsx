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

interface AvailableRide {
  _id: string;
  tripId: string;
  pickup: string;
  dropoff?: string;
  date: string;
  time: string;
  passengers: number;
  selectedVehicle: string;
  vehicleDetails: {
    name: string;
    price: string;
    seats: string;
  };
  totalAmount: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface FleetInfo {
  fleetStatus: "none" | "pending" | "approved" | "rejected";
  requestedFleet?: string;
  fleetRejectionReason?: string;
}

export default function PartnerDashboardPage() {
  const t = useTranslations("Dashboard.Partners.Dashboard");
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RideStats | null>(null);
  const [fleetInfo, setFleetInfo] = useState<FleetInfo | null>(null);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([]);
  const [acceptingRide, setAcceptingRide] = useState<string | null>(null);

  useEffect(() => {
    fetchPartnerData();
  }, []);

  useEffect(() => {
    if (partner?.status === "approved") {
      fetchStats();
      fetchAvailableRides();
    }
  }, [partner]);

  // Poll for available rides every 30 seconds if user is approved
  useEffect(() => {
    if (partner?.status === "approved") {
      const interval = setInterval(fetchAvailableRides, 30000);
      return () => clearInterval(interval);
    }
  }, [partner?.status]);

  const fetchPartnerData = async () => {
    try {
      const response = await fetch("/api/partners/profile");
      const data = await response.json();

      if (response.ok) {
        setPartner(data.partner);
        setFleetInfo({
          fleetStatus: data.partner.currentFleet ? "approved" : (data.partner.fleetStatus || "none"),
          requestedFleet: data.partner.requestedFleet,
          fleetRejectionReason: data.partner.fleetRejectionReason,
        });
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

  const fetchAvailableRides = async () => {
    try {
      const response = await fetch("/api/partners/rides/available");
      const data = await response.json();

      if (response.ok) {
        setAvailableRides(data.rides || []);
      }
    } catch (error) {
      console.error("Error fetching available rides:", error);
    }
  };

  const acceptRide = async (rideId: string) => {
    setAcceptingRide(rideId);
    try {
      const response = await fetch(`/api/partners/rides/${rideId}/accept`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        // Remove the ride from available rides
        setAvailableRides(prev => prev.filter(ride => ride._id !== rideId));
        // Refresh stats as this will now count as an upcoming ride
        fetchStats();
        alert(t("ride-accepted-successfully"));
      } else {
        alert(data.message || t("failed-to-accept-ride"));
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
      alert(t("failed-to-accept-ride"));
    } finally {
      setAcceptingRide(null);
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

      {/* Fleet Status Alert for Approved Partners */}
      {isApproved && fleetInfo && fleetInfo.fleetStatus === "pending" && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {t("fleet-request-pending")}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t("waiting-for-fleet-approval")}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  {t("check-fleet-section")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Rides Section for Approved Partners with Fleet */}
      {isApproved && fleetInfo?.fleetStatus === "approved" && availableRides.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">{t("available-rides")}</h2>
            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {availableRides.length} {t("available")}
            </div>
          </div>

          <div className="grid gap-4">
            {availableRides.map((ride) => (
              <Card key={ride._id} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">Trip #{ride.tripId}</h3>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {ride.vehicleDetails.name}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("pickup")}</p>
                          <p className="font-medium">{ride.pickup}</p>
                          {ride.dropoff && (
                            <>
                              <p className="text-sm text-muted-foreground mt-2">{t("dropoff")}</p>
                              <p className="font-medium">{ride.dropoff}</p>
                            </>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">{t("date-time")}</p>
                          <p className="font-medium">{ride.date} at {ride.time}</p>
                          <p className="text-sm text-muted-foreground mt-2">{t("passengers")}</p>
                          <p className="font-medium">{ride.passengers} passengers</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("customer")}</p>
                          <p className="font-medium">{ride.firstName} {ride.lastName}</p>
                          <p className="text-sm text-muted-foreground">{ride.phone} • {ride.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">€{ride.totalAmount}</p>
                        </div>
                      </div>

                      {ride.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">{t("notes")}</p>
                          <p className="text-sm">{ride.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => acceptRide(ride._id)}
                        disabled={acceptingRide === ride._id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        {acceptingRide === ride._id ? t("accepting") : t("accept-ride")}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
