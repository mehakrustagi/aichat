import { chromium } from "playwright";

/* Screenshot helper for refining the orbs.
 * node scripts/shot.mjs out.png            → neutral
 * node scripts/shot.mjs out.png 0.1 0.15   → pointer at 10%/15% of the viewport,
 *                                            which the hook reads as a hard tilt
 * Crops to the orb band unless FULL=1. */
const out = process.argv[2] ?? "shot.png";
const px = process.argv[3] ? Number(process.argv[3]) : null;
const py = process.argv[4] ? Number(process.argv[4]) : null;
const url = process.env.URL ?? "http://localhost:3001";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 2,
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(url, { waitUntil: "networkidle" });

if (px !== null) {
  // The desktop fallback only attaches after its sensor grace period.
  await page.waitForTimeout(1600);
  await page.mouse.move(440 * px, 956 * py);
  // let the springs arrive
  await page.waitForTimeout(2000);
} else {
  await page.waitForTimeout(2500);
}

await page.screenshot({
  path: out,
  clip: process.env.FULL ? undefined : { x: 0, y: 0, width: 440, height: 280 },
});
await browser.close();
