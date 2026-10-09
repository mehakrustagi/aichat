import { chromium } from "playwright";

/* Fires the verify sequence and samples it densely, so the deck collect can
   be judged frame by frame rather than from its endpoints. */
const url = process.env.URL ?? "http://localhost:3001";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

await page.getByLabel("Phone number").click();
await page.waitForTimeout(500);
for (const d of "9876543210") await page.getByRole("button", { name: d, exact: true }).first().click();
await page.getByRole("button", { name: "Continue", exact: true }).click({ force: true });
await page.waitForTimeout(700);

// five digits first, so the sixth starts the sequence cleanly
for (const d of "12345") await page.getByRole("button", { name: d, exact: true }).first().click();
await page.waitForTimeout(300);

const clip = process.env.TIGHT
  ? { x: 150, y: 400, width: 140, height: 130 }
  : { x: 20, y: 380, width: 400, height: 170 };
await page.screenshot({ path: ".scratch/otp-00.png", clip });

const t0 = Date.now();
await page.getByRole("button", { name: "6", exact: true }).first().click();
const marks = (process.env.MARKS ?? '120,260,380,500,640,820,980,1120,1300,1700').split(',').map(Number);
for (const [n, at] of marks.entries()) {
  const wait = at - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `.scratch/otp-${String(n + 1).padStart(2, "0")}.png`, clip });
}
console.log("sampled");
await browser.close();
