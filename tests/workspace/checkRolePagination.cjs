const assert = require("node:assert/strict");

async function checkPages(list, total = 28) {
  await list.locator("tbody tr").first().waitFor();
  assert.equal(await list.locator("tbody tr").count(), 5);
  assert.equal(await list.getByRole("combobox", { name: /rows per page/ }).count(), 0);
  const firstPage = await list.locator("tbody").innerText();
  await list.getByRole("button", { name: "Next page", exact: true }).click();
  assert.equal(await list.locator("tbody tr").count(), 5);
  assert.notEqual(await list.locator("tbody").innerText(), firstPage);
  await list.getByRole("button", { name: "Last", exact: true }).click();
  assert.equal(await list.locator("tbody tr").count(), total % 5 || 5);
  await list.getByRole("button", { name: "First", exact: true }).click();
  assert.equal(await list.locator("tbody tr").count(), 5);
}

module.exports = async function checkRolePagination(page, base) {
  for (const role of ["engineer", "payroll_manager"]) {
    await page.goto(`${base}/request-overtime?role=${role}`);
    const history = page.getByRole("region", { name: "Your overtime requests", exact: true });
    await history.getByRole("button", { name: /All requests/ }).click();
    await checkPages(history);
  }
  await page.goto(base + "/payroll-approvals?role=ceo");
  await checkPages(page.getByRole("region", { name: "Payroll records", exact: true }));
  await page.goto(base + "/gmea-projects?role=ceo");
  const projects = page.getByRole("region", { name: "Projects", exact: true });
  await projects.getByRole("button", { name: /all projects/i }).click();
  await checkPages(projects);
  for (const role of ["ceo", "gmea"]) {
    for (const [section, region] of [["bookings", "Rental booking records"], ["equipment", "Equipment records"]]) {
      await page.goto(`${base}/gmea-rentals/${section}?role=${role}`);
      await checkPages(page.getByRole("region", { name: region, exact: true }));
    }
  }
  await page.goto(base + "/overtime-approvals?role=ceo");
  await checkPages(page.getByRole("region", { name: "Payroll overtime adjustments", exact: true }));
  await page.getByRole("tab", { name: /^Staff requests/ }).click();
  await checkPages(page.getByRole("region", { name: "Staff overtime approvals", exact: true }));
  await page.goto(base + "/generate-payroll");
  await checkPages(page.locator("[data-payroll-records-panel]"), 12);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator("[data-payroll-records-panel] tbody tr").count(), 5);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
};
