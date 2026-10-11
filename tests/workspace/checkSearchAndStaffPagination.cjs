const assert = require("node:assert/strict");
const path = require("node:path");

async function assertSearchIcon(search) {
  assert.equal(await search.count(), 1);
  assert.equal(await search.locator("..").locator("svg.lucide-search").count(), 0);
  const background = await search.evaluate(element => getComputedStyle(element).backgroundImage);
  assert.equal((background.match(/data:image\/svg\+xml/g) || []).length, 1);
  assert.match(background, /circle/);
  assert.ok(await search.evaluate(element => parseFloat(getComputedStyle(element).paddingLeft) >= 35));
}

module.exports = async function checkSearchAndStaffPagination(page, base, screenshots) {
  for (const role of ["gmea", "ceo"]) {
    for (const [route, label] of [["gmea-projects", "Search projects"], ["gmea-projects/metrics/ongoing", "Search projects"],
      ["gmea-rentals/income", "Search income"], ["gmea-rentals/expenses", "Search expenses"],
      ["gmea-rentals/bookings", "Search rentals"], ["gmea-rentals/equipment", "Search equipment"]]) {
      await page.goto(base + "/" + route + "?role=" + role);
      if (route === "gmea-rentals/expenses") await page.getByRole("button", { name: "History", exact: true }).click();
      const search = page.getByRole("searchbox", { name: label, exact: true });
      await search.waitFor();
      await assertSearchIcon(search);
      await search.fill("No matching record exists");
      await page.waitForFunction(() => ![...document.querySelectorAll("tbody tr")].some(row => row.querySelector("a, button")));
      await search.fill("");
      await page.setViewportSize({ width: 390, height: 844 });
      await assertSearchIcon(search);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, role + " " + route + " mobile overflow");
      await page.screenshot({ path: path.join(screenshots, role + "-" + route.replaceAll("/", "-") + "-search-mobile.png"), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1100 });
    }
  }
  await page.goto(base + "/overtime-approvals?role=ceo");
  await page.getByRole("tab", { name: /^Staff requests/ }).click();
  const staff = page.getByRole("region", { name: "Staff overtime approvals", exact: true });
  assert.equal(await staff.locator("tbody tr").count(), 5);
  assert.equal(await staff.getByRole("combobox", { name: "Staff request list rows per page" }).count(), 0);
  const firstPage = await staff.locator("tbody").innerText();
  await staff.getByRole("button", { name: "Next page", exact: true }).click();
  assert.equal(await staff.locator("tbody tr").count(), 5);
  assert.notEqual(await staff.locator("tbody").innerText(), firstPage);
  await staff.getByRole("button", { name: "Last", exact: true }).click();
  assert.equal(await staff.locator("tbody tr").count(), 3);
  await staff.getByRole("searchbox", { name: "Search staff requests" }).fill("Juan Santos");
  assert.equal(await staff.locator("tbody tr").count(), 1);
  assert.equal(await staff.getByRole("button", { name: "Page 1", exact: true }).getAttribute("aria-current"), "page");
  await staff.getByRole("button", { name: "Reset filters", exact: true }).click();
  await staff.getByRole("button", { name: /^Pending/ }).click();
  assert.equal(await staff.locator("tbody tr").count(), 5);
  await staff.getByRole("button", { name: "Approve request", exact: true }).first().click();
  await page.waitForFunction(() => !!window.__approvedRequest);
  assert.equal(await staff.locator("tbody tr").count(), 5);
  assert.match(await staff.innerText(), /of 13 requests/);
  await page.screenshot({ path: path.join(screenshots, "staff-approvals-five-per-page-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await staff.locator("tbody tr").count(), 5);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: path.join(screenshots, "staff-approvals-five-per-page-mobile.png"), fullPage: true });
};
