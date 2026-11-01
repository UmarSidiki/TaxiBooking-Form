import { Link, Section, Text } from "@react-email/components";
import type { EmailTranslator } from "@/features/emails/types";
import { emailTokens } from "@/features/emails/ui/tokens";
import { formatCoords, type RideLocation } from "@/features/rides/lib/ride-locations";

function labelOf(place: RideLocation, t: EmailTranslator) {
  if (place.kind === "stop") return t("stop", { number: place.number ?? 1 });
  return t(place.kind);
}

const text = { margin: 0, fontFamily: emailTokens.font, fontSize: 14, lineHeight: "20px" } as const;

export function LocationLinks({
  locations,
  t,
  color,
}: {
  locations?: RideLocation[] | null;
  t: EmailTranslator;
  color?: string;
}) {
  if (!locations?.length) return null;
  const linkStyle = { color: color || emailTokens.text, fontWeight: 600, textDecoration: "underline" };
  return (
    <Section
      data-testid="email-location-links"
      style={{ margin: "0 0 18px", padding: "16px", border: `1px solid ${emailTokens.border}`, borderRadius: 8 }}
    >
      <Text style={{ ...text, marginBottom: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: emailTokens.muted }}>
        {t("map_links")}
      </Text>
      {locations.map((place, index) => (
        <Section
          key={`${place.kind}-${index}`}
          style={{ padding: "8px 0", borderTop: index > 0 ? `1px solid ${emailTokens.border}` : undefined }}
        >
          <Text style={{ ...text, color: emailTokens.muted }}>{labelOf(place, t)}</Text>
          <Text style={{ ...text, fontSize: 16, color: emailTokens.text }}>{place.address}</Text>
          {place.coords ? (
            <Text style={{ ...text, fontFamily: "ui-monospace, Menlo, Consolas, monospace", color: emailTokens.text }}>
              {formatCoords(place.coords)}
            </Text>
          ) : null}
          <Text style={{ ...text, marginTop: 4 }}>
            <Link href={place.mapsUrl} style={linkStyle}>{t("open_in_maps")}</Link>
            {"  ·  "}
            <Link href={place.directionsUrl} style={linkStyle}>{t("navigate")}</Link>
          </Text>
        </Section>
      ))}
    </Section>
  );
}
