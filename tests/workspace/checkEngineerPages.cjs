const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkEngineerPages(page, base, screenshots) {
  const goto = route => page.goto(`${base}/engineer-pages/${route}`);
  await goto("dashboard");
  await page.getByRole("heading", { name: "Engineer Dashboard", exact: true }).waitFor();
  assert.equal(await page.locator("h1").evaluate(element => getComputedStyle(element).fontSize), "26px");
  assert.equal(await page.locator("[data-workspace-header]").evaluate(element => element.getBoundingClientRect().height), 54);
  const dashboard = page.getByRole("region", { name: "Dashboard projects", exact: true });
  assert.equal(await dashboard.evaluate(element => getComputedStyle(element).borderRadius), "7px");
  assert.equal(await dashboard.getByRole("combobox", { name: "Sort projects", exact: true }).evaluate(element => getComputedStyle(element).borderRadius), "5px");
  assert.equal(await dashboard.locator("article").count(), 5);
  await dashboard.getByRole("button", { name: "Next page", exact: true }).click();
  await dashboard.getByRole("combobox", { name: "Filter by project", exact: true }).selectOption("project-01");
  assert.equal(await dashboard.locator("article").count(), 1);
  assert.match(await page.getByText("Concrete", { exact: true }).innerText(), /Concrete/);
  assert.equal(await page.getByText("Steel", { exact: true }).count(), 0);
  assert.equal(await dashboard.getByRole("link", { name: "Review estimate", exact: true }).getAttribute("href"), "/cost-estimator?projectId=project-01");
  await dashboard.getByRole("button", { name: "Reset filters" }).click();

  await goto("projects");
  const projects = page.getByRole("region", { name: "Assigned project records", exact: true });
  assert.equal(await projects.locator("tbody tr").count(), 5);
  await projects.getByRole("button", { name: "Next page", exact: true }).click();
  await projects.getByRole("searchbox", { name: "Search projects", exact: true }).fill("Harbor");
  assert.equal(await projects.locator("tbody tr").count(), 1);
  assert.equal(await projects.getByRole("button", { name: "Page 1", exact: true }).getAttribute("aria-current"), "page");
  await projects.getByRole("button", { name: "Cost estimate for Harbor Residences", exact: true }).first().click();
  assert.equal(await page.getByRole("status", { name: "Opened project" }).innerText(), "project-01");
  await projects.getByRole("button", { name: "Reset filters" }).click();
  await projects.getByRole("button", { name: /^On hold/ }).click();
  assert.equal(await projects.locator("tbody tr").count(), 5);
  assert.match(await projects.innerText(), /of 7 projects/);

  await goto("estimates");
  const estimates = page.getByRole("region", { name: "Assigned estimate records", exact: true });
  assert.equal(await estimates.locator("tbody tr").count(), 5);
  await estimates.getByRole("button", { name: /^Returned/ }).click();
  await estimates.getByRole("button", { name: /Review returned BOQ for/ }).first().click();
  assert.equal(await page.getByRole("status", { name: "Opened estimate" }).innerText(), "estimate-3");
  await estimates.getByRole("button", { name: /^Not started/ }).click();
  assert.equal(await estimates.locator("tbody tr").count(), 2);
  await estimates.getByRole("button", { name: /Start estimate for/ }).first().click();
  assert.match(await page.getByRole("status", { name: "Opened estimate" }).innerText(), /project-0[78]/);
  await estimates.getByRole("button", { name: "Reset filters" }).click();
  await estimates.getByRole("searchbox", { name: "Search estimates", exact: true }).fill("Harbor");
  assert.match(await estimates.innerText(), /Over budget by/);
  await estimates.getByRole("searchbox", { name: "Search estimates", exact: true }).fill("missing");
  await page.getByText("No matching estimates", { exact: true }).waitFor();

  await goto("draft");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await page.getByText("Draft saved", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Submit to CEO", exact: true }).click();
  await page.getByText("Submit requested", { exact: true }).waitFor();

  for (const [route, heading] of [["dashboard", "Engineer Dashboard"], ["projects", "Projects"], ["estimates", "Cost Estimator"], ["draft", "Prepare estimate"], ["boq", "Project 04 - BOQ Details"], ["project-detail", "Project 02"]]) {
    await goto(route);
    await page.getByRole("heading", { name: heading, exact: true }).first().waitFor();
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const overflow = await page.evaluate(() => [...document.querySelectorAll("#dashboard-content *")].filter(element => element.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(element).display !== "none" && !element.closest(".overflow-x-auto")).slice(0, 6).map(element => `${element.tagName}.${element.className}`));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${route} overflow at ${width}: ${overflow.join(", ")}`);
      assert.equal(await page.locator("#dashboard-content").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(245, 246, 248)");
      await page.screenshot({ path: path.join(screenshots, `engineer-${route}-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
  for (const [route, message] of [["dashboard", "No assigned projects yet"], ["projects", "No projects assigned yet"], ["estimates", "No projects assigned for cost estimation"]]) {
    await goto(`${route}?empty`);
    await page.getByText(message, { exact: true }).waitFor();
  }
};
