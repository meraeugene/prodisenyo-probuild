const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { build } = require("esbuild");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const { chromium } = require("@playwright/test");

async function main() {
  const bundle = await build({ entryPoints: ["tests/ceo/uiHarness.tsx"], bundle: true, write: false, outdir: "out", platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, plugins: [require("./browserAdapters.cjs")] });
  const js = bundle.outputFiles.find((file) => file.path.endsWith(".js")).text;
  const modulesCss = bundle.outputFiles.find((file) => file.path.endsWith(".css"))?.text || "";
  const css = (await postcss([tailwind("tailwind.config.ts")]).process(fs.readFileSync("app/globals.css", "utf8"), { from: undefined })).css + fs.readFileSync("app/workspace.css", "utf8") + modulesCss;
  const server = http.createServer((request, response) => {
    if (request.url === "/bundle.js") { response.setHeader("Content-Type", "application/javascript"); response.end(js); }
    else if (request.url === "/styles.css") { response.setHeader("Content-Type", "text/css"); response.end(css); }
    else if (request.url.startsWith("/prodisenyo-building-mark.png")) { response.setHeader("Content-Type", "image/png"); response.end(fs.readFileSync("public/prodisenyo-building-mark.png")); }
    else { response.setHeader("Content-Type", "text/html"); response.end('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/styles.css"/></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'); }
  });
  let browser;
  const screenshots = path.resolve("tmp/design-preview");
  fs.mkdirSync(screenshots, { recursive: true });
  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const edgeInstalled = process.platform === "win32" && fs.existsSync("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe");
    browser = await chromium.launch({ headless: true, ...(edgeInstalled ? { channel: "msedge" } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.goto(`${base}/projects`);
    const list = page.getByRole("region", { name: "Project list", exact: true });
    await list.locator("tbody tr").first().waitFor();
    assert.equal(await list.locator("tbody tr").count(), 10);
    await list.getByRole("button", { name: "Next page", exact: true }).click();
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Project table pages"] [aria-current="page"]')?.textContent === "2");
    await list.getByRole("searchbox", { name: "Search projects" }).fill("Harbor");
    await page.waitForFunction(() => document.querySelectorAll('section[aria-label="Project list"] tbody tr').length === 1);
    await list.getByRole("button", { name: "Reset filters" }).click();
    assert.equal(await list.getByRole("button", { name: "Page 1", exact: true }).getAttribute("aria-current"), "page");
    await list.getByRole("combobox", { name: "Project table rows per page" }).selectOption("25");
    assert.equal(await list.locator("tbody tr").count(), 25);
    await list.getByRole("button", { name: "Last", exact: true }).click();
    assert.equal(await list.locator("tbody tr").count(), 3);
    await page.evaluate(() => window.dispatchEvent(new Event("shrink-projects")));
    assert.equal(await list.getByRole("button", { name: "Page 1", exact: true }).getAttribute("aria-current"), "page");
    await page.goto(`${base}/projects`);
    await list.getByRole("button", { name: "Sort by Budget", exact: true }).click();
    assert.equal((await list.locator("tbody tr").first().locator("th").innerText()).replace(/\s+/g, " "), "Project 28 PRJ-PROJECT-");
    await list.getByRole("button", { name: "View Project 28", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__openedProject), "project-28");
    await page.screenshot({ path: path.join(screenshots, "ceo-projects-desktop.png"), fullPage: true });
    await page.goto(`${base}/gmea-projects`);
    const gmea = page.getByRole("region", { name: "Projects", exact: true });
    await gmea.locator("tbody tr").first().waitFor();
    await gmea.getByRole("button", { name: /All Projects/ }).click();
    assert.equal(await gmea.locator("tbody tr").count(), 10);
    const total = await gmea.locator("tfoot").innerText();
    await gmea.getByRole("button", { name: "Next page", exact: true }).click();
    assert.equal(await gmea.locator("tfoot").innerText(), total);
    await gmea.getByRole("combobox", { name: "Filter projects", exact: true }).selectOption("client:Green Energy Co.");
    assert.equal(await gmea.getByRole("button", { name: "Page 1", exact: true }).getAttribute("aria-current"), "page");
    assert.match(await gmea.locator("tfoot").innerText(), /14 projects/);
    await page.screenshot({ path: path.join(screenshots, "ceo-gmea-desktop.png"), fullPage: true });
    await page.goto(`${base}/gmea-rentals`);
    const rentalList = page.getByRole("region", { name: "Rental and equipment records" });
    await rentalList.getByRole("button", { name: "Equipment 28", exact: true }).click();
    await rentalList.getByRole("combobox", { name: "Filter equipment by status" }).selectOption("available");
    assert.equal(await rentalList.locator("tbody tr").count(), 10);
    assert.match(await rentalList.innerText(), /of 14 units/);
    await rentalList.getByRole("button", { name: "Rentals 28", exact: true }).click();
    await rentalList.getByRole("searchbox", { name: "Search rentals" }).fill("Harbor");
    assert.equal(await rentalList.locator("tbody tr").count(), 1);
    await rentalList.getByRole("button", { name: "Reset filters" }).click();
    await page.screenshot({ path: path.join(screenshots, "ceo-rentals-desktop.png"), fullPage: true });
    await page.goto(`${base}/dashboard`);
    await page.getByRole("heading", { name: "Executive dashboard", exact: true }).waitFor();
    await page.screenshot({ path: path.join(screenshots, "ceo-dashboard-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["projects", "gmea-projects", "gmea-rentals", "dashboard", "overtime-approvals"]) {
      await page.goto(`${base}/${route}`);
      await page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${route} mobile horizontal overflow`);
      await page.screenshot({ path: path.join(screenshots, `ceo-${route}-mobile.png`), fullPage: true });
    }
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    assert.equal(await page.getByRole("dialog", { name: "Workspace sidebar" }).isVisible(), true);
    await page.getByRole("button", { name: "Close navigation", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`${base}/overtime-approvals`);
    await page.getByRole("tab", { name: /^Staff requests/ }).click();
    const staff = page.getByRole("region", { name: "Staff overtime approvals" });
    await staff.getByRole("button", { name: /^Pending/ }).click();
    assert.match(await staff.innerText(), /of 14 requests/);
    await staff.getByRole("button", { name: "Approve request", exact: true }).first().click();
    await page.waitForFunction(() => !!window.__approvedRequest);
    assert.match(await staff.innerText(), /of 13 requests/);
    await staff.getByRole("button", { name: "Return", exact: true }).first().click();
    await page.getByPlaceholder("Add an optional return note.").fill("Please check the hours");
    await page.getByRole("button", { name: "Confirm Return", exact: true }).click();
    await page.waitForFunction(() => !!window.__returnedRequest);
    assert.equal(await page.evaluate(() => window.__returnedRequest.rejectionReason), "Please check the hours");
    assert.match(await staff.innerText(), /of 12 requests/);
    const adjustments = page.getByRole("region", { name: "Payroll overtime adjustments" });
    await page.getByRole("tab", { name: /^Payroll adjustments/ }).click();
    await adjustments.getByRole("searchbox", { name: "Search payroll adjustments" }).fill("Juan Santos");
    assert.match(await adjustments.innerText(), /of 1 requests/);
    await page.screenshot({ path: path.join(screenshots, "ceo-approvals-desktop.png"), fullPage: true });
    await page.goto(`${base}/projects?role=engineer`);
    assert.equal(await page.getByText("Executive workspace", { exact: true }).count(), 0);
    assert.equal(await page.locator('nav[aria-label="Main navigation"] a[aria-current="page"]').evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(234, 245, 243)");
    assert.deepEqual(errors, []);
    console.log("CEO browser checks passed: search, filters, sorting, pagination, live row shrink, totals, links, role styling, and mobile navigation. Screenshots: tmp/design-preview/");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
