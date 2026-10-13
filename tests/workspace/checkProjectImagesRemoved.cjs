const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkProjectImagesRemoved(page, base, screenshots) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const [route, region] of [["dashboard", "Dashboard projects"], ["projects", "Assigned project records"]]) {
      await page.goto(`${base}/engineer-pages/${route}`);
      const records = page.getByRole("region", { name: region, exact: true });
      await records.waitFor();
      assert.equal(await records.locator("img, [role='img'], [aria-label$='project image unavailable']").count(), 0, "Engineer projects have no image or placeholder");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: path.join(screenshots, `engineer-${route}-no-images-${width}.png`), fullPage: true });
    }
    await page.goto(`${base}/project-create?role=ceo`);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Create project", exact: true });
    await dialog.waitFor();
    assert.equal(await dialog.locator("input[type=file], img").count(), 0, "CEO creation has no image field");
    await dialog.getByRole("textbox", { name: "Project name", exact: true }).fill("New engineer project");
    await dialog.getByRole("textbox", { name: "Location", exact: true }).fill("Manila");
    await dialog.getByRole("textbox", { name: "Subject", exact: true }).fill("Renovation");
    await dialog.getByRole("combobox", { name: "Project lead", exact: true }).selectOption("Engineer One");
    await dialog.getByRole("combobox", { name: /Cost estimate engineer/ }).selectOption("engineer-1");
    await dialog.getByRole("textbox", { name: "Budget ceiling (PHP)", exact: true }).fill("100000");
    await dialog.locator('input[name="startDate"]').fill("2026-10-12");
    await dialog.locator('input[name="endDate"]').fill("2026-12-12");
    await page.screenshot({ path: path.join(screenshots, `ceo-create-no-image-${width}.png`), fullPage: true });
    assert.equal(await dialog.getByRole("combobox", { name: /Cost estimate engineer/ }).inputValue(), "engineer-1");
    assert.equal(await dialog.getByRole("textbox", { name: "Budget ceiling (PHP)", exact: true }).inputValue(), "100,000");
    await page.keyboard.press("Escape");
    assert.equal(await dialog.count(), 0);
  }
};
