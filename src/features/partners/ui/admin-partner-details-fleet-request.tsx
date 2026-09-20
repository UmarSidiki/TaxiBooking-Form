"use client";

import type { Partner, Vehicle } from "@/features/partners/ui/admin-partner.types";
import { Button } from "@/shared/ui/button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;
type TFn = AdminPartnersState["t"];
type FleetRequest = NonNullable<Partner["fleetRequests"]>[number];

function statusClass(status: string) {
  if (status === "approved") return "bg-primary/10 text-primary";
  if (status === "pending") return "bg-accent text-accent-foreground";
  return "bg-destructive/10 text-destructive";
}

export function AdminPartnerDetailsFleetRequest({
  t,
  request,
  vehicle,
  partnerId,
  processing,
  handleFleetApprove,
  setSelectedVehicleId,
  setShowFleetRejectDialog,
  setShowFleetRemoveDialog,
  setShowFleetDeleteDialog,
}: {
  t: TFn;
  request: FleetRequest;
  vehicle: Vehicle | undefined;
  partnerId: string;
  processing: boolean;
  handleFleetApprove: AdminPartnersState["handleFleetApprove"];
  setSelectedVehicleId: AdminPartnersState["setSelectedVehicleId"];
  setShowFleetRejectDialog: AdminPartnersState["setShowFleetRejectDialog"];
  setShowFleetRemoveDialog: AdminPartnersState["setShowFleetRemoveDialog"];
  setShowFleetDeleteDialog: AdminPartnersState["setShowFleetDeleteDialog"];
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{vehicle?.name || request.vehicleId}</p>
          {vehicle?.category ? (
            <p className="text-xs capitalize text-muted-foreground">{vehicle.category}</p>
          ) : null}
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusClass(request.status)}`}
        >
          {request.status === "approved" ? <CheckCircle2 className="size-3" /> : null}
          {request.status === "pending" ? <Clock className="size-3" /> : null}
          {request.status === "rejected" ? <XCircle className="size-3" /> : null}
          {t(`fleet-${request.status}`)}
        </span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        {t("requested-at")}: {new Date(request.requestedAt).toLocaleString()}
      </p>
      {request.approvedAt ? (
        <p className="mb-2 text-xs text-muted-foreground">
          {t("approved-at")}: {new Date(request.approvedAt).toLocaleString()}
        </p>
      ) : null}
      {request.status === "rejected" && request.rejectionReason ? (
        <div className="mt-2 rounded border border-destructive/20 bg-destructive/10 p-2">
          <p className="text-xs font-medium text-destructive">{t("rejection-reason")}</p>
          <p className="text-xs text-foreground">{request.rejectionReason}</p>
        </div>
      ) : null}
      <div className="mt-3 flex gap-2">
        {request.status === "pending" ? (
          <>
            <Button
              variant="outline"
              className="h-11 flex-1"
              onClick={() => handleFleetApprove(partnerId, request.vehicleId)}
              disabled={processing}
            >
              <CheckCircle2 className="size-3" />
              {t("approve-fleet")}
            </Button>
            <Button
              variant="destructive"
              className="h-11 flex-1"
              onClick={() => {
                setSelectedVehicleId(request.vehicleId);
                setShowFleetRejectDialog(true);
              }}
              disabled={processing}
            >
              <XCircle className="size-3" />
              {t("reject-fleet")}
            </Button>
          </>
        ) : null}
        {request.status === "approved" ? (
          <Button
            variant="destructive"
            className="h-11 w-full"
            onClick={() => {
              setSelectedVehicleId(request.vehicleId);
              setShowFleetRemoveDialog(true);
            }}
            disabled={processing}
          >
            <XCircle className="size-3" />
            {t("remove-fleet")}
          </Button>
        ) : null}
        {request.status === "rejected" ? (
          <Button
            variant="outline"
            className="h-11 w-full border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => {
              setSelectedVehicleId(request.vehicleId);
              setShowFleetDeleteDialog(true);
            }}
            disabled={processing}
          >
            <XCircle className="size-3" />
            {t("delete-fleet-request")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
