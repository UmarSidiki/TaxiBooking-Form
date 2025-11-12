"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Users,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";
import type { IVehicle } from "@/models/vehicle";
import Image from "next/image";
import { apiGet } from "@/utils/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PartnerData {
  _id: string;
  name: string;
  email: string;
  fleetRequests?: Array<{
    vehicleId: string;
    status: "none" | "pending" | "approved" | "rejected";
    requestedAt: string;
    approvedAt?: string;
    approvedBy?: string;
    rejectionReason?: string;
  }>;
  currentFleet?: string;
  // Keep backward compatibility
  requestedFleet?: string;
  fleetStatus?: "none" | "pending" | "approved" | "rejected";
  fleetRequestedAt?: string;
  fleetRejectionReason?: string;
}

export default function PartnerFleetPage() {
  const t = useTranslations("Dashboard.Partners.Fleet");
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const resolveImageSrc = (src: string) => {
    if (!src) return "/placeholder-car.jpg";
    if (src.startsWith("/") || src.startsWith("data:")) return src;
    try {
      return new URL(src).toString();
    } catch (error) {
      console.warn("Invalid vehicle image URL. Falling back to placeholder.", error);
      return "/placeholder-car.jpg";
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vehiclesData, partnerData] = await Promise.all([
        apiGet<{ success: boolean; data: IVehicle[] }>("/api/vehicles"),
        fetch("/api/partners/profile").then(res => res.json())
      ]);

      if (vehiclesData.success) {
        setVehicles(vehiclesData.data);
      } else {
        console.error("Failed to fetch vehicles");
      }

      if (partnerData.success) {
        setPartner(partnerData.partner);
      } else {
        console.error("Failed to fetch partner data:", partnerData.error || partnerData);
        setPartner(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setPartner(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFleetRequest = async (vehicleId: string) => {
    if (!partner || submitting) return;
    
    // Check if already has a pending request for this vehicle
    const existingRequest = pendingRequests.find(req => req.vehicleId === vehicleId);
    if (existingRequest) {
      alert(t("already-requested-this-vehicle"));
      return;
    }
    
    // Show confirmation dialog if partner already has an approved fleet
    if (partner.fleetStatus === "approved" || approvedRequests.length > 0) {
      const confirmed = window.confirm(
        t("confirm-fleet-change-message")
      );
      if (!confirmed) return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/partners/fleet/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchData(); // Refresh all data
      } else {
        alert(data.message || t("fleet-request-failed"));
      }
    } catch (error) {
      console.error("Error requesting fleet:", error);
      alert(t("fleet-request-failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = ():
    | {
        variant: "default" | "destructive" | "success";
        icon: React.ReactElement;
        title: string;
        description: string;
      }
    | null => {
    if (!partner) return null;

    // Check for multiple pending requests
    if (pendingRequests.length > 0) {
      const requestedVehicles = pendingRequests.map(req => {
        const vehicle = vehicles.find(v => v._id === req.vehicleId);
        return vehicle?.name || 'Unknown Vehicle';
      }).join(', ');
      
      return {
        variant: "default",
        icon: <Clock className="h-4 w-4" />,
        title: t("pending-approval"),
        description: `${t("requested-vehicles")}: ${requestedVehicles}. ${t("waiting-for-admin-approval")}`,
      };
    }

    const requestedVehicle = vehicles.find(v => v._id === partner.requestedFleet);

    switch (partner.fleetStatus) {
      case "pending":
        return {
          variant: "default",
          icon: <Clock className="h-4 w-4" />,
          title: t("pending-approval"),
          description: `${t("requested-vehicle")}: ${requestedVehicle?.name || 'N/A'}. ${t("waiting-for-admin-approval")}`,
        };
      case "approved":
        return {
          variant: "success",
          icon: <CheckCircle className="h-4 w-4" />,
          title: t("approved"),
          description: `${t("you-can-now-accept-rides")} ${t("you-can-request-different-vehicle")}`,
        };
      case "rejected":
        return {
          variant: "destructive",
          icon: <AlertCircle className="h-4 w-4" />,
          title: t("rejected"),
          description: `${t("reason")}: ${partner.fleetRejectionReason || t("no-reason-provided")}. ${t("you-can-request-different-vehicle")}`,
        };
      default:
        return {
          variant: "default",
          icon: <Info className="h-4 w-4" />,
          title: t("no-fleet-assigned"),
          description: t("select-vehicle-to-request"),
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("failed-to-load-partner-data")}</AlertTitle>
        <AlertDescription>
          {t("ensure-logged-in-and-refresh")}
          <Button variant="outline" size="sm" className="ml-4" onClick={() => window.location.reload()}>
            {t("refresh-page")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const canRequestFleet = partner.fleetStatus === "none" || partner.fleetStatus === "rejected" || partner.fleetStatus === "approved" || !!partner.fleetRequests;
  const approvedVehicle = partner.fleetStatus === "approved" ? vehicles.find(v => v._id === partner.requestedFleet) : 
                         partner.currentFleet ? vehicles.find(v => v._id === partner.currentFleet) : null;
  
  // Get pending fleet requests
  const pendingRequests = partner.fleetRequests?.filter(req => req.status === "pending") || [];
  const approvedRequests = partner.fleetRequests?.filter(req => req.status === "approved") || [];
  
  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("fleet-management")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("select-vehicle-from-admin-fleet")}
        </p>
      </div>

      {statusInfo && (
        <Alert variant={statusInfo.variant as "default" | "destructive" | "success"}>
          {statusInfo.icon}
          <AlertTitle>{statusInfo.title}</AlertTitle>
          <AlertDescription>{statusInfo.description}</AlertDescription>
        </Alert>
      )}

      {approvedVehicle && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("currently-assigned")}</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Info className="w-3 h-3 mr-1" />
              {t("can-request-change-below")}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <VehicleCard
              vehicle={approvedVehicle}
              isApproved
              isSubmitting={false}
              resolveImageSrc={resolveImageSrc}
              isRequested={false}
              hasApprovedFleet={true}
            />
          </div>
          <Separator className="my-8" />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("available-vehicles")}</h2>
        {vehicles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold">{t("no-vehicles-available")}</p>
            <p className="text-sm">{t("check-back-later")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles
              .filter(v => v._id !== approvedVehicle?._id)
              .map((vehicle) => {
                const hasPendingRequest = pendingRequests.some(req => req.vehicleId === vehicle._id);
                return (
                  <VehicleCard
                    key={vehicle._id}
                    vehicle={vehicle}
                    onRequest={canRequestFleet && !hasPendingRequest ? handleFleetRequest : undefined}
                    isSubmitting={submitting}
                    resolveImageSrc={resolveImageSrc}
                    isRequested={hasPendingRequest || (partner.requestedFleet === vehicle._id && partner.fleetStatus === "pending")}
                    isApproved={false}
                    hasApprovedFleet={!!approvedVehicle}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// Vehicle Card Component
const VehicleCard = ({
  vehicle,
  onRequest,
  isSubmitting,
  resolveImageSrc,
  isRequested,
  isApproved,
  hasApprovedFleet,
}: {
  vehicle: IVehicle;
  onRequest?: (vehicleId: string) => void;
  isSubmitting: boolean;
  resolveImageSrc: (src: string) => string;
  isRequested: boolean;
  isApproved: boolean;
  hasApprovedFleet?: boolean;
}) => {
  const t = useTranslations("Dashboard.Partners.Fleet");

  const cardClasses = cn(
    "group transition-all duration-300 border-2 flex flex-col",
    isRequested && "border-yellow-400 bg-yellow-50/50 shadow-lg",
    isApproved && "border-green-400 bg-green-50/50 shadow-lg",
    onRequest && !isRequested && !isApproved && "hover:shadow-xl hover:border-primary/50"
  );

  return (
    <Card className={cardClasses}>
      <CardHeader>
        <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden mb-4">
          <Image
            src={resolveImageSrc(vehicle.image)}
            alt={vehicle.name}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold">
              {vehicle.name}
            </CardTitle>
            <Badge variant="secondary" className="capitalize shrink-0 text-white">
              {vehicle.category}
            </Badge>
          </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
          {vehicle.description || t('no-description')}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
          <div className="flex items-center gap-2 font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.persons} {t("seats")}</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.baggages} {t("bags")}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {onRequest && !isRequested && !isApproved && (
          <Button
            onClick={() => onRequest(vehicle._id!)}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t("requesting")}
              </>
            ) : (
              hasApprovedFleet ? t("request-fleet-change") : t("request-fleet")
            )}
          </Button>
        )}
        {isRequested && (
          <Badge variant="outline" className="w-full justify-center py-2 bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-semibold">{t("requested")}</span>
          </Badge>
        )}
        {isApproved && (
          <Badge variant="outline" className="w-full justify-center py-2 bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="font-semibold">{t("currently-assigned")}</span>
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};