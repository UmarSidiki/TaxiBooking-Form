import type { IBooking } from '@/models/booking';

export type BookingPatchApplyOk = {
  ok: true;
  updateData: Partial<IBooking>;
};

export type BookingPatchApplyErr = {
  ok: false;
  status: number;
  message: string;
};

export type BookingPatchApplyResult =
  | BookingPatchApplyOk
  | BookingPatchApplyErr;
