import { Booking, type IBooking } from '@/features/booking/model';

const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export async function findBookingById(id: string) {
  return Booking.findById(id);
}

export async function updateBookingById(
  id: string,
  updateData: Partial<IBooking>,
  unsetFields?: string[]
) {
  const update: Record<string, unknown> = {};
  if (Object.keys(updateData).length > 0) {
    update.$set = updateData;
  }
  if (unsetFields?.length) {
    update.$unset = Object.fromEntries(unsetFields.map((field) => [field, 1]));
  }
  return Booking.findByIdAndUpdate(id, update, {
    returnDocument: 'after',
    runValidators: true,
  });
}

export async function deleteBookingById(id: string) {
  return Booking.findByIdAndDelete(id);
}

export async function markAssignmentEmailSent(id: string) {
  return Booking.findByIdAndUpdate(id, { assignmentEmailSent: true });
}

export async function updateBookingFields(
  id: string,
  fields: Record<string, unknown>
) {
  return Booking.findByIdAndUpdate(id, { $set: fields });
}

export async function findRecentDuplicateBooking(input: {
  email: string;
  phone: string;
  pickup: string;
  date: string;
  time: string;
}) {
  const twoMinutesAgo = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  return Booking.findOne({
    email: input.email,
    phone: input.phone,
    pickup: input.pickup,
    date: input.date,
    time: input.time,
    createdAt: { $gte: twoMinutesAgo },
  });
}

export async function createBookingDocument(bookingData: object) {
  return Booking.create(bookingData);
}
