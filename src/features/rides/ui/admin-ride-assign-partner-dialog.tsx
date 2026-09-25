"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { AdminRideCardDialogsProps } from "@/features/rides/ui/admin-ride-card-dialogs.types";
import { AdminRideAssignPartnerFields } from "@/features/rides/ui/admin-ride-assign-partner-fields";
import { PARTNER_ASSIGN_DB_SETTLE_MS } from "@/features/rides/lib/partner-assign-db-settle";
import { Loader2, Users } from "lucide-react";

type Props = Pick<
  AdminRideCardDialogsProps,
  | "t"
  | "booking"
  | "bookingId"
  | "currencySymbol"
  | "totalAmountValue"
  | "showAssignPartnerModal"
  | "setShowAssignPartnerModal"
  | "selectedPartner"
  | "setSelectedPartner"
  | "assignPartnerMargin"
  | "setAssignPartnerMargin"
  | "partners"
  | "assigningId"
  | "approvingPartnerId"
  | "handleApprovePartnerReview"
  | "handleAssignPartner"
>;

export function AdminRideAssignPartnerDialog({
  t,
  booking,
  bookingId,
  currencySymbol,
  totalAmountValue,
  showAssignPartnerModal,
  setShowAssignPartnerModal,
  selectedPartner,
  setSelectedPartner,
  assignPartnerMargin,
  setAssignPartnerMargin,
  partners,
  assigningId,
  approvingPartnerId,
  handleApprovePartnerReview,
  handleAssignPartner,
}: Props) {
  const [assignNotice, setAssignNotice] = useState<string | null>(null);
  return (
        <Dialog open={showAssignPartnerModal} onOpenChange={setShowAssignPartnerModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="line-clamp-2">{booking.assignedPartner ? t("Dashboard.Rides.reassign-partner") : t("Dashboard.Rides.assign-partner")}</span>
              </DialogTitle>
              <DialogDescription className="text-sm">
                {booking.assignedPartner
                  ? t("Dashboard.Rides.reassign_partner_help")
                  : t("Dashboard.Rides.assign_partner_help")}
              </DialogDescription>
            </DialogHeader>
            
            <AdminRideAssignPartnerFields
              t={t}
              booking={booking}
              currencySymbol={currencySymbol}
              totalAmountValue={totalAmountValue}
              selectedPartner={selectedPartner}
              setSelectedPartner={setSelectedPartner}
              assignPartnerMargin={assignPartnerMargin}
              setAssignPartnerMargin={setAssignPartnerMargin}
              partners={partners}
            />

            {assignNotice ? (
              <p className="text-sm text-destructive" role="status">
                {assignNotice}
              </p>
            ) : null}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignPartnerModal(false)}
                className="min-h-11 w-full sm:w-auto"
              >
                {t("Dashboard.Rides.cancel")}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // First approve for partners marketplace if not already assigned
                    if (
                      !booking.assignedPartner &&
                      booking.partnerReviewStatus !== "approved"
                    ) {
                      const approved = await handleApprovePartnerReview(
                        bookingId,
                        assignPartnerMargin,
                        { notifyPartners: false }
                      );
                      if (!approved) {
                        return; // Don't proceed if approval failed
                      }
                      // Wait a bit to ensure the booking is updated in the database
                      await new Promise(resolve => setTimeout(resolve, PARTNER_ASSIGN_DB_SETTLE_MS));
                    }
                    // Then assign the partner
                    await handleAssignPartner(booking._id?.toString() || "", selectedPartner);
                    setShowAssignPartnerModal(false);
                  } catch (error) {
                    console.error("Error in partner assignment:", error);
                    setAssignNotice(t("Dashboard.Rides.failed-to-assign-partner"));
                  }
                }}
                disabled={
                  !selectedPartner ||
                  assigningId === booking._id?.toString() ||
                  approvingPartnerId === bookingId ||
                  (booking.assignedPartner &&
                    selectedPartner ===
                      String(booking.assignedPartner._id)) ||
                  assignPartnerMargin < 0 ||
                  assignPartnerMargin > 100
                }
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                {(assigningId === booking._id?.toString() || approvingPartnerId === bookingId) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {approvingPartnerId === bookingId
                      ? t("Dashboard.Rides.approving")
                      : booking.assignedPartner
                        ? t("Dashboard.Rides.reassign")
                        : t("Dashboard.Rides.assigning")}
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    {booking.assignedPartner
                      ? t("Dashboard.Rides.reassign")
                      : t("Dashboard.Rides.approve_assign")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  );
}
