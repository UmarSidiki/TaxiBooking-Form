"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet, apiPost } from "@/shared/http/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { RotateCcw } from "lucide-react";

type RefundRequestRow = {
  _id: string;
  tripId?: string;
  amount: number;
  reason: string;
  status: string;
  createdAt?: string;
};

export function AdminRefundRequestsCard() {
  const t = useTranslations();
  const [rows, setRows] = useState<RefundRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ ok: boolean; requests: RefundRequestRow[] }>("/api/admin/refund-requests");
      setRows((data.requests ?? []).filter((r) => r.status === "pending"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "request_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async () => {
    if (!confirm) return;
    setPending(true);
    try {
      const url = `/api/admin/refund-requests/${confirm.id}/${confirm.action === "approve" ? "approve" : "reject"}`;
      await apiPost(url, {});
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "request_failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="desk-card gap-4 border-border py-5">
      <CardHeader className="flex flex-row items-center justify-between px-5">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("Dashboard.Refunds.title")}
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => void load()}
          aria-label={t("Dashboard.Refunds.refresh")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-5">
        {loading ? (
          <p className="py-6 text-sm text-muted-foreground">{t("Dashboard.Refunds.loading")}</p>
        ) : error ? (
          <p className="py-6 text-sm text-destructive">{error}</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{t("Dashboard.Refunds.empty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Dashboard.Refunds.trip")}</TableHead>
                <TableHead>{t("Dashboard.Refunds.amount")}</TableHead>
                <TableHead>{t("Dashboard.Refunds.reason")}</TableHead>
                <TableHead className="text-end">{t("Dashboard.Refunds.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-medium">{row.tripId ?? row._id}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.reason}</Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-9"
                        onClick={() => setConfirm({ id: row._id, action: "approve" })}
                      >
                        {t("Dashboard.Refunds.approve")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => setConfirm({ id: row._id, action: "reject" })}
                      >
                        {t("Dashboard.Refunds.reject")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <DeskConfirmDialog
        open={confirm !== null}
        title={
          confirm?.action === "approve"
            ? t("Dashboard.Refunds.confirmApproveTitle")
            : t("Dashboard.Refunds.confirmRejectTitle")
        }
        description={
          confirm?.action === "approve"
            ? t("Dashboard.Refunds.confirmApproveDescription")
            : t("Dashboard.Refunds.confirmRejectDescription")
        }
        confirmLabel={
          confirm?.action === "approve"
            ? t("Dashboard.Refunds.approve")
            : t("Dashboard.Refunds.reject")
        }
        cancelLabel={t("Dashboard.Refunds.cancel")}
        pending={pending}
        onConfirm={() => void runAction()}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </Card>
  );
}