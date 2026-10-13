const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkRentalPages(page, base, screenshots) {
  await page.goto(base + "/gmea-rentals/income");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  assert.equal(await nav.getByRole("button", { name: "Rentals", exact: true }).count(), 0);
  for (const [label, route] of [["Rentals", "income"]])
    assert.equal(await nav.getByRole("link", { name: label, exact: true }).getAttribute("href"), "/gmea-rentals/" + route);
  assert.equal(await nav.getByRole("link", { name: "Rentals", exact: true }).getAttribute("aria-current"), "page");
  assert.equal(await nav.getByRole("link", { name: "Rentals", exact: true }).evaluate(element => getComputedStyle(element).boxShadow), "none");
  assert.equal(await nav.locator("[data-open]").count(), 0);
  assert.equal(await page.getByRole("navigation", { name: "Rental workspace sections" }).count(), 0);
  await require("./checkRentalPortfolio.cjs")(page, base, screenshots);
  await page.goto(base + "/gmea-rentals/expenses");
  await page.getByRole("heading", { name: "Monthly rental expenses", exact: true }).waitFor();
  assert.equal(await page.getByLabel("Reporting month", { exact: true }).inputValue(), "2026-10");
  assert.equal(await page.locator("figure").count(), 0);
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  assert.equal(await page.getByRole("region", { name: "Weekly rental reporting", exact: true }).count(), 0);
  const expenseCharts = page.getByRole("region", { name: "Rental expense charts", exact: true });
  assert.equal(await expenseCharts.locator(".recharts-surface").count(), 2);
  await expenseCharts.locator("figure").first().getByText("View chart data").click();
  assert.match(await expenseCharts.locator("figure").first().locator("tbody tr").last().innerText(), /1,500/);
  await page.getByLabel("Reporting month", { exact: true }).fill("2026-09");
  assert.match(await expenseCharts.locator("figure").first().locator("tbody tr").last().innerText(), /2,080/);
  await page.screenshot({ path: path.join(screenshots, "rental-expenses-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Weekly", exact: true }).click();
  await page.getByRole("heading", { name: "Weekly rental expenses", exact: true }).waitFor();
  assert.equal(await page.locator("figure").count(), 0);
  assert.equal(await page.getByLabel("Reporting month", { exact: true }).inputValue(), "2026-09");
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page.getByRole("heading", { name: "Expense history", exact: true }).waitFor();

  await page.goto(base + "/gmea-rentals/bookings");
  await page.getByRole("heading", { name: "Rental Bookings", exact: true }).waitFor();
  const bookings = page.getByRole("region", { name: "Rental booking records", exact: true });
  assert.equal(await bookings.locator("tbody:not(figure tbody) tr").count(), 5);
  assert.equal(await bookings.locator("figure").count(), 0);
  await bookings.getByRole("button", { name: "Next page", exact: true }).click();
  assert.equal(await bookings.getByRole("button", { name: "Page 2", exact: true }).getAttribute("aria-current"), "page");
  await bookings.getByRole("searchbox", { name: "Search rentals", exact: true }).fill("Harbor");
  assert.equal(await bookings.locator("tbody:not(figure tbody) tr").count(), 1);
  await bookings.getByRole("button", { name: "Analytics", exact: true }).click();
  assert.equal(await bookings.locator("tbody:not(figure tbody)").count(), 0);
  await bookings.locator(".recharts-surface").waitFor();
  await bookings.locator("figure summary").click();
  assert.equal(await bookings.locator("figure tbody").evaluate(body => [...body.querySelectorAll("td")].reduce((sum, cell) => sum + Number(cell.textContent), 0)), 1);
  await bookings.getByRole("button", { name: "Reset filters", exact: true }).click();
  await page.getByRole("button", { name: "Rental income", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(screenshots, "rental-bookings-desktop.png"), fullPage: true });
  await bookings.getByRole("button", { name: "Bookings", exact: true }).click();
  assert.equal(await bookings.locator("figure").count(), 0);
  assert.equal(await bookings.locator("tbody tr").count(), 5);

  await page.goto(base + "/gmea-rentals/equipment");
  await page.getByRole("heading", { name: "Equipment", exact: true }).waitFor();
  await page.getByRole("combobox", { name: "Filter equipment by status" }).selectOption("available");
  assert.match(await page.getByRole("region", { name: "Equipment records" }).innerText(), /of 14 units/);
  await page.getByRole("button", { name: "Edit Excavator 01", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Close dialog", exact: true }).click();

  assert.equal(await page.getByRole("button", { name: "Collapse navigation", exact: true }).count(), 0);
  assert.equal(await nav.getByRole("link", { name: "Rentals", exact: true }).isVisible(), true);
  assert.equal(await nav.getByRole("button", { name: "Rentals", exact: true }).count(), 0);

  for (const section of ["income", "expenses", "bookings", "equipment"]) {
    await page.goto(base + "/gmea-rentals/" + section);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("heading", { name: section === "income" ? "Rentals" : section === "equipment" ? "Equipment" : "Rental " + section[0].toUpperCase() + section.slice(1), exact: true }).waitFor();
    if (section !== "equipment" && section !== "income") {
      assert.equal(await page.locator("figure").count(), 0);
      await page.getByRole("button", { name: "Analytics", exact: true }).click();
      await page.locator("figure .recharts-surface").first().waitFor();
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, section + " mobile overflow");
    await page.screenshot({ path: path.join(screenshots, "rental-" + section + "-mobile.png"), fullPage: true });
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await nav.getByRole("link", { name: "Rentals", exact: true }).waitFor();
    await page.getByRole("button", { name: "Close navigation", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
  for (const section of ["bookings", "equipment", "expenses"]) {
    await page.goto(base + "/gmea-rentals/" + section + "?role=ceo");
    await page.getByRole("heading", { name: section === "equipment" ? "Equipment" : "Rental " + section[0].toUpperCase() + section.slice(1), exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: /^(New rental|Add equipment|New week|Edit Excavator)/ }).count(), 0);
  }
};
