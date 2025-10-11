interface BookingData {
  pickup: string;
  dropoff: string;
  tripType: string;
  date: string;
  time: string;
  passengers: number;
  selectedVehicle: string;
  childSeats: number;
  babySeats: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export async function sendOrderCancellationEmail(bookingData: BookingData) {
  // Implement email sending logic for cancellation

  console.log("Sending cancellation email to user:", bookingData.email);

  return true;
}