import { chromium } from "playwright";

const url = process.env.URL ?? "http://localhost:3001";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.getByRole("button", { name: "Login using your Atlys account" }).click({ force: true });
await page.waitForTimeout(900);
await page.screenshot({ path: ".scratch/atlys-1.png" });
await page.waitForTimeout(2000);
await page.screenshot({ path: ".scratch/atlys-2.png" });
await page.waitForTimeout(2200);
await page.screenshot({ path: ".scratch/atlys-3.png" });
await page.getByRole("button", { name: "Access via Atlys" }).click({ force: true });
await page.waitForTimeout(900);
await page.screenshot({ path: ".scratch/atlys-4.png" });
await page.waitForTimeout(1600);
await page.screenshot({ path: ".scratch/atlys-5.png" });
console.log("atlys flow complete");
await browser.close();
