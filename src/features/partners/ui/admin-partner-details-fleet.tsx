"use client";

import type { Partner, PartnerDocument, Vehicle } from "@/components/admin-partners/admin-partner.types";
import {
  AdminPartnerDocumentStatusBadge,
  AdminPartnerStatusBadge,
} from "@/components/admin-partners/admin-partner-status-badges";
import { Button } from "@/components/ui/button";
import type { useAdminPartners } from "@/hooks/partners/useAdminPartners";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  PiggyBank,
  Truck,
  XCircle,
} from "lucide-react";

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
  return (
    <>
              {/* Fleet Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {t("fleet-information")}
                </h3>
                
                {(() => {
                  // Filter out invalid fleet requests (status "none" or no vehicleId)
                  const validFleetRequests = selectedPartner.fleetRequests?.filter(
                    request => request.status && request.status !== "none" && request.vehicleId && request.vehicleId.trim() !== ""
                  ) || [];
                  
                  // Check if partner has no fleet at all
                  const hasNoFleet = validFleetRequests.length === 0 && 
                    (!selectedPartner.fleetStatus || selectedPartner.fleetStatus === "none");
                  
                  if (hasNoFleet) {
                    return (
                      <div className="p-4 border rounded-lg bg-muted/30 text-center text-muted-foreground">
                        <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t("fleet-none")}</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {/* Show legacy single fleet if exists and no valid fleetRequests */}
                      {selectedPartner.fleetStatus && selectedPartner.fleetStatus !== "none" && validFleetRequests.length === 0 && (
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">
                              {vehicles.find(v => v._id === selectedPartner.requestedFleet)?.name || selectedPartner.requestedFleet || "Unknown Vehicle"}
                            </p>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              selectedPartner.fleetStatus === "approved"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : selectedPartner.fleetStatus === "pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}>
                              {selectedPartner.fleetStatus === "approved" && <CheckCircle2 className="w-3 h-3" />}
                              {selectedPartner.fleetStatus === "pending" && <Clock className="w-3 h-3" />}
                              {selectedPartner.fleetStatus === "rejected" && <XCircle className="w-3 h-3" />}
                              {t(`fleet-${selectedPartner.fleetStatus}`)}
                            </span>
                          </div>
                          {selectedPartner.fleetRequestedAt && (
                            <p className="text-xs text-muted-foreground">
                              {t("requested-at")}: {new Date(selectedPartner.fleetRequestedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Show all valid fleet requests */}
                      {validFleetRequests.map((request, index) => {
                        const vehicle = vehicles.find(v => v._id === request.vehicleId);
                        return (
                          <div key={index} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">
                                  {vehicle?.name || request.vehicleId}
                                </p>
                                {vehicle?.category && (
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {vehicle.category}
                                  </p>
                                )}
                              </div>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                request.status === "approved"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : request.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}>
                              {request.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                              {request.status === "pending" && <Clock className="w-3 h-3" />}
                              {request.status === "rejected" && <XCircle className="w-3 h-3" />}
                              {t(`fleet-${request.status}`)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("requested-at")}: {new Date(request.requestedAt).toLocaleString()}
                          </p>
                          
                          {request.approvedAt && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {t("approved-at")}: {new Date(request.approvedAt).toLocaleString()}
                            </p>
                          )}
                          
                          {request.status === "rejected" && request.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded">
                              <p className="text-xs font-medium text-red-900 dark:text-red-100">{t("rejection-reason")}</p>
                              <p className="text-xs text-red-700 dark:text-red-300">{request.rejectionReason}</p>
                            </div>
                          )}
                          
                          {/* Action buttons for each request */}
                          <div className="flex gap-2 mt-3">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFleetApprove(selectedPartner._id, request.vehicleId)}
                                  disabled={processing}
                                  className="flex-1"
                                >
                                  {processing ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                  )}
                                  {t("approve-fleet")}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVehicleId(request.vehicleId);
                                    setShowFleetRejectDialog(true);
                                  }}
                                  disabled={processing}
                                  className="flex-1"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {t("reject-fleet")}
                                </Button>
                              </>
                            )}
                            
                            {request.status === "approved" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicleId(request.vehicleId);
                                  setShowFleetRemoveDialog(true);
                                }}
                                disabled={processing}
                                className="w-full"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                {t("remove-fleet")}
                              </Button>
                            )}
                            
                            {request.status === "rejected" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicleId(request.vehicleId);
                                  setShowFleetDeleteDialog(true);
                                }}
                                disabled={processing}
                                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                {t("delete-fleet-request")}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  );
                })()}
              </div>
    </>
  );
}
