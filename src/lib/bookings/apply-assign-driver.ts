import { Driver } from '@/models/driver';
import type { IBooking } from '@/models/booking';
import type { BookingPatchApplyResult } from '@/lib/bookings/booking-patch-result';

export async function applyAssignDriver(
  driverId: unknown,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  if (!driverId) {
    return {
      ok: false,
      status: 400,
      message: 'Driver ID is required for assignment',
    };
  }

  const driver = await Driver.findById(driverId);
  if (!driver) {
    return { ok: false, status: 404, message: 'Driver not found' };
  }

  updateData.assignedDriver = {
    _id: driver._id.toString(),
    name: driver.name,
    email: driver.email,
  };
  updateData.assignmentEmailSent = false;

  return { ok: true, updateData };
}
