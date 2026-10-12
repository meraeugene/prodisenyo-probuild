const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkEngineerWorkflow(page, base, screenshots) {
  page.setDefaultTimeout(10000);
  const goto = route => page.goto(`${base}/engineer-pages/${route}`);
  async function capture(name, modal = false) {
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} overflow at ${width}`);
      if (modal) {
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]').last();
        const bounds = await dialog.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= (width === 390 ? 844 : 1100) + 1, `${name} dialog fits viewport`);
        assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, `${name} traps focus`);
      }
      await page.screenshot({ path: path.join(screenshots, `engineer-${name}-${width}.png`), fullPage: !modal });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
  async function dismiss() {
    await page.keyboard.press("Escape");
    assert.equal(await page.locator('[role="dialog"], [role="alertdialog"]').count(), 0);
  }
  await goto("estimator-workflow");
  await page.getByRole("heading", { name: "Cost Estimator", exact: true }).waitFor();
  assert.equal(await page.locator('[role="dialog"], [role="alertdialog"]').count(), 0, "Returned status polling must not open the removed popup");
  await page.getByRole("button", { name: "View BOQ for Project 02", exact: true }).first().click();
  await page.getByRole("heading", { name: "Project 02 - BOQ Details", exact: true }).waitFor();
  await capture("view-boq");
  await page.getByRole("button", { name: "View report", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await capture("estimate-report", true);
  await dismiss();
  await page.getByRole("button", { name: "Back to cost estimator" }).click();
  await page.getByRole("button", { name: "Review returned BOQ for Project 04", exact: true }).first().click();
  await page.getByText("Revise material quantities.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByRole("button", { name: "Back to cost estimator" }).click();
  await page.getByRole("button", { name: "Continue draft for Harbor Residences", exact: true }).first().click();
  await page.getByRole("heading", { name: "Prepare estimate", exact: true }).waitFor();
  await capture("continue-draft");
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  await page.getByRole("dialog", { name: "Add BOQ item", exact: true }).waitFor();
  await capture("add-boq-item", true);
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("dialog").evaluate(element => element.contains(document.activeElement)), true);
  await dismiss();
  await page.getByRole("button", { name: "Edit Concrete slab", exact: true }).first().click();
  await page.getByRole("dialog", { name: "Edit BOQ item", exact: true }).waitFor();
  await capture("edit-boq-item", true);
  await dismiss();
  await page.getByRole("button", { name: "Delete Concrete slab", exact: true }).first().click();
  await page.getByRole("alertdialog", { name: "Delete item cost?", exact: true }).waitFor();
  await capture("delete-boq-item", true);
  await dismiss();
  await page.getByRole("button", { name: "Delete Draft", exact: true }).click();
  await page.getByRole("alertdialog").waitFor();
  await capture("delete-draft", true);
  await dismiss();
  await page.getByRole("button", { name: "Submit to CEO", exact: true }).click();
  await page.getByRole("dialog", { name: "Submit to CEO?", exact: true }).waitFor();
  await capture("submit-estimate", true);
  await dismiss();
  await page.getByRole("textbox", { name: "Notes", exact: true }).fill("Unsaved draft note");
  await page.getByRole("button", { name: "Back to cost estimator" }).click();
  await page.getByRole("dialog", { name: "Save draft first?", exact: true }).waitFor();
  await capture("save-draft", true);
  await dismiss();

  for (const [tab, heading] of [["overview", "Project Progress"], ["activities", "Add activity"], ["progress-updates", "Daily Progress Updates"], ["materials", "Requested Materials"], ["documents", "Project Documents"], ["activity-log", "Activity Log"], ["cost-tracking", "Cost tracking"]]) {
    await goto(`workspace?tab=${tab}`);
    await page.getByRole("heading", { name: "Project 02", exact: true }).waitFor();
    await page.getByRole("heading", { name: heading, exact: true }).first().waitFor();
    await capture(`project-${tab}`);
  }
  await goto("workspace?tab=activities");
  await page.getByRole("button", { name: "Delete Foundation", exact: true }).first().click();
  await page.getByRole("alertdialog", { name: "Delete activity?", exact: true }).waitFor();
  await capture("delete-activity", true);
  await dismiss();
  await goto("workspace?tab=progress-updates");
  await page.getByRole("button", { name: "Add progress update", exact: true }).click();
  await page.getByRole("dialog", { name: "Update project progress", exact: true }).waitFor();
  await capture("progress-update", true);
  await dismiss();
  await page.getByRole("button", { name: "Progress update actions" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("alertdialog", { name: "Delete progress update?", exact: true }).waitFor();
  await capture("delete-progress", true);
  await dismiss();
  await goto("workspace?tab=documents");
  await page.getByRole("button", { name: "Delete Foundation plans.pdf", exact: true }).click();
  await page.getByRole("alertdialog", { name: "Delete document?", exact: true }).waitFor();
  await capture("delete-document", true);
  await dismiss();
  for (const [route, heading] of [["materials", "Request Materials"], ["overtime", "Request Overtime"], ["settings", "Settings"]]) {
    await goto(route);
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    await capture(route);
  }
  await goto("overtime");
  await page.getByRole("textbox", { name: "Site Name", exact: false }).fill("Manila");
  await page.getByRole("textbox", { name: "Overtime Hours", exact: false }).fill("2");
  await page.getByRole("button", { name: "Review Request", exact: true }).click();
  await page.getByRole("dialog", { name: "Submit overtime request?", exact: true }).waitFor();
  await capture("overtime-confirm", true);
  await dismiss();
  await goto("reset");
  await page.getByRole("alertdialog", { name: "Reset workspace data?", exact: true }).waitFor();
  await capture("reset-confirm", true);
};
