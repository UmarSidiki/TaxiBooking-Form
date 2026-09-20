"use client";

import { AdminPartnerDetailsFleetRequest } from "@/features/partners/ui/admin-partner-details-fleet-request";
import type { Partner, Vehicle } from "@/features/partners/ui/admin-partner.types";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { CheckCircle2, Clock, Truck, XCircle } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;
type TFn = AdminPartnersState["t"];

export function AdminPartnerDetailsFleet({
  t,
  selectedPartner,
  vehicles,
  processing,
  handleFleetApprove,
  setSelectedVehicleId,
  setShowFleetRejectDialog,
  setShowFleetRemoveDialog,
  setShowFleetDeleteDialog,
}: {
  t: TFn;
  selectedPartner: Partner;
  vehicles: Vehicle[];
  processing: boolean;
  handleFleetApprove: AdminPartnersState["handleFleetApprove"];
  setSelectedVehicleId: AdminPartnersState["setSelectedVehicleId"];
  setShowFleetRejectDialog: AdminPartnersState["setShowFleetRejectDialog"];
  setShowFleetRemoveDialog: AdminPartnersState["setShowFleetRemoveDialog"];
  setShowFleetDeleteDialog: AdminPartnersState["setShowFleetDeleteDialog"];
}) {
  const validFleetRequests =
    selectedPartner.fleetRequests?.filter(
      (request) =>
        request.status && request.status !== "none" && request.vehicleId && request.vehicleId.trim() !== ""
    ) || [];
  const hasNoFleet =
    validFleetRequests.length === 0 &&
    (!selectedPartner.fleetStatus || selectedPartner.fleetStatus === "none");

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Truck className="size-5" />
        {t("fleet-information")}
      </h3>
      {hasNoFleet ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-muted-foreground">
          <Truck className="mx-auto mb-2 size-8 opacity-50" />
          <p className="text-sm">{t("fleet-none")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedPartner.fleetStatus &&
          selectedPartner.fleetStatus !== "none" &&
          validFleetRequests.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {vehicles.find((v) => v._id === selectedPartner.requestedFleet)?.name ||
                    selectedPartner.requestedFleet ||
                    t("vehicle-requested")}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    selectedPartner.fleetStatus === "approved"
                      ? "bg-primary/10 text-primary"
                      : selectedPartner.fleetStatus === "pending"
                        ? "bg-accent text-accent-foreground"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {selectedPartner.fleetStatus === "approved" ? <CheckCircle2 className="size-3" /> : null}
                  {selectedPartner.fleetStatus === "pending" ? <Clock className="size-3" /> : null}
                  {selectedPartner.fleetStatus === "rejected" ? <XCircle className="size-3" /> : null}
                  {t(`fleet-${selectedPartner.fleetStatus}`)}
                </span>
              </div>
              {selectedPartner.fleetRequestedAt ? (
                <p className="text-xs text-muted-foreground">
                  {t("requested-at")}: {new Date(selectedPartner.fleetRequestedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}
          {validFleetRequests.map((request) => (
            <AdminPartnerDetailsFleetRequest
              key={`${request.vehicleId}-${request.requestedAt}`}
              t={t}
              request={request}
              vehicle={vehicles.find((v) => v._id === request.vehicleId)}
              partnerId={selectedPartner._id}
              processing={processing}
              handleFleetApprove={handleFleetApprove}
              setSelectedVehicleId={setSelectedVehicleId}
              setShowFleetRejectDialog={setShowFleetRejectDialog}
              setShowFleetRemoveDialog={setShowFleetRemoveDialog}
              setShowFleetDeleteDialog={setShowFleetDeleteDialog}
            />
          ))}
        </div>
      )}
    </div>
  );
}
