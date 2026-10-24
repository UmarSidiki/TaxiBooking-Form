export type RideNotice = {
  tripId: string;
  pickup: string;
  date: string;
  time: string;
};

export function assignedText(ride: RideNotice) {
  return `Ride ${ride.tripId} is assigned to you. ${ride.pickup} on ${ride.date} at ${ride.time}.`;
}

export function availableText(ride: RideNotice) {
  return `Ride ${ride.tripId} is available to claim. ${ride.pickup} on ${ride.date} at ${ride.time}.`;
}

export function changedText(ride: RideNotice) {
  return `Ride ${ride.tripId} was changed. ${ride.pickup} on ${ride.date} at ${ride.time}.`;
}

export function cancelledText(ride: RideNotice) {
  return `Ride ${ride.tripId} was cancelled. ${ride.pickup} on ${ride.date} at ${ride.time}.`;
}

export function reminderText(ride: RideNotice) {
  return `Pickup reminder: ${ride.tripId} at ${ride.pickup} on ${ride.date} at ${ride.time}.`;
}

export function settlementText(amount: number, currency: string) {
  return `A settlement of ${amount.toFixed(2)} ${currency.toUpperCase()} was recorded on your balance.`;
}

export function phoneToJid(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}
