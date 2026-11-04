"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch, ApiError } from "@/shared/http/api";
import type {
  AdminAuditResponse,
  AdminAuditRow,
} from "@/features/customers-admin/lib/audit/audit.types";

export type CustomerActivityState = "loading" | "ready" | "forbidden" | "error";

export function useCustomerActivity(email: string) {
  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const [state, setState] = useState<CustomerActivityState>("loading");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    const url = `/api/admin/customers/${encodeURIComponent(email)}/activity?limit=50`;
    apiFetch<AdminAuditResponse>(url)
      .then((response) => {
        if (!alive) return;
        setRows(response.rows);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setState(
          error instanceof ApiError && (error.status === 401 || error.status === 403)
            ? "forbidden"
            : "error",
        );
      });
    return () => {
      alive = false;
    };
  }, [email, version]);

  const reload = useCallback(() => {
    setState("loading");
    setVersion((value) => value + 1);
  }, []);

  return { rows, state, reload };
}
