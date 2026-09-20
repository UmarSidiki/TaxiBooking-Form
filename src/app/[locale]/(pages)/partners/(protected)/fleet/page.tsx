"use client";

import { PartnerFleetAssigned } from "@/features/partners/ui/partner-fleet-assigned";
import { PartnerFleetAvailable } from "@/features/partners/ui/partner-fleet-available";
import { PartnerFleetPending } from "@/features/partners/ui/partner-fleet-pending";
import {
  getPartnerFleetStatusInfo,
  PartnerFleetStatusAlert,
} from "@/features/partners/ui/partner-fleet-status";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { usePartnerFleet } from "@/features/fleet/hooks/usePartnerFleet";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PartnerFleetPage() {
  const tCancel = useTranslations("Dashboard.Rides");
  const fleet = usePartnerFleet();
  const {
    t,
    vehicles,
    partner,
    isLoading,
    loadError,
    submitting,
    cancellingVehicleId,
    removingFleet,
    resolveImageSrc,
    pendingRequests,
    handleFleetRequest,
    handleCancelRequest,
    handleRemoveFleet,
    fetchData,
    confirm,
    setConfirm,
    runConfirm,
    notice,
    setNotice,
  } = fleet;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-sm">{t("fleet-management")}…</p>
      </div>
    );
  }

  if (loadError || !partner) {
    return (
      <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="alert">
        {loadError || t("failed-to-load-partner-data")}
        <Button variant="outline" className="ms-3 h-11" onClick={() => void fetchData()}>
          {t("refresh-page")}
        </Button>
      </p>
    );
  }

  const canRequestFleet =
    partner.fleetStatus === "none" ||
    partner.fleetStatus === "rejected" ||
    partner.fleetStatus === "approved" ||
    !!partner.fleetRequests;
  const approvedVehicle =
    partner.fleetStatus === "approved"
      ? vehicles.find((v) => v._id === partner.requestedFleet)
      : partner.currentFleet
        ? vehicles.find((v) => v._id === partner.currentFleet)
        : null;
  const statusInfo = getPartnerFleetStatusInfo(partner, vehicles, pendingRequests, t);
  const confirmCopy =
    confirm?.kind === "cancel"
      ? { title: t("cancel-request"), description: t("confirm-cancel-request"), label: t("cancel-request") }
      : confirm?.kind === "remove"
        ? { title: t("remove-fleet"), description: t("confirm-remove-fleet"), label: t("remove-fleet") }
        : {
            title: t("request-fleet-change"),
            description: t("confirm-fleet-change-message"),
            label: t("request-fleet"),
          };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("fleet-management")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("select-vehicle-from-admin-fleet")}</p>
      </div>
      {notice ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="status">
          {notice}
          <button
            type="button"
            className="ms-3 text-primary underline-offset-4 hover:underline"
            onClick={() => setNotice(null)}
          >
            {t("dismiss")}
          </button>
        </p>
      ) : null}
      {statusInfo ? <PartnerFleetStatusAlert statusInfo={statusInfo} /> : null}
      {approvedVehicle ? (
        <PartnerFleetAssigned
          t={t}
          approvedVehicle={approvedVehicle}
          resolveImageSrc={resolveImageSrc}
          handleRemoveFleet={handleRemoveFleet}
          removingFleet={removingFleet}
        />
      ) : null}
      {pendingRequests.length > 0 ? (
        <PartnerFleetPending
          t={t}
          pendingRequests={pendingRequests}
          vehicles={vehicles}
          resolveImageSrc={resolveImageSrc}
          approvedVehicle={approvedVehicle}
          handleCancelRequest={handleCancelRequest}
          cancellingVehicleId={cancellingVehicleId}
        />
      ) : null}
      <PartnerFleetAvailable
        t={t}
        vehicles={vehicles}
        approvedVehicle={approvedVehicle}
        pendingRequests={pendingRequests}
        partner={partner}
        canRequestFleet={canRequestFleet}
        handleFleetRequest={handleFleetRequest}
        submitting={submitting}
        resolveImageSrc={resolveImageSrc}
      />
      <DeskConfirmDialog
        open={Boolean(confirm)}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.label}
        cancelLabel={tCancel("cancel")}
        pending={submitting || removingFleet || Boolean(cancellingVehicleId)}
        onConfirm={() => void runConfirm()}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}
