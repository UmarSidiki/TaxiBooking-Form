"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { CreditCard, FileText, Truck, User, X } from "lucide-react";

import { PartnerDetailsTabContent } from "@/features/partners/ui/partner-details-tab-content";
import { PartnerDrawerFooter } from "@/features/partners/ui/partner-drawer-footer";
import {
  PartnerDrawerTabButton,
  type PartnerDrawerTabId,
} from "@/features/partners/ui/partner-drawer-tab-button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

const TABS: {
  id: PartnerDrawerTabId;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}[] = [
  { id: "profile", icon: User, labelKey: "tab-profile" },
  { id: "billing", icon: CreditCard, labelKey: "tab-billing" },
  { id: "documents", icon: FileText, labelKey: "tab-documents" },
  { id: "fleet", icon: Truck, labelKey: "tab-fleet" },
];

export function AdminPartnerDetailsDialog(
  props: Pick<
    AdminPartnersState,
    | "t"
    | "selectedPartner"
    | "showDetailsDialog"
    | "setShowDetailsDialog"
    | "vehicles"
    | "formatCurrency"
    | "formatDate"
    | "payoutProcessingId"
    | "handleMarkPayoutPaid"
    | "handleMarkRemittanceReceived"
    | "handleRecalculatePayout"
    | "setSelectedDocument"
    | "setShowDocumentDialog"
    | "processing"
    | "handleFleetApprove"
    | "setSelectedVehicleId"
    | "setShowFleetRejectDialog"
    | "setShowFleetRemoveDialog"
    | "setShowFleetDeleteDialog"
    | "setShowRejectDialog"
    | "handleApprove"
    | "setShowSuspendDialog"
  >
) {
  const {
    t,
    selectedPartner,
    showDetailsDialog,
    setShowDetailsDialog,
    processing,
    handleApprove,
    setShowRejectDialog,
    setShowSuspendDialog,
  } = props;
  const [activeTab, setActiveTab] = useState<PartnerDrawerTabId>("profile");
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isRtl = useLocale() === "ar";

  return (
    <Sheet
      open={showDetailsDialog}
      onOpenChange={(open) => {
        setShowDetailsDialog(open);
        if (open) setActiveTab("profile");
      }}
    >
      <SheetContent
        side={isRtl ? "left" : "right"}
        className="riviera-drawer flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden border-0 p-0 [&>button]:hidden"
        onOpenAutoFocus={() => {
          returnFocusRef.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current;
          if (target && document.contains(target)) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <SheetHeader
          data-drawer-header
          className="riviera-drawer__header flex-none border-b border-border/60"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle
                className="truncate text-sm font-semibold text-foreground sm:text-base"
                title={selectedPartner?.name}
              >
                {t("partner-details")}
              </SheetTitle>
              {selectedPartner ? (
                <p
                  className="mt-0.5 truncate text-xs font-medium text-muted-foreground"
                  title={selectedPartner.name}
                >
                  {selectedPartner.name}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setShowDetailsDialog(false)}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("close")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
          <nav
            className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-border/60 bg-muted/30 ps-2 pe-2 py-1.5 scrollbar-none sm:hidden"
            aria-label={t("partner-details")}
          >
            {TABS.map(({ id, icon: Icon, labelKey }) => (
              <PartnerDrawerTabButton
                key={id}
                id={id}
                icon={Icon}
                label={t(labelKey)}
                active={activeTab === id}
                onSelect={setActiveTab}
                mobile
              />
            ))}
          </nav>

          <nav
            className="hidden w-36 shrink-0 flex-col gap-0.5 border-e border-border/60 bg-muted/30 ps-2 pe-2 py-4 sm:flex"
            aria-label={t("partner-details")}
          >
            {TABS.map(({ id, icon: Icon, labelKey }) => (
              <PartnerDrawerTabButton
                key={id}
                id={id}
                icon={Icon}
                label={t(labelKey)}
                active={activeTab === id}
                onSelect={setActiveTab}
              />
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div
              data-drawer-body
              className="riviera-drawer__body min-h-0 flex-1"
            >
              <PartnerDetailsTabContent activeTab={activeTab} {...props} />
            </div>

            <PartnerDrawerFooter
              t={t}
              selectedPartner={selectedPartner}
              processing={processing}
              handleApprove={handleApprove}
              setShowRejectDialog={setShowRejectDialog}
              setShowSuspendDialog={setShowSuspendDialog}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
