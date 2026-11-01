"use client";

import { useCallback, useEffect, useState } from "react";

import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  ApiError,
} from "@/shared/http/api";
import type {
  AdminNoteResponse,
  AdminNoteRow,
  AdminNotesResponse,
} from "@/features/customers-admin/lib/notes/admin-note.types";

export type CustomerNotesState = "loading" | "ready" | "forbidden" | "error";

function notesUrl(email: string) {
  return `/api/admin/customers/${encodeURIComponent(email)}/notes`;
}

function stateForError(error: unknown): CustomerNotesState {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "forbidden";
  }
  return "error";
}

export function useCustomerNotes(email: string) {
  const [notes, setNotes] = useState<AdminNoteRow[]>([]);
  const [state, setState] = useState<CustomerNotesState>("loading");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    apiFetch<AdminNotesResponse>(notesUrl(email))
      .then((response) => {
        if (!alive) return;
        setNotes(response.notes);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (alive) setState(stateForError(error));
      });
    return () => {
      alive = false;
    };
  }, [email, version]);

  const reload = useCallback(() => {
    setState("loading");
    setVersion((value) => value + 1);
  }, []);

  const create = useCallback(
    async (text: string) => {
      const response = await apiPost<AdminNoteResponse>(notesUrl(email), { text });
      setNotes((rows) => [response.note, ...rows]);
      return response.note;
    },
    [email],
  );

  const update = useCallback(
    async (noteId: string, text: string) => {
      const response = await apiPatch<AdminNoteResponse>(
        `${notesUrl(email)}/${encodeURIComponent(noteId)}`,
        { text },
      );
      setNotes((rows) => rows.map((row) => (row.id === noteId ? response.note : row)));
      return response.note;
    },
    [email],
  );

  const remove = useCallback(
    async (noteId: string) => {
      await apiDelete(`${notesUrl(email)}/${encodeURIComponent(noteId)}`);
      setNotes((rows) => rows.filter((row) => row.id !== noteId));
    },
    [email],
  );

  return { notes, state, reload, create, update, remove };
}
