const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { build } = require("esbuild");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const { chromium } = require("@playwright/test");
const { assertTabColors, checkSkeletonLayouts, checkLoadingLogo } = require("./designAssertions.cjs");

async function main() {
  const rentalIncomeOnly = process.argv.includes("--rental-income");
  const bundle = await build({ entryPoints: ["tests/workspace/uiHarness.tsx"], bundle: true, write: false, outdir: "out", platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, plugins: [require("./browserAdapters.cjs"), require("../ceo/browserAdapters.cjs")] });
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
    const scenarios = rentalIncomeOnly ? [] : [
      ["payroll", "Payroll workspace", "Payroll records", "Search payrolls", /All payrolls/, "Payroll table rows per page"],
      ["admin", "Administration workspace", null, "Search users", /All accounts/, "User directory rows per page"],
      ["employee", "Employee workspace", "Your overtime requests", "Search requests", /All requests/, "Overtime history rows per page"],
      ["purchaser", "Purchasing workspace", "Purchasing records", "Search purchases", /All purchases/, "Purchasing table rows per page"],
      ["gmea-projects", "GMEA workspace", "GMEA project records", "Search projects", /All projects/, "GMEA project table rows per page"],
      ["gmea-rentals", "GMEA workspace", "Rental and equipment records", "Search rentals", /Rental Bookings 28/, "Rental workspace rows per page"],
    ];
    for (const [route, title, region, search, allTab, size] of scenarios) {
      await page.goto(`${base}/${route}`);
      await page.getByText(title, { exact: true }).waitFor();
      const sidebarHeader = await page.locator("[data-sidebar-header]").boundingBox();
      const mainHeader = await page.locator("[data-workspace-header]").boundingBox();
      assert.equal(sidebarHeader.height, mainHeader.height, `${route} sidebar and main header heights match`);
      assert.equal(sidebarHeader.y + sidebarHeader.height, mainHeader.y + mainHeader.height, `${route} header edges align`);
      if (route.startsWith("gmea")) assert.equal(await page.getByRole("link", { name: "Projects Expenses", exact: true }).count(), 1);
      const list = region ? page.getByRole("region", { name: region, exact: true }) : page.locator("#dashboard-content section").first();
      await list.getByRole("button", { name: allTab }).click();
      await list.locator("tbody tr").first().waitFor();
      await assertTabColors(page);
      assert.equal(await list.locator("tbody tr").count(), 10, `${route} initial page size`);
      await list.getByRole("button", { name: "Next page", exact: true }).click();
      assert.equal(await list.getByRole("button", { name: "Page 2", exact: true }).getAttribute("aria-current"), "page");
      await list.getByRole("searchbox", { name: search, exact: true }).fill(route === "employee" ? "Juan Santos" : "Harbor");
      assert.equal(await list.locator("tbody tr").count(), 1, `${route} search`);
      assert.equal(await list.getByRole("button", { name: "Page 1", exact: true }).getAttribute("aria-current"), "page", `${route} filter resets page`);
      await list.getByRole("button", { name: "Reset filters" }).click();
      await list.getByRole("button", { name: allTab }).click();
      await list.getByRole("combobox", { name: size }).selectOption("25");
      assert.equal(await list.locator("tbody tr").count(), 25, `${route} page size`);
      await list.getByRole("button", { name: "Last", exact: true }).click();
      await page.waitForFunction((label) => document.querySelector(`nav[aria-label="${label}"] [aria-current="page"]`)?.textContent === "2", size.replace("rows per page", "pages"));
      assert.equal(await list.locator("tbody tr").count(), 3, `${route} last page`);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator("#dashboard-content").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(245, 246, 248)");
      assert.equal(await list.getByRole("button", { name: "Page 2", exact: true }).evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(7, 109, 105)", `${route} selected pagination color`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${route} mobile horizontal overflow`);
      await page.setViewportSize({ width: 1440, height: 1100 });
    }
    if (!rentalIncomeOnly) {
    await page.goto(`${base}/purchaser`);
    const purchaseList = page.getByRole("region", { name: "Purchasing records", exact: true });
    await purchaseList.getByRole("button", { name: /^Ordered/ }).click();
    assert.match(await purchaseList.innerText(), /of 14 purchases/);
    await purchaseList.getByRole("combobox", { name: "Delivery", exact: true }).selectOption("delivered");
    assert.equal(await purchaseList.locator("tbody tr").count(), 0);
    await purchaseList.getByRole("button", { name: "Reset filters" }).click();
    await page.getByRole("button", { name: /Edit purchase details for/ }).first().click();
    await page.getByRole("heading", { name: "Update purchase" }).waitFor();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.goto(`${base}/admin`);
    await page.getByRole("button", { name: /^Inactive/ }).click();
    await page.getByRole("combobox", { name: "Filter users by role" }).selectOption("employee");
    assert.match(await page.locator("#dashboard-content").innerText(), /of 5 accounts/);
    await page.getByRole("button", { name: "Reset filters" }).click();
    await page.getByRole("button", { name: "Open actions for Harbor User", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Delete user", exact: true }).isDisabled(), true);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Add user", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("heading", { name: "Add a new user", exact: true }).waitFor();
    }
    await page.goto(`${base}/gmea-rentals`);
    const income = page.getByRole("region", { name: "Rental income workspace", exact: true });
    await income.getByRole("heading", { name: "Monthly rental income", exact: true }).waitFor();
    assert.equal(await income.getByLabel("Income month", { exact: true }).inputValue(), "2026-05");
    assert.match(await income.getByRole("region", { name: "Monthly rental income totals" }).innerText(), /18,000/);
    await income.getByLabel("Income month",{exact:true}).fill("2026-04");
    assert.match(await income.getByRole("region", { name: "Monthly rental income totals" }).innerText(), /10,000/);
    await income.getByLabel("Income month",{exact:true}).fill("2026-05");
    assert.match(await income.innerText(), /Down Payment collected/);
    assert.match(await income.innerText(), /Full Payment collected/);
    assert.doesNotMatch(await income.innerText(), /\b(DP|FP)\b/);
    await income.getByRole("button", {name:/^Needs review/}).click();
    assert.match(await income.innerText(), /Held: Full Payment/);
    assert.match(await income.innerText(), /Payment date unconfirmed/);
    await income.getByText("Original Excel rows",{exact:true}).click();
    assert.match(await income.locator("tbody").innerText(), /9,?000/);
    assert.equal(await income.locator('a[href*="historical-1"]').count(),0);
    await income.getByRole("button", { name: "Companies", exact: true }).click();
    assert.equal(await income.locator("tbody tr").count(), 2);
    await income.getByRole("button", { name: "Harbor Logistics", exact: true }).click();
    await income.getByRole("heading", { name: "Rental income transactions", exact: true }).waitFor();
    assert.equal(await income.locator("tbody tr").count(), 1);
    assert.match(await income.locator("tbody").innerText(), /10,000/);
    await income.getByRole("button", { name: "Clear income filters", exact: true }).click();
    assert.equal(await income.locator("tbody tr").count(), 4);
    await income.getByRole("button", { name: /^Payment history for / }).first().click();
    const paymentHistory = page.getByRole("dialog");
    await paymentHistory.waitFor();
    assert.match(await paymentHistory.innerText(), /Method: Cash/);
    await paymentHistory.getByRole("button", { name: "Close", exact: true }).click();
    await income.locator("table").evaluate(table => { table.parentElement.scrollLeft = 0; });
    await page.screenshot({ path: path.join(screenshots, "rental-income-desktop.png"), fullPage: true });
    await page.getByRole("button", { name: "Rental Expenses", exact: true }).click();
    await page.getByRole("heading", { name: "Monthly rental expenses", exact: true }).waitFor();
    await page.getByLabel("Reporting month", { exact: true }).fill("2025-04");
    await page.getByRole("button", { name: "Weekly", exact: true }).click();
    await page.getByRole("heading", { name: "Weekly rental expenses", exact: true }).waitFor();
    await page.getByRole("button", { name: "History", exact: true }).click();
    await page.getByRole("heading", { name: "Expense history", exact: true }).waitFor();
    await page.getByRole("button", { name: "Rental Income", exact: true }).click();
    assert.equal(await income.getByLabel("Income month", { exact: true }).inputValue(), "2026-05");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Income mobile overflow");
    await page.screenshot({ path: path.join(screenshots, "rental-income-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.getByRole("button", { name: "Rental Expenses", exact: true }).click();
    await page.getByRole("button", { name: "Monthly Overview", exact: true }).click();
    assert.equal(await page.getByLabel("Reporting month", { exact: true }).inputValue(), "2025-04");
    if (rentalIncomeOnly) {
      assert.deepEqual(errors, []);
      console.log("Rental income browser checks passed: monthly totals, full payment labels, company drill-down, review source rows, independent expense months, weekly/history views, and mobile layout.");
      return;
    }
    await page.getByRole("button", { name: /Equipment 28/ }).click();
    await page.getByRole("combobox", { name: "Filter equipment by status" }).selectOption("available");
    assert.match(await page.getByRole("region", { name: "Rental and equipment records" }).innerText(), /of 14 units/);
    await page.getByRole("button", { name: "Edit Excavator 01", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.goto(`${base}/gmea-projects`);
    await page.getByRole("button", { name: /^Completed/ }).click();
    assert.match(await page.getByRole("region", { name: "GMEA project records" }).innerText(), /of 7 projects/);
    await page.getByRole("button", { name: "Reset filters" }).click();
    await page.getByRole("button", { name: "Actions for GMEA-002", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.goto(`${base}/employee`);
    const history = page.getByRole("region", { name: "Your overtime requests" });
    await history.getByRole("button", { name: /^approved/ }).click();
    assert.match(await history.innerText(), /of 14 requests/);
    await page.goto(`${base}/payroll`);
    const payrollList = page.getByRole("region", { name: "Payroll records" });
    assert.equal(await payrollList.getByRole("link", { name: "Open Payroll", exact: true }).first().getAttribute("href"), "/generate-payroll?importId=import-0&runId=project-01");
    await payrollList.getByRole("button", { name: /^Awaiting CEO/ }).click();
    assert.match(await payrollList.innerText(), /of 7 payrolls/);
    await page.goto(`${base}/engineer`);
    await page.getByText("Engineering workspace", { exact: true }).first().waitFor();
    const engineeringTabs = page.getByRole("navigation", { name: "Engineering workspace sections" });
    await engineeringTabs.getByRole("button", { name: /^Materials/ }).click();
    await page.getByText("Materials workspace", { exact: true }).waitFor();
    assert.equal(await engineeringTabs.getByRole("button", { name: /^Materials/ }).getAttribute("aria-current"), "page");
    await page.goto(`${base}/gmea-project`);
    const projectTabs = page.getByRole("navigation", { name: "Project sections" });
    const expensesTab = projectTabs.getByRole("button", { name: "Expenses", exact: true });
    const editProject = page.getByRole("button", { name: "Edit project", exact: true });
    assert.deepEqual(await editProject.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color, border: getComputedStyle(element).borderTopColor, width: getComputedStyle(element).borderTopWidth })), { background: "rgb(255, 255, 255)", color: "rgb(7, 109, 105)", border: "rgb(7, 109, 105)", width: "1px" }, "Edit project has a visible teal outline");
    await expensesTab.click();
    assert.equal(await expensesTab.getAttribute("aria-current"), "page");
    await assertTabColors(page);
    await checkLoadingLogo(page, base);
    await page.goto(`${base}/skeletons`);
    await page.locator("[data-skeleton-cases]").waitFor();
    const whiteSkeletons = await page.locator("[data-skeleton-case]").evaluateAll((cases) => cases.flatMap((container) =>
      [...container.querySelectorAll("*")].filter((element) => /rgba?\(255, 255, 255(?:\)|, (?!0\)))/.test(getComputedStyle(element).backgroundColor))
        .map((element) => `${container.getAttribute("data-skeleton-case")}: ${element.tagName}.${element.className}`)));
    assert.deepEqual(whiteSkeletons, [], "All skeletons render without white container backgrounds");
    await checkSkeletonLayouts(page, base);
    await page.goto(`${base}/payroll-loading`);
    assert.equal(await page.locator("[data-workspace-list-skeleton]").count(), 1);
    const skeleton = page.getByRole("status", { name: "Loading payroll draft" });
    assert.equal(await skeleton.locator("[data-skeleton-panel]").first().evaluate((element) => getComputedStyle(element).borderWidth), "0px");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`${base}/generate-payroll`);
    const breadcrumbs = page.getByRole("navigation", { name: "Payroll workflow", exact: true });
    assert.equal(await breadcrumbs.locator("ol li").count(), 2);
    assert.equal(await breadcrumbs.getByText("Upload Attendance", { exact: true }).count(), 0);
    assert.equal(await breadcrumbs.getByRole("link", { name: "Review Attendance", exact: true }).getAttribute("href"), "/review-attendance");
    assert.equal(await breadcrumbs.getByText("Generate Payroll", { exact: true }).getAttribute("aria-current"), "page");
    const generateTabs = page.getByRole("navigation", { name: "Payroll records view" });
    const allEmployees = generateTabs.getByRole("button", { name: /^All Employees/ });
    const reviewEmployees = generateTabs.getByRole("button", { name: /^Needs Review/ });
    const period = await page.locator("[data-payroll-period]").boundingBox();
    const saveDraft = await page.getByRole("button", { name: "Save as Draft", exact: true }).boundingBox();
    assert.equal(period.height, saveDraft.height, "Payroll period and buttons use the same height");
    const panel = await page.locator("[data-payroll-records-panel]").boundingBox();
    for (const element of [page.getByRole("searchbox", { name: "Search payroll employees" }), page.locator("[data-payroll-records-panel] table")]) {
      const box = await element.boundingBox();
      assert.ok(box.x - panel.x >= 16 && panel.x + panel.width - box.x - box.width >= 16, "Search and table have space on both sides of the panel");
    }
    assert.deepEqual(await allEmployees.evaluate((element) => ({ border: getComputedStyle(element).borderWidth, shadow: getComputedStyle(element).boxShadow })), { border: "0px", shadow: "none" }, "Tabs use backgrounds without borders or side stripes");
    assert.deepEqual(await allEmployees.evaluate((element) => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color })), { background: "rgb(7, 109, 105)", color: "rgb(255, 255, 255)" }, "Selected tabs have strong color contrast");
    await assertTabColors(page);
    await reviewEmployees.click();
    await page.getByText("No employees found", { exact: true }).waitFor();
    await allEmployees.click();
    await page.getByRole("button", { name: "Rates", exact: true }).click();
    const rates = page.getByRole("dialog", { name: "Edit Employee Rates Per Branch" });
    await rates.waitFor();
    assert.equal(await rates.evaluate((element) => getComputedStyle(element).borderRadius), "7px");
    await rates.getByRole("button", { name: "Multi-branch Only", exact: true }).click();
    assert.equal(await rates.locator('tbody input[type="number"]').count(), 0);
    await rates.getByRole("button", { name: "All Employees", exact: true }).click();
    await rates.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Paid Holidays", exact: true }).click();
    await page.getByRole("heading", { name: "Paid Holidays", exact: true }).waitFor();
    const holidayClose = page.getByRole("button", { name: "Close paid holiday modal", exact: true });
    assert.equal(await holidayClose.evaluate((element) => getComputedStyle(element).borderRadius), "5px");
    await holidayClose.click();
    await page.setViewportSize({ width: 1440, height: 700 });
    const employeeActions = page.getByRole("button", { name: /actions for Employee 01/i }).first();
    await employeeActions.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await employeeActions.click();
    await page.getByRole("menuitem", { name: "Edit employee", exact: true }).click();
    const calculation = page.getByRole("dialog", { name: "Employee calculation details", exact: true });
    await calculation.waitFor();
    const calculationBox = await calculation.boundingBox();
    assert.ok(calculationBox.y >= 24 && calculationBox.y + calculationBox.height <= 676 && calculationBox.width <= 1100, "Payroll calculation stays in a centered, bounded window");
    assert.ok(Math.abs(calculationBox.height - 560) <= 1, "Payroll edit modal occupies 80% of desktop height");
    assert.equal(await calculation.getByRole("tabpanel").evaluate((element) => getComputedStyle(element).overflowY), "auto");
    assert.equal(await calculation.getByRole("tabpanel").evaluate((element) => element.scrollHeight > element.clientHeight), true, "Attendance table scrolls inside the modal");
    const calculationTabs = page.getByRole("tablist", { name: "Employee payroll details" });
    await calculationTabs.getByRole("tab", { name: "Biometric Logs", exact: true }).click();
    await page.keyboard.press("End");
    assert.equal(await calculationTabs.getByRole("tab", { name: "Calculation Summary", exact: true }).getAttribute("aria-selected"), "true");
    assert.ok(Math.abs((await calculation.boundingBox()).height - 560) <= 1, "Modal height stays at 80% with shorter tab content");
    await calculationTabs.getByRole("tab", { name: "Adjustment Breakdown", exact: true }).click();
    await calculation.getByRole("button", { name: "Cash Advance", exact: true }).click();
    const adjustment = page.getByRole("dialog", { name: "Cash Advance", exact: true });
    await adjustment.waitFor();
    await adjustment.locator('input[type="number"]').fill("500");
    assert.equal(await adjustment.locator('input[type="number"]').evaluate((element) => getComputedStyle(element).borderRadius), "5px");
    await page.keyboard.press("Escape");
    assert.equal(await adjustment.count(), 0);
    assert.equal(await calculation.isVisible(), true);
    await calculation.getByRole("button", { name: "Close calculation details", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.getByRole("button", { name: "Submit for CEO Review", exact: true }).click();
    const submit = page.getByRole("dialog", { name: "Submit payroll report", exact: true });
    await submit.waitFor();
    assert.equal(await submit.getByRole("button", { name: "Confirm Submission" }).evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(7, 109, 105)");
    await page.keyboard.press("Escape");
    assert.equal(await submit.count(), 0);
    for (const route of ["engineer", "generate-payroll", "gmea-project"]) {
      await page.goto(`${base}/${route}`);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${route} mobile overflow`);
      if (route === "generate-payroll") {
        const mobilePeriod = await page.locator("[data-payroll-period]").boundingBox();
        const mobileSave = await page.getByRole("button", { name: "Save as Draft", exact: true }).boundingBox();
        assert.equal(mobilePeriod.height, mobileSave.height, "Mobile period and buttons use the same height");
        const mobileEmployeeActions = page.getByRole("button", { name: /actions for Employee 01/i }).first();
        await mobileEmployeeActions.scrollIntoViewIfNeeded();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await mobileEmployeeActions.click();
        await page.getByRole("menuitem", { name: "Edit employee", exact: true }).click();
        const mobileCalculation = page.getByRole("dialog", { name: "Employee calculation details", exact: true });
        const mobileBox = await mobileCalculation.boundingBox();
        assert.ok(mobileBox.x >= 16 && mobileBox.y >= 16 && mobileBox.x + mobileBox.width <= 374 && mobileBox.y + mobileBox.height <= 828, "Mobile payroll modal leaves space on every side");
        assert.ok(Math.abs(mobileBox.height - 675.2) <= 1, "Payroll edit modal occupies 80% of mobile height");
        const mobileSaveChanges = await mobileCalculation.locator("footer").getByRole("button", { name: "Save Changes", exact: true }).boundingBox();
        assert.ok(mobileSaveChanges.y >= mobileBox.y && mobileSaveChanges.y + mobileSaveChanges.height <= mobileBox.y + mobileBox.height, "Mobile modal keeps the save button within its window");
        await mobileCalculation.getByRole("button", { name: "Close calculation details", exact: true }).click();
      }
      await page.setViewportSize({ width: 1440, height: 1100 });
    }
    await page.goto(`${base}/attendance-review`);
    const reviewBreadcrumbs = page.getByRole("navigation", { name: "Payroll workflow", exact: true });
    assert.equal(await reviewBreadcrumbs.getByText("Review Attendance", { exact: true }).getAttribute("aria-current"), "page");
    assert.equal(await reviewBreadcrumbs.getByRole("link", { name: "Generate Payroll", exact: true }).getAttribute("href"), "/generate-payroll");
    assert.deepEqual(errors, []);
    console.log("Workspace browser checks passed for six roles, teal/white tabs, button contrast, centered loading logo, page skeletons, payroll dialogs, keyboard controls, and mobile layouts.");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
