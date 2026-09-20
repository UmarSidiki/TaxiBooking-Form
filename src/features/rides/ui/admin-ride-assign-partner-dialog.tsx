"use client";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { AdminRideCardDialogsProps } from "@/features/rides/ui/admin-ride-card-dialogs.types";
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
                  ? "Change the partner assigned to this booking and adjust the margin"
                  : "This will approve the ride for partner marketplace and assign it to the selected partner"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trip ID</span>
                  <span className="font-medium">#{booking.tripId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold text-base sm:text-lg">{currencySymbol}{totalAmountValue.toFixed(2)}</span>
                </div>
                {booking.assignedPartner && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Current Partner</span>
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-sm">{booking.assignedPartner.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{booking.assignedPartner.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {booking.assignedPartner ? "Select New Partner" : "Select Partner"}
                </Label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger className="w-full">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Choose a partner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((partner) => (
                      <SelectItem
                        key={partner._id?.toString()}
                        value={partner._id?.toString() || ""}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{partner.name}</span>
                          <span className="text-xs text-muted-foreground">{partner.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-sm font-medium">
                    Partner Margin Percentage {!booking.assignedPartner && "(Can be changed until partner accepts)"}
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={assignPartnerMargin}
                      onChange={(event) => setAssignPartnerMargin(Number(event.target.value))}
                      className="flex-1"
                      disabled={booking.assignedPartner !== null && booking.assignedPartner !== undefined}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {booking.assignedPartner 
                      ? "Margin is locked after initial assignment" 
                      : "The ride will be approved for partners with this margin before assignment"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Admin Margin
                    </Label>
                    <p className="text-lg sm:text-xl font-bold text-primary mt-1">
                      {currencySymbol}{((totalAmountValue * assignPartnerMargin) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Partner Payout
                    </Label>
                    <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">
                      {currencySymbol}{(totalAmountValue - (totalAmountValue * assignPartnerMargin) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignPartnerModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // First approve for partners marketplace if not already assigned
                    if (!booking.assignedPartner && booking.paymentMethod !== "cash") {
                      const approved = await handleApprovePartnerReview(bookingId, assignPartnerMargin);
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
                    alert("Failed to complete the assignment. Please try again.");
                  }
                }}
                disabled={
                  !selectedPartner ||
                  assigningId === booking._id?.toString() ||
                  approvingPartnerId === bookingId ||
                  (booking.assignedPartner && selectedPartner === booking.assignedPartner._id) ||
                  assignPartnerMargin < 0 ||
                  assignPartnerMargin > 100
                }
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                {(assigningId === booking._id?.toString() || approvingPartnerId === bookingId) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {approvingPartnerId === bookingId ? "Approving..." : (booking.assignedPartner ? "Reassigning..." : "Assigning...")}
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    {booking.assignedPartner ? t("Dashboard.Rides.reassign") : "Approve & Assign"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  );
}
