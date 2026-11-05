export type CalendarRide = {
  _id: string;
  tripId: string;
  date: string;
  time: string;
  pickup: string;
  dropoff?: string;
  status?: string;
  bookingType?: string;
  duration?: number;
  passengers?: number;
  flightNumber?: string;
  vehicleDetails?: { name?: string; seats?: string };
  assignedDriver?: { name?: string };
  assignedPartner?: { name?: string };
  driverRideStatus?: string;
};

export type CalendarTimeOff = {
  _id: string;
  startsAt: string;
  endsAt: string;
  note?: string;
};
