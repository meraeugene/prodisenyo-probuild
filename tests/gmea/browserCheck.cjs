// Isolated component/integration harness. Does not connect to Supabase or expose an app route.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const { build } = require("esbuild"),
  postcss = require("postcss"),
  tailwind = require("tailwindcss");
const { chromium } = require("@playwright/test");
const load = require("../helpers/loadGmeaModule.cjs");
const { normalizeMutation } = load(
  "features/gmea-projects/utils/gmeaValidation.ts",
);
const actor = "11111111-1111-4111-8111-111111111111";
async function main() {
  const db = new PGlite();
  let browser, server;
  try {
    await db.exec(
      "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create function auth.uid() returns uuid language sql as $$ select null::uuid $$;create type public.app_role as enum('ceo');create table public.profiles(id uuid primary key,role public.app_role,is_active boolean);create function public.current_app_role() returns public.app_role language sql as $$ select null::public.app_role $$;",
    );
    for (const name of [
      "gmea-01-role.sql",
      "gmea-02-workspace.sql",
      "gmea-03-mutations.sql",
      "gmea-04-access.sql",
    ])
      await db.exec(
        fs.readFileSync("supabase/" + name, "utf8").replace(/^\uFEFF/, ""),
      );
    await db.query("insert into public.profiles values($1,'gmea',true)", [
      actor,
    ]);
    const nav =
      "const navigate=url=>{history.pushState({},'',url);window.dispatchEvent(new Event('gmea-refresh'));};";
    const bundle = await build({
      entryPoints: ["tests/gmea/uiHarness.tsx"],
      bundle: true,
      write: false,
      outdir: "out",
      platform: "browser",
      format: "iife",
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"development"' },
      plugins: [
        {
          name: "isolated-app-adapters",
          setup(b) {
            b.onResolve({ filter: /^next\/(navigation|link)$/ }, (a) => ({
              path: a.path,
              namespace: "mocks",
            }));
            b.onResolve({ filter: /^@\/actions\/gmeaProjects$/ }, (a) => ({
              path: a.path,
              namespace: "mocks",
            }));
            b.onLoad({ filter: /.*/, namespace: "mocks" }, (a) => ({
              loader: "jsx",
              contents:
                a.path === "next/navigation"
                  ? nav +
                    "export const useRouter=()=>({push:navigate,refresh:()=>window.dispatchEvent(new Event('gmea-refresh'))});"
                  : a.path === "next/link"
                    ? "import React from 'react';" +
                      nav +
                      "export default function Link({href,children,...props}){return <a href={href} {...props} onClick={e=>{e.preventDefault();navigate(href)}}>{children}</a>;}"
                    : "export async function saveGmeaProjectAction(projectId,version,command){const response=await fetch('/mutation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,version,command})});const result=await response.json();if(!response.ok)throw new Error(result.error);return result.id;}",
              resolveDir: process.cwd(),
            }));
          },
        },
      ],
    });
    const js = bundle.outputFiles.find((f) => f.path.endsWith(".js")).text;
    const css = (
      await postcss([tailwind("tailwind.config.ts")]).process(
        fs.readFileSync("app/globals.css", "utf8"),
        { from: undefined },
      )
    ).css;
    async function state() {
      const projects = (
        await db.query("select * from public.gmea_projects order by created_at")
      ).rows;
      for (const p of projects) {
        p.quotations = (
          await db.query(
            "select * from public.gmea_quotations where project_id=$1 order by created_at",
            [p.id],
          )
        ).rows;
        for (let i = 0; i < p.quotations.length; i++) {
          const q = p.quotations[i],
            items = (
              await db.query(
                "select * from public.gmea_quotation_items where quotation_id=$1 order by sort_order",
                [q.id],
              )
            ).rows.map((r) => ({
              ...r,
              quantity: Number(r.quantity),
              unit_price: Number(r.unit_price),
            }));
          p.quotations[i] = {
            ...q.data,
            id: q.id,
            project_id: p.id,
            status: q.status,
            items,
          };
        }
        for (const field of [
          "milestones",
          "receipts",
          "expenses",
          "partners",
        ]) {
          p[field] = (
            await db.query(
              "select id,data from public.gmea_" +
                field +
                " where project_id=$1 order by created_at,id",
              [p.id],
            )
          ).rows.map((r) => ({ ...r.data, id: r.id }));
        }
      }
      return projects;
    }
    server = http.createServer(async (req, res) => {
      try {
        if (req.url === "/bundle.js") {
          res.setHeader("Content-Type", "application/javascript");
          return res.end(js);
        }
        if (req.url === "/styles.css") {
          res.setHeader("Content-Type", "text/css");
          return res.end(css);
        }
        if (req.url === "/state") {
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify(await state()));
        }
        if (req.url === "/mutation") {
          let body = "";
          for await (const chunk of req) body += chunk;
          const input = JSON.parse(body),
            command = normalizeMutation(input.command);
          const r = await db.query(
            "select public.mutate_gmea_project($1,$2,$3,$4::jsonb) id",
            [actor, input.projectId, input.version, JSON.stringify(command)],
          );
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify(r.rows[0]));
        }
        res.setHeader("Content-Type", "text/html");
        res.end(
          '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
        );
      } catch (e) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = "http://127.0.0.1:" + server.address().port;
    browser = await chromium.launch({
      channel: process.env.GMEA_TEST_BROWSER || "msedge",
      headless: true,
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    await page
      .getByLabel("Project name *", { exact: true })
      .fill("GMEA Solar Installation");
    await page.getByLabel("Client", { exact: true }).fill("Sample Client");
    await page.getByLabel("Location *", { exact: true }).fill("Cagayan de Oro");
    await page.getByLabel("Duration notes").fill("7–14 days");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "GMEA Solar Installation", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Quotations", exact: true }).click();
    await page
      .getByRole("button", { name: "New quotation", exact: true })
      .click();
    await page
      .getByLabel("Quotation reference *", { exact: true })
      .fill("GMEA-Q-001");
    await page
      .getByLabel("Item 1 description", { exact: true })
      .fill("Supply and installation");
    await page.getByLabel("Item 1 unit price", { exact: true }).fill("85000");
    fs.mkdirSync("artifacts/gmea", { recursive: true });
    await page.screenshot({
      path: "artifacts/gmea/quotation-desktop.png",
      fullPage: true,
    });
    // Keyboard focus remains inside the modal.
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(
        () => !!document.activeElement.closest('[role="dialog"]'),
      ),
      true,
    );
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "GMEA-Q-001", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Accept quotation", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Accept quotation", exact: true })
      .click();
    await page.getByText("accepted", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Payments", exact: true }).click();
    await page
      .getByRole("button", { name: "Edit milestones", exact: true })
      .click();
    await page
      .getByRole("button", { name: "+ Add milestone", exact: true })
      .click();
    await page
      .getByLabel("Milestone label", { exact: true })
      .fill("Completion");
    await page.getByLabel("Share (%)", { exact: true }).fill("100");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Completion", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Record payment", exact: true })
      .click();
    await page
      .getByLabel("Milestone", { exact: true })
      .selectOption({ label: "Completion" });
    await page.getByLabel("Cash received (PHP)", { exact: true }).fill("83300");
    await page
      .getByLabel("Withholding amount (PHP)", { exact: true })
      .fill("1700");
    await page
      .getByLabel("Payment method *", { exact: true })
      .fill("Bank transfer");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page.getByText("Paid", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Expenses", exact: true }).click();
    await page
      .getByRole("button", { name: "New expense", exact: true })
      .click();
    await page
      .getByLabel("Description *", { exact: true })
      .fill("Materials and labor");
    await page.getByLabel("Amount (PHP) *", { exact: true }).fill("11568.20");
    await page.getByLabel("Payment method *", { exact: true }).fill("Cash");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page.getByText("Materials and labor", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Profit Summary", exact: true })
      .click();
    assert.ok((await page.locator("body").innerText()).includes("71,731.80"));
    await page.screenshot({
      path: "artifacts/gmea/profit-desktop.png",
      fullPage: true,
    });
    await page.reload();
    await page
      .getByRole("button", { name: "Profit Summary", exact: true })
      .click();
    assert.ok((await page.locator("body").innerText()).includes("71,731.80"));
    // A stale edit must keep user input and show a recoverable error.
    await page
      .getByRole("button", { name: "Edit project", exact: true })
      .click();
    await page
      .getByLabel("Project name *", { exact: true })
      .fill("Unsaved local title");
    await db.exec("update public.gmea_projects set version=version+1");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "This project changed" })
      .waitFor();
    assert.equal(
      await page.getByLabel("Project name *", { exact: true }).inputValue(),
      "Unsaved local title",
    );
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.reload();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Quotations", exact: true }).click();
    await page
      .getByRole("button", { name: "Create revision", exact: true })
      .click();
    await page.screenshot({
      path: "artifacts/gmea/quotation-mobile.png",
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    const inputBounds = await page
      .getByLabel("Quotation reference *", { exact: true })
      .boundingBox();
    assert.ok(
      inputBounds.x + inputBounds.width <= 390,
      "Mobile inputs stay inside the viewport",
    );
    await page.getByLabel("Notes", { exact: true }).scrollIntoViewIfNeeded();
    assert.ok(
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .isVisible(),
    );
    await page.screenshot({
      path: "artifacts/gmea/quotation-mobile-bottom.png",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    // CEO rendering exposes details but no mutation controls.
    const project = (await state())[0];
    await page.goto(url + "/gmea-projects/" + project.id + "?role=ceo");
    await page
      .getByRole("heading", { name: "GMEA Solar Installation", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Edit project", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Quotations", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "New quotation", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Details", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByLabel("Quotation reference *", { exact: true })
        .isDisabled(),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: project creation, quotations, acceptance, milestones, payments, expenses, reload, profit, stale-save recovery, modal focus, mobile width, and CEO read-only controls.",
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
