import { describe, expect, it } from "vitest";

import {
  jidMatches,
  normaliseJid,
  resolveJidAliases,
  resolvePhoneJid,
} from "@/features/settings/lib/whatsapp-jid";

const lidSock = {
  signalRepository: {
    lidMapping: {
      getPNForLID: async (lid: string) => (lid === "999@lid" ? "14155552671@s.whatsapp.net" : null),
      getLIDForPN: async (pn: string) =>
        pn === "14155552671@s.whatsapp.net" ? "999@lid" : null,
    },
  },
};

describe("WhatsApp JIDs", () => {
  it("drops device suffixes and keeps the server part", () => {
    expect(normaliseJid("14155552671:12@s.whatsapp.net")).toBe(
      "14155552671@s.whatsapp.net",
    );
    expect(normaliseJid("999:3@lid")).toBe("999@lid");
    expect(jidMatches("14155552671:12@s.whatsapp.net", "14155552671@s.whatsapp.net")).toBe(true);
  });

  it("resolves a LID to the phone JID when the mapping is available", async () => {
    await expect(resolvePhoneJid(lidSock, "999:4@lid")).resolves.toBe(
      "14155552671@s.whatsapp.net",
    );
    await expect(resolvePhoneJid(lidSock, "14155552671@s.whatsapp.net")).resolves.toBe(
      "14155552671@s.whatsapp.net",
    );
  });

  it("collects phone and LID aliases for matching results", async () => {
    await expect(resolveJidAliases(lidSock, "999@lid")).resolves.toEqual(
      expect.arrayContaining(["999@lid", "14155552671@s.whatsapp.net"]),
    );
    await expect(resolveJidAliases(lidSock, "14155552671@s.whatsapp.net")).resolves.toEqual(
      expect.arrayContaining(["14155552671@s.whatsapp.net", "999@lid"]),
    );
  });

  it("stays on the phone JID when the socket has no LID mapping", async () => {
    await expect(resolvePhoneJid({}, "999@lid")).resolves.toBe("999@lid");
    await expect(resolveJidAliases({}, "999@lid")).resolves.toEqual(["999@lid"]);
  });
});
