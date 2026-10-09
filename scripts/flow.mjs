import { chromium } from "playwright";

/* Walks the sign-in flow and captures each state. */
const url = process.env.URL ?? "http://localhost:3001";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (m) => m.type() === "error" && console.log("[console]", m.text()));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const shot = async (name) => page.screenshot({ path: `.scratch/flow-${name}.png` });

await shot("1-idle");

// focus the phone field
await page.getByLabel("Phone number").click();
await page.waitForTimeout(700);
await shot("2-focused");

// type a number on our own pad
for (const d of "9876543210") await page.getByRole("button", { name: d, exact: true }).first().click();
await page.waitForTimeout(500);
await shot("3-typed");

await page.getByRole("button", { name: "Continue", exact: true }).click();
await page.waitForTimeout(700);
await shot("4-otp");

// three digits -> silver linings
for (const d of "123") await page.getByRole("button", { name: d, exact: true }).first().click();
await page.waitForTimeout(400);
await shot("5-silver");

// the last three -> green, merge, check
for (const d of "456") await page.getByRole("button", { name: d, exact: true }).first().click();
await page.waitForTimeout(250);
await shot("6-green");
await page.waitForTimeout(500);
await shot("7-merging");
await page.waitForTimeout(600);
await shot("8-check");
await page.waitForTimeout(700);
await shot("9-verified");
await page.waitForTimeout(1200);
await shot("10-end");

console.log("flow complete");
await browser.close();
