const assert = require("node:assert/strict");

async function assertTabColors(page) {
  const tabs = await page.locator("[data-workspace-tab]").evaluateAll(elements => elements.map(element => ({
    label: element.textContent, selected: element.dataset.selected === "true", background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element).color, border: getComputedStyle(element).borderWidth, shadow: getComputedStyle(element).boxShadow,
  })));
  assert.ok(tabs.length, "Workspace tabs are present");
  for (const tab of tabs) {
    assert.equal(tab.background, tab.selected ? "rgb(7, 109, 105)" : "rgb(255, 255, 255)", tab.label);
    if (tab.selected) assert.equal(tab.color, "rgb(255, 255, 255)", tab.label);
    assert.equal(tab.border, "0px", tab.label);
    assert.equal(tab.shadow, "none", tab.label);
  }
}

async function checkLoadingLogo(page, base) {
  await page.goto(`${base}/loading-logo`);
  for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const status = page.getByRole("status", { name: "Loading Prodisenyo ProBuild" });
    await status.getByText("Prodisenyo ProBuild", { exact: true }).waitFor();
    const group = await status.boundingBox();
    const logo = await status.locator("img").boundingBox();
    const title = await status.getByText("Prodisenyo ProBuild", { exact: true }).boundingBox();
    assert.ok(Math.abs(group.x + group.width / 2 - viewport.width / 2) < 1);
    assert.ok(Math.abs(group.y + group.height / 2 - viewport.height / 2) < 1);
    assert.ok(Math.abs(logo.x + logo.width / 2 - viewport.width / 2) < 1);
    assert.ok(logo.y + logo.height < title.y, "Logo sits above the product name");
    assert.equal(await status.locator("img").evaluate(element => element.complete && element.naturalWidth > 0), true);
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function checkSkeletonLayouts(page, base) {
  const columns = { admin: 6, "engineer-projects": 6, projects: 9, "payroll-workspace": 6, "generate-payroll": 8, "overtime-request": 5, purchasing: 9, "gmea-projects": 7, "ceo-gmea": 9, "gmea-project": 8, "gmea-rentals": 8, "ceo-rentals": 8, "gmea-reports": 4, "gmea-workspace": 5, "review-attendance": 12 };
  for (const [name, count] of Object.entries(columns)) {
    const skeleton = page.locator(`[data-skeleton-case="${name}"]`);
    assert.equal(await skeleton.locator("table thead th").count(), count, `${name} matches its page's table columns`);
  }
  const names = await page.locator("[data-skeleton-case]").evaluateAll(elements => elements.map(element => element.dataset.skeletonCase));
  assert.ok(names.length >= 54, "All loading variants are covered");
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = [];
  for (const name of names) {
    await page.goto(`${base}/skeletons?case=${encodeURIComponent(name)}`);
    await page.locator(`[data-skeleton-case="${name}"]`).waitFor();
    if (!await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)) overflow.push(name);
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  assert.deepEqual(overflow, [], "Mobile loading layouts stay within the viewport");
}

module.exports = { assertTabColors, checkSkeletonLayouts, checkLoadingLogo };
