import { z } from 'zod';
import {
  isValidEmail,
  isValidName,
  isValidPhone,
} from '@/shared/lib/validation';
import type { BookingInput } from '@/features/booking/model';

export const cashBookingStopSchema = z
  .object({
    location: z.unknown(),
    order: z.unknown().optional(),
    duration: z.unknown().optional(),
  })
  .passthrough();

export const cashBookingInputSchema = z
  .object({
    bookingType: z.unknown().optional(),
    pickup: z.unknown().optional(),
    dropoff: z.unknown().optional(),
    stops: z.array(cashBookingStopSchema).optional(),
    tripType: z.unknown().optional(),
    duration: z.unknown().optional(),
    date: z.unknown().optional(),
    time: z.unknown().optional(),
    firstName: z.unknown().optional(),
    lastName: z.unknown().optional(),
    email: z.unknown().optional(),
    phone: z.unknown().optional(),
    selectedVehicle: z.unknown().optional(),
    childSeats: z.unknown().optional(),
    babySeats: z.unknown().optional(),
  })
  .passthrough();

type ParseOk = { success: true; data: BookingInput };
type ParseErr = { success: false; message: string };

const MAX_SEATS = 10;

function invalidSeatCount(value: number): boolean {
  return Number.isNaN(value) || value < 0 || value > MAX_SEATS;
}

export function parseCashBookingInput(body: unknown): ParseOk | ParseErr {
  if (body === null || typeof body !== 'object') {
    throw new TypeError(`Cannot read properties of ${String(body)}`);
  }

  const formData = body as BookingInput;

  if (!formData.pickup || !formData.date || !formData.time) {
    return { success: false, message: 'Missing required trip details' };
  }

  if (formData.stops && formData.stops.length > 0) {
    for (let i = 0; i < formData.stops.length; i++) {
      const stop = formData.stops[i];
      if (!stop.location || stop.location.trim() === '') {
        return {
          success: false,
          message: `Stop ${i + 1} location is required`,
        };
      }
      if (stop.order === undefined || stop.order < 0) {
        return {
          success: false,
          message: `Stop ${i + 1} order must be a valid number`,
        };
      }
    }
  }

  if (
    formData.bookingType === 'destination' &&
    !formData.dropoff &&
    (!formData.stops || formData.stops.length === 0)
  ) {
    return {
      success: false,
      message: 'Dropoff location is required for destination bookings',
    };
  }

  if (
    !formData.firstName ||
    !formData.lastName ||
    !formData.email ||
    !formData.phone
  ) {
    return { success: false, message: 'Missing required personal details' };
  }

  if (!isValidEmail(formData.email)) {
    return { success: false, message: 'Invalid email address format' };
  }

  if (!isValidPhone(formData.phone)) {
    return { success: false, message: 'Invalid phone number format' };
  }

  if (!isValidName(formData.firstName)) {
    return { success: false, message: 'Invalid first name format' };
  }

  if (!isValidName(formData.lastName)) {
    return { success: false, message: 'Invalid last name format' };
  }

  if (!formData.selectedVehicle) {
    return { success: false, message: 'Please select a vehicle' };
  }

  const childSeats =
    typeof formData.childSeats === 'number'
      ? formData.childSeats
      : parseInt(String(formData.childSeats || 0), 10);
  const babySeats =
    typeof formData.babySeats === 'number'
      ? formData.babySeats
      : parseInt(String(formData.babySeats || 0), 10);

  if (invalidSeatCount(childSeats)) {
    return { success: false, message: 'Invalid number of child seats' };
  }

  if (invalidSeatCount(babySeats)) {
    return { success: false, message: 'Invalid number of baby seats' };
  }

  formData.childSeats = childSeats;
  formData.babySeats = babySeats;

  return { success: true, data: formData };
}
