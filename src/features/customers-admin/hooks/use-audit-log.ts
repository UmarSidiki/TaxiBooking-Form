"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch, ApiError } from "@/shared/http/api";
import {
  DEFAULT_ADMIN_AUDIT_QUERY,
  toAdminAuditSearchString,
  type AdminAuditQuery,
} from "@/features/customers-admin/schema/admin-audit.schema";
import type {
  AdminAuditResponse,
  AdminAuditRow,
} from "@/features/customers-admin/lib/audit/audit.types";

export type AuditLogState = "loading" | "ready" | "forbidden" | "error";

export function useAuditLog() {
  const [params, setParams] = useState<AdminAuditQuery>(DEFAULT_ADMIN_AUDIT_QUERY);
  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const [state, setState] = useState<AuditLogState>("loading");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setState("loading");
    const query = toAdminAuditSearchString(params);
    apiFetch<AdminAuditResponse>(`/api/admin/audit?${query}`)
      .then((response) => {
        if (!alive) return;
        setRows(response.rows);
        setNextCursor(response.nextCursor);
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
  }, [params]);

  const applyFilters = useCallback((patch: Partial<AdminAuditQuery>) => {
    setLoadMoreFailed(false);
    setParams((current) => ({ ...current, ...patch, cursor: undefined }));
  }, []);

  const resetFilters = useCallback(() => {
    setLoadMoreFailed(false);
    setParams({ ...DEFAULT_ADMIN_AUDIT_QUERY });
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const query = toAdminAuditSearchString(params, nextCursor);
      const response = await apiFetch<AdminAuditResponse>(`/api/admin/audit?${query}`);
      setRows((current) => [...current, ...response.rows]);
      setNextCursor(response.nextCursor);
    } catch {
      setLoadMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, params]);

  return {
    params,
    rows,
    state,
    nextCursor,
    loadingMore,
    loadMoreFailed,
    applyFilters,
    resetFilters,
    loadMore,
  };
}
