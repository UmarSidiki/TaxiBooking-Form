"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { apiGet } from "@/shared/http/api";

type SendRow = {
  _id: string;
  at: string;
  number: string;
  kind: string;
  status: string;
};

export function WhatsAppSendLogTable() {
  const t = useTranslations("Dashboard.Settings");
  const locale = useLocale();
  const [rows, setRows] = useState<SendRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });

  useEffect(() => {
    let alive = true;
    apiGet<{ success: boolean; data: { sends: SendRow[] } }>("/api/settings/whatsapp/sends")
      .then((response) => {
        if (alive) setRows(response.data.sends);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return (
      <p className="text-sm text-muted-foreground" role="alert">
        {t("whatsapp_send_log_failed")}
      </p>
    );
  }
  if (!rows) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("loading")}
      </p>
    );
  }
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("whatsapp_send_log_empty")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-border text-start text-xs text-muted-foreground">
            <th scope="col" className="py-2 pe-3 text-start font-medium">
              {t("whatsapp_send_log_time")}
            </th>
            <th scope="col" className="py-2 pe-3 text-start font-medium">
              {t("whatsapp_send_log_number")}
            </th>
            <th scope="col" className="py-2 pe-3 text-start font-medium">
              {t("whatsapp_send_log_kind")}
            </th>
            <th scope="col" className="py-2 text-start font-medium">
              {t("whatsapp_send_log_status")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row._id}>
              <td className="py-2 pe-3 tabular-nums text-muted-foreground">
                {format.format(new Date(row.at))}
              </td>
              <td className="py-2 pe-3" translate="no">
                {row.number}
              </td>
              <td className="py-2 pe-3">{t(`whatsapp_send_kind_${row.kind}`)}</td>
              <td className="py-2">{t(`whatsapp_send_status_${row.status}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
