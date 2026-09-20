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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Label } from "@/shared/ui/label";
import type { AdminRideCardDialogsProps } from "@/features/rides/ui/admin-ride-card-dialogs.types";
import { Loader2, User, UserCheck } from "lucide-react";

type Props = Pick<
  AdminRideCardDialogsProps,
  | "t"
  | "booking"
  | "showAssignDriverModal"
  | "setShowAssignDriverModal"
  | "selectedDriver"
  | "setSelectedDriver"
  | "drivers"
  | "assigningId"
  | "handleAssignDriver"
>;

export function AdminRideAssignDriverDialog({
  t,
  booking,
  showAssignDriverModal,
  setShowAssignDriverModal,
  selectedDriver,
  setSelectedDriver,
  drivers,
  assigningId,
  handleAssignDriver,
}: Props) {
  return (
        <Dialog open={showAssignDriverModal} onOpenChange={setShowAssignDriverModal}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="line-clamp-2">{booking.assignedDriver ? t("Dashboard.Rides.reassign-driver") : t("Dashboard.Rides.assign-driver")}</span>
              </DialogTitle>
              <DialogDescription className="text-sm">
                {booking.assignedDriver
                  ? t("Dashboard.Rides.change-driver")
                  : t("Dashboard.Rides.select-driver")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("ThankYou.trip-id")}</span>
                  <span className="font-medium">#{booking.tripId}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("Dashboard.Rides.departure")}</span>
                  <span className="font-medium">{booking.date} {booking.time}</span>
                </div>
                {booking.assignedDriver && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{t("Dashboard.Rides.assigned-driver")}</span>
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-sm">{booking.assignedDriver.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{booking.assignedDriver.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">
                  {booking.assignedDriver
                    ? t("Dashboard.Rides.select-new-driver")
                    : t("Dashboard.Rides.select-driver")}
                </Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger className="h-11 w-full">
                    <User className="me-2 size-4 shrink-0" />
                    <SelectValue placeholder={t("Dashboard.Rides.choose-driver")} />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem
                        key={driver._id?.toString()}
                        value={driver._id?.toString() || ""}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{driver.name}</span>
                          <span className="text-xs text-muted-foreground">{driver.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignDriverModal(false)}
                className="w-full sm:w-auto"
              >
                {t("Dashboard.Rides.cancel")}
              </Button>
              <Button
                onClick={async () => {
                  await handleAssignDriver(booking._id?.toString() || "", selectedDriver);
                  setShowAssignDriverModal(false);
                }}
                disabled={
                  !selectedDriver ||
                  assigningId === booking._id?.toString() ||
                  (booking.assignedDriver && selectedDriver === booking.assignedDriver._id)
                }
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                {assigningId === booking._id?.toString() ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {booking.assignedDriver
                      ? t("Dashboard.Rides.reassign")
                      : t("Dashboard.Rides.assigning")}
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    {booking.assignedDriver ? t("Dashboard.Rides.reassign") : t("Dashboard.Rides.assign")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  );
}
