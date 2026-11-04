import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const SHOTS = "/workspace/shots";
const QA = join(SHOTS, "qa");
const COLUMNS = 6;
const PER_SHEET = 24;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

mkdirSync(QA, { recursive: true });

const files = readdirSync(QA)
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.log(`No PNGs in ${QA}; nothing to tile.`);
  process.exit(0);
}

const sheets = [];
for (let index = 0; index < files.length; index += PER_SHEET) {
  sheets.push(files.slice(index, index + PER_SHEET));
}

for (const stale of readdirSync(SHOTS).filter((file) => /^qa-matrix-\d+\.png$/.test(file))) {
  rmSync(join(SHOTS, stale));
}

const tileWidth = 360;
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: COLUMNS * (tileWidth + 16) + 48, height: 900 },
  deviceScaleFactor: 1,
});

try {
  for (let index = 0; index < sheets.length; index += 1) {
    const tiles = sheets[index]
      .map((file) => {
        const data = readFileSync(join(QA, file)).toString("base64");
        const name = escapeHtml(file);
        return `<figure><img src="data:image/png;base64,${data}" alt="${name}"><figcaption>${name}</figcaption></figure>`;
      })
      .join("");

    await page.setContent(
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: #ffffff; color: #111111; font: 13px/1.4 ui-sans-serif, system-ui, sans-serif; }
    h1 { margin: 0 0 16px; font-size: 18px; }
    main { display: grid; grid-template-columns: repeat(${COLUMNS}, ${tileWidth}px); gap: 16px; }
    figure { margin: 0; border: 1px solid #d4d4d4; border-radius: 6px; overflow: hidden; background: #fafafa; }
    img { display: block; width: 100%; height: 240px; object-fit: contain; background: #f0f0f0; }
    figcaption { padding: 6px 8px; font-size: 12px; word-break: break-all; border-top: 1px solid #e5e5e5; }
    header { display: flex; justify-content: space-between; align-items: baseline; }
    header span { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <header><h1>QA matrix contact sheet ${index + 1}</h1><span>${files.length} screenshots · ${sheets[index].length} tiles</span></header>
  <main>${tiles}</main>
</body>
</html>`,
      { waitUntil: "load" },
    );

    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map((image) =>
          image.complete
            ? null
            : new Promise((resolve) => {
                image.addEventListener("load", () => resolve(null), { once: true });
                image.addEventListener("error", () => resolve(null), { once: true });
              }),
        ),
      );
    });

    const output = join(SHOTS, `qa-matrix-${index + 1}.png`);
    await page.screenshot({ path: output, fullPage: true });
    console.log(output);
  }
} finally {
  await browser.close();
}
