import { Section, Text } from "@react-email/components";
import type { EmailTranslator, EmailTrip } from "@/features/emails/types";
import { emailTokens } from "@/features/emails/ui/tokens";

function rows(trip: EmailTrip, t: EmailTranslator) {
  const list: Array<{ label: string; value: string }> = [
    { label: t("reference"), value: `#${trip.tripId}` },
    { label: t("pickup"), value: trip.pickup },
    ...(trip.stops ?? []).map((stop, index) => ({
      label: t("stop", { number: index + 1 }),
      value: stop.location,
    })),
  ];
  if (trip.bookingType === "hourly") {
    if (trip.duration) {
      list.push({
        label: t("duration"),
        value: t("hours", { count: trip.duration }),
      });
    }
  } else if (trip.dropoff) {
    list.push({ label: t("dropoff"), value: trip.dropoff });
  }
  list.push({
    label: t("date_time"),
    value: `${trip.date} · ${trip.time}`,
  });
  if (trip.returnDate) {
    list.push({
      label: t("return"),
      value: `${trip.returnDate} · ${trip.returnTime ?? ""}`.trim(),
    });
  }
  if (trip.vehicle) list.push({ label: t("vehicle"), value: trip.vehicle });
  if (trip.flightNumber) list.push({ label: t("flight"), value: trip.flightNumber });
  if (trip.passengers !== undefined && trip.passengers !== null && trip.passengers !== "") {
    list.push({ label: t("passengers"), value: String(trip.passengers) });
  }
  if (trip.childSeats) {
    list.push({ label: t("child_seats"), value: String(trip.childSeats) });
  }
  if (trip.babySeats) {
    list.push({ label: t("baby_seats"), value: String(trip.babySeats) });
  }
  return list;
}

export function TripCard({ trip, t }: { trip: EmailTrip; t: EmailTranslator }) {
  const details = rows(trip, t);
  return (
    <Section
      style={{
        margin: "0 0 18px",
        padding: "16px",
        backgroundColor: emailTokens.subtle,
        border: `1px solid ${emailTokens.border}`,
        borderRadius: 8,
      }}
    >
      <Text
        style={{
          margin: "0 0 10px",
          fontFamily: emailTokens.font,
          fontSize: 16,
          fontWeight: 700,
          lineHeight: "22px",
          color: emailTokens.text,
        }}
      >
        {t("trip_details")}
      </Text>
      <table
        role="presentation"
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          {details.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <td
                style={{
                  padding: "4px 12px 4px 0",
                  width: "34%",
                  verticalAlign: "top",
                  fontFamily: emailTokens.font,
                  fontSize: 14,
                  lineHeight: "20px",
                  color: emailTokens.muted,
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  padding: "4px 0",
                  verticalAlign: "top",
                  fontFamily: emailTokens.font,
                  fontSize: 15,
                  lineHeight: "21px",
                  color: emailTokens.text,
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
