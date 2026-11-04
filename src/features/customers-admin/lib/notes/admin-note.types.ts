export type AdminNoteDoc = {
  _id: unknown;
  emailLower: string;
  authorId: string;
  authorName?: string | null;
  text: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminNoteRow = {
  id: string;
  email: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  /** Computed server-side so the client never has to know the viewer id. */
  canEdit: boolean;
};

export type AdminNotesResponse = {
  success: true;
  notes: AdminNoteRow[];
};

export type AdminNoteResponse = {
  success: true;
  note: AdminNoteRow;
};
