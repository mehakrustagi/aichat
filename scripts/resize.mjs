import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
await page.waitForTimeout(1100);
await page.getByRole("button", { name: "Login using your Atlys account" }).click({ force: true });
await page.waitForTimeout(7600);                         // through both working stages
await page.screenshot({ path: ".scratch/r-0.png" });     // confirm, full height
await page.getByRole("button", { name: "Access via Atlys" }).click({ force: true });
for (const [n, at] of [120, 300, 520, 900].entries()) {
  await page.waitForTimeout(n === 0 ? at : 0);
  await page.screenshot({ path: `.scratch/r-${n + 1}.png` });
  if (n < 3) await page.waitForTimeout([120, 300, 520, 900][n + 1] - [120, 300, 520, 900][n]);
}
console.log("ok");
await browser.close();
