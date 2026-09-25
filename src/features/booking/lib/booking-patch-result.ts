import type { IBooking } from '@/features/booking/model';

export type BookingPatchApplyOk = {
  ok: true;
  updateData: Partial<IBooking>;
  unsetFields?: string[];
  /** Plaintext pay token — only returned from quote; never persisted. */
  paymentToken?: string;
};

export type BookingPatchApplyErr = {
  ok: false;
  status: number;
  message: string;
};

export type BookingPatchApplyResult =
  | BookingPatchApplyOk
  | BookingPatchApplyErr;
