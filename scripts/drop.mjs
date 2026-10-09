import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const clip = { x: 0, y: 0, width: 880, height: 760 };
await page.screenshot({ path: ".scratch/drop-0.png", clip });

await page.getByLabel("Phone number").click();
await page.waitForTimeout(900);
await page.screenshot({ path: ".scratch/drop-1.png", clip });

for (const [n, chunk] of ["9", "8", "7", "6", "5", "4", "3", "2", "1", "0"].entries()) {
  for (const d of chunk) await page.getByRole("button", { name: d, exact: true }).first().click();
  await page.waitForTimeout(420);
  await page.screenshot({ path: `.scratch/drop-${n + 2}.png`, clip });
}
console.log("ok");
await browser.close();
