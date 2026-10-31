import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/qa/outbox/route";
import { clearQaMail, pushQaMail } from "@/features/settings/lib/email-outbox";

function outboxRequest(key: string) {
  return new Request("http://local/api/qa/outbox", {
    headers: { "x-qa-key": key },
  });
}

afterEach(() => {
  delete process.env.QA_MOCK_EMAIL;
  delete process.env.CRON_SECRET;
  clearQaMail();
});

describe("qa mail outbox", () => {
  it("exposes the rendered text of mocked mail", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    process.env.CRON_SECRET = "qa-key";
    pushQaMail({
      to: "ada@example.com",
      subject: "Your sign-in code",
      text: "Use 123456 to sign in.",
      html: "<p>Use 123456 to sign in.</p>",
    });

    const response = await GET(outboxRequest("qa-key"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      mail: [
        {
          to: "ada@example.com",
          subject: "Your sign-in code",
          text: "Use 123456 to sign in.",
          attachments: [],
        },
      ],
      whatsapp: [],
    });
  });

  it("rejects a caller without the qa key", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    process.env.CRON_SECRET = "qa-key";

    const response = await GET(outboxRequest("wrong"));
    expect(response.status).toBe(401);
  });
});
