type LidMapping = {
  getPNForLID?: (lid: string) => Promise<string | null>;
  getLIDForPN?: (pn: string) => Promise<string | null>;
};

type SocketWithLidMapping = {
  signalRepository?: { lidMapping?: LidMapping };
};

/** Drop a `:12` device suffix while keeping the server part (`@s.whatsapp.net`, `@lid`). */
export function normaliseJid(jid: string): string {
  const trimmed = jid.trim();
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed.split(":")[0] ?? trimmed;
  const user = trimmed.slice(0, at).split(":")[0] ?? "";
  return `${user}${trimmed.slice(at)}`;
}

export function jidMatches(left: string, right: string) {
  return normaliseJid(left) === normaliseJid(right);
}

function lidMappingFor(sock: unknown): LidMapping | null {
  const mapping = (sock as SocketWithLidMapping | null)?.signalRepository?.lidMapping;
  return mapping ?? null;
}

/** Resolve a LID (or device-suffixed JID) to the phone JID Baileys can address. */
export async function resolvePhoneJid(sock: unknown, jid: string): Promise<string> {
  const normal = normaliseJid(jid);
  if (!normal.endsWith("@lid")) return normal;

  const mapping = lidMappingFor(sock);
  if (!mapping?.getPNForLID) return normal;
  try {
    const phone = await mapping.getPNForLID(normal);
    return phone ? normaliseJid(phone) : normal;
  } catch {
    return normal;
  }
}

/** Every JID known for one recipient, so send results and receipts can be matched. */
export async function resolveJidAliases(sock: unknown, jid: string): Promise<string[]> {
  const normal = normaliseJid(jid);
  const aliases = new Set([normal]);
  const mapping = lidMappingFor(sock);
  if (!mapping) return [...aliases];

  try {
    if (normal.endsWith("@lid") && mapping.getPNForLID) {
      const phone = await mapping.getPNForLID(normal);
      if (phone) aliases.add(normaliseJid(phone));
    }
    if (normal.endsWith("@s.whatsapp.net") && mapping.getLIDForPN) {
      const lid = await mapping.getLIDForPN(normal);
      if (lid) aliases.add(normaliseJid(lid));
    }
  } catch {
    return [...aliases];
  }
  return [...aliases];
}
