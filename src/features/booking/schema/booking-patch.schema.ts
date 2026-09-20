import { z } from 'zod';

export const BOOKING_PATCH_ACTIONS = [
  'cancel',
  'complete',
  'assign',
  'assignpartner',
  'approvepartner',
] as const;

export const bookingPatchActionSchema = z.enum(BOOKING_PATCH_ACTIONS);

export type BookingPatchAction = z.infer<typeof bookingPatchActionSchema>;

export const bookingPatchBodySchema = z
  .object({
    action: z.unknown().optional(),
    refundPercentage: z.unknown().optional(),
    driverId: z.unknown().optional(),
    partnerId: z.unknown().optional(),
    marginPercentage: z.unknown().optional(),
  })
  .passthrough();

export type BookingPatchBody = {
  action: BookingPatchAction;
  refundPercentage?: number;
  driverId?: unknown;
  partnerId?: unknown;
  marginPercentage?: unknown;
};

type ParseOk = { success: true; data: BookingPatchBody };
type ParseErr = { success: false; status: 400; message: string };

export function parseBookingPatchBody(body: unknown): ParseOk | ParseErr {
  if (body === null || typeof body !== 'object') {
    throw new TypeError(`Cannot read properties of ${String(body)}`);
  }

  const record = body as Record<string, unknown>;
  const rawAction =
    typeof record.action === 'string' ? record.action.toLowerCase() : undefined;
  const normalizedRefundPercentage =
    record.refundPercentage !== undefined
      ? Number(record.refundPercentage)
      : undefined;

  if (!rawAction) {
    return { success: false, status: 400, message: 'Action is required' };
  }

  const parsedAction = bookingPatchActionSchema.safeParse(rawAction);
  if (!parsedAction.success) {
    return {
      success: false,
      status: 400,
      message: `Unsupported action: ${rawAction}`,
    };
  }

  if (
    normalizedRefundPercentage !== undefined &&
    (Number.isNaN(normalizedRefundPercentage) ||
      normalizedRefundPercentage < 0 ||
      normalizedRefundPercentage > 100)
  ) {
    return {
      success: false,
      status: 400,
      message: 'Refund percentage must be a number between 0 and 100',
    };
  }

  return {
    success: true,
    data: {
      action: parsedAction.data,
      refundPercentage: normalizedRefundPercentage,
      driverId: record.driverId,
      partnerId: record.partnerId,
      marginPercentage: record.marginPercentage,
    },
  };
}
