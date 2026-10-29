import mongoose from "mongoose";

type LegacySetting = { [key: string]: unknown };

type LegacyTemplate = {
  event: string;
  audience: "customer" | "desk";
  locale: string;
  body: string;
  enabled?: boolean;
};

const TOGGLE_ROWS = [
  { field: "whatsappTplAssigned", event: "ride_assigned", audiences: ["driver", "partner"] },
  { field: "whatsappTplAvailable", event: "ride_available", audiences: ["driver", "partner"] },
  { field: "whatsappTplChanged", event: "ride_changed", audiences: ["driver", "partner"] },
  { field: "whatsappTplChanged", event: "ride_cancelled", audiences: ["driver", "partner"] },
  { field: "whatsappTplReminder", event: "pickup_reminder", audiences: ["driver", "partner"] },
  { field: "whatsappTplSettlement", event: "partner_settlement", audiences: ["partner"] },
] as const;

function settingKey(event: string, audience: string) {
  return `${event}:${audience}`;
}

export async function migrateNotifications(
  db: NonNullable<typeof mongoose.connection.db>,
  setting: LegacySetting | null,
  dryRun: boolean,
) {
  const collection = db.collection("notificationsettings");
  const existing = await collection
    .find({ channel: "whatsapp" }, { projection: { event: 1, audience: 1 } })
    .toArray();
  const present = new Set(
    existing.map((row) => settingKey(String(row.event), String(row.audience))),
  );

  const templates = await db.collection<LegacyTemplate>("whatsapptemplates").find({}).toArray();
  const grouped = new Map<
    string,
    { event: string; audience: string; enabled: boolean; templates: Record<string, { body: string }> }
  >();
  for (const template of templates) {
    if (template.audience !== "customer" && template.audience !== "desk") continue;
    const key = settingKey(template.event, template.audience);
    if (present.has(key)) continue;
    const entry = grouped.get(key) ?? {
      event: template.event,
      audience: template.audience,
      enabled: false,
      templates: {},
    };
    entry.enabled = entry.enabled || Boolean(template.enabled);
    entry.templates[template.locale] = { body: template.body };
    grouped.set(key, entry);
  }

  const toggleRows: Array<{ event: string; audience: string }> = [];
  for (const toggle of TOGGLE_ROWS) {
    if (!setting?.[toggle.field]) continue;
    for (const audience of toggle.audiences) {
      if (present.has(settingKey(toggle.event, audience))) continue;
      toggleRows.push({ event: toggle.event, audience });
    }
  }

  if (!dryRun) {
    const now = new Date();
    for (const entry of grouped.values()) {
      await collection.updateOne(
        { event: entry.event, channel: "whatsapp", audience: entry.audience },
        {
          $setOnInsert: {
            event: entry.event,
            channel: "whatsapp",
            audience: entry.audience,
            enabled: entry.enabled,
            templates: entry.templates,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );
    }
    if (toggleRows.length > 0) {
      await collection
        .insertMany(
          toggleRows.map((row) => ({
            event: row.event,
            channel: "whatsapp",
            audience: row.audience,
            enabled: true,
            templates: {},
            createdAt: now,
            updatedAt: now,
          })),
          { ordered: false },
        )
        .catch((error: unknown) => {
          if ((error as { code?: number }).code !== 11000) throw error;
        });
    }
  }

  return {
    notificationTemplates: grouped.size,
    notificationToggles: toggleRows.length,
  };
}
