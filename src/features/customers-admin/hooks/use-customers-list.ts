"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/shared/http/api";
import {
  countActiveCustomerFilters,
  DEFAULT_CUSTOMER_LIST_PARAMS,
  toCustomerListSearchString,
  type CustomerListParams,
} from "@/features/customers-admin/schema/customer-list.schema";
import type {
  CustomerListResponse,
  CustomerListRow,
} from "@/features/customers-admin/lib/customer-list/customer-list.types";

const SEARCH_DEBOUNCE_MS = 300;

export function useCustomersList() {
  const [params, setParams] = useState<CustomerListParams>(
    DEFAULT_CUSTOMER_LIST_PARAMS,
  );
  const [searchInput, setSearchInput] = useState("");
  const [rows, setRows] = useState<CustomerListRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchInput.trim();
      setParams((prev) => (prev.q === q ? prev : { ...prev, q }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(
    async (cursor: string | null, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setRows([]);
        setNextCursor(null);
      }
      setError(null);

      try {
        const search = toCustomerListSearchString({
          ...params,
          cursor: cursor ?? undefined,
        });
        const data = await apiFetch<CustomerListResponse>(
          `/api/admin/customers?${search}`,
          { method: "GET", signal: controller.signal },
        );
        if (requestId !== requestRef.current) return;
        setRows((prev) => (append ? [...prev, ...data.rows] : data.rows));
        setNextCursor(data.nextCursor);
      } catch {
        if (controller.signal.aborted || requestId !== requestRef.current) return;
        setError("load_failed");
      } finally {
        if (requestId === requestRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [params],
  );

  useEffect(() => {
    void load(null, false);
    return () => abortRef.current?.abort();
  }, [load]);

  const applyFilters = useCallback((patch: Partial<CustomerListParams>) => {
    setParams((prev) => ({ ...prev, ...patch, cursor: undefined }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams((prev) => ({
      ...DEFAULT_CUSTOMER_LIST_PARAMS,
      q: prev.q,
      sort: prev.sort,
      dir: prev.dir,
    }));
  }, []);

  const setSort = useCallback(
    (sort: CustomerListParams["sort"], dir: CustomerListParams["dir"]) => {
      setParams((prev) => ({ ...prev, sort, dir, cursor: undefined }));
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore) return;
    void load(nextCursor, true);
  }, [load, nextCursor, isLoadingMore]);

  return {
    params,
    searchInput,
    setSearchInput,
    rows,
    isLoading,
    isLoadingMore,
    error,
    hasMore: nextCursor !== null,
    activeFilterCount: countActiveCustomerFilters(params),
    hasQuery: params.q.trim().length > 0 || countActiveCustomerFilters(params) > 0,
    applyFilters,
    resetFilters,
    setSort,
    loadMore,
    reload: () => void load(null, false),
  };
}
