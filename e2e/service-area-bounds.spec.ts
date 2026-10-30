import { expect, test } from "@playwright/test";

// Service area: draw a polygon in Settings → Map, save, reload, then clear and save.
test("service area bounds save, reload and clear", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop only");
  test.skip(!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, "needs a Google Maps key");
  test.setTimeout(240_000);
  await page.goto("/en/dashboard/signin", { timeout: 180_000 });
  await page.locator("#email").fill("admin@e2e.example");
  await page.locator("#password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.includes("signin"));
  await page.goto("/en/dashboard/settings/map");
  const map = page.locator(".gm-style").first();
  await expect(map).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(2000);

  await page.getByRole("button", { name: "Draw service area" }).click();
  const b = (await map.boundingBox())!;
  for (const [x, y] of [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7], [0.3, 0.3]]) {
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
    await page.waitForTimeout(300);
  }
  await expect(page.getByRole("button", { name: "Draw service area" })).toBeVisible();

  const save = () =>
    Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/settings") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Save", exact: true }).first().click(),
    ]).then(([r]) => r);

  const saved = await save();
  expect(saved.status()).toBe(200);
  const sent = JSON.parse(saved.request().postData() || "{}");
  expect(sent.mapPolygonPoints).toHaveLength(4);

  const stored = await (await page.request.get("/api/settings?scope=full")).json();
  expect(stored.data.mapPolygonPoints).toHaveLength(4);
  expect(stored.data.mapBounds.north).toBeGreaterThan(stored.data.mapBounds.south);
  await page.screenshot({ path: "/workspace/shots/bounds-saved.png" });

  await page.reload();
  await expect(page.getByText("Current bounds")).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: "Clear bounds" }).click();
  const cleared = await save();
  expect(cleared.status()).toBe(200);
  const after = await (await page.request.get("/api/settings?scope=full")).json();
  expect(after.data.mapPolygonPoints).toEqual([]);
  expect(after.data.mapBounds ?? null).toBeNull();
});
