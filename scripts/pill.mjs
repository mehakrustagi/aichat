import { chromium } from "playwright";

/* Strikes "Access via Atlys" and samples the split. That pill is the one
   worth testing: tapping the login pill opens a sheet straight over it, so
   there is nothing left to photograph. */
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(process.env.URL ?? "http://localhost:3001", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.getByRole("button", { name: "Login using your Atlys account" }).click({ force: true });
// wait out the two self-advancing stages
await page.waitForTimeout(5200);

const pill = page.getByRole("button", { name: "Access via Atlys" });
const box = await pill.boundingBox();
const clip = { x: box.x - 12, y: box.y - 16, width: box.width + 24, height: box.height + 32 };
await page.screenshot({ path: ".scratch/pill-1.png", clip });

await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
await page.mouse.down();
const marks = [50, 110, 190, 300, 430];
let prev = 0;
for (const [n, at] of marks.entries()) {
  await page.waitForTimeout(at - prev);
  prev = at;
  await page.screenshot({ path: `.scratch/pill-${n + 2}.png`, clip });
}
console.log("ok");
await browser.close();
