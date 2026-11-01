"use client";

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiFetch, ApiError } from "@/shared/http/api";
import type {
  CustomerProfilePayload,
  CustomerProfileResponse,
} from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

export type CustomerProfileState =
  | "loading"
  | "ready"
  | "not_found"
  | "forbidden"
  | "error";

function profileUrl(email: string) {
  return `/api/admin/customers/${encodeURIComponent(email)}`;
}

export function useCustomerProfile(email: string) {
  const [data, setData] = useState<CustomerProfilePayload | null>(null);
  const [state, setState] = useState<CustomerProfileState>("loading");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    apiFetch<CustomerProfileResponse>(profileUrl(email))
      .then((response) => {
        if (!alive) return;
        setData(response.data);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!alive) return;
        if (error instanceof ApiError && error.status === 404) {
          setState("not_found");
          return;
        }
        if (error instanceof ApiError && (error.status === 403 || error.status === 401)) {
          setState("forbidden");
          return;
        }
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [email, version]);

  const reload = useCallback(() => {
    setState("loading");
    setVersion((value) => value + 1);
  }, []);

  const revokeSession = useCallback(
    async (sessionId: string) => {
      await apiDelete(`${profileUrl(email)}/sessions/${sessionId}`);
      reload();
    },
    [email, reload],
  );

  const revokeAllSessions = useCallback(async () => {
    await apiDelete(`${profileUrl(email)}/sessions`);
    reload();
  }, [email, reload]);

  return { data, state, reload, revokeSession, revokeAllSessions };
}
