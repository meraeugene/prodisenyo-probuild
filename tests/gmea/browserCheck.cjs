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
const ceo = "22222222-2222-4222-8222-222222222222";
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
      "gmea-05-contract-payments.sql",
    ])
      await db.exec(
        fs.readFileSync("supabase/" + name, "utf8").replace(/^\uFEFF/, ""),
      );
    await db.query("insert into public.profiles values($1,'gmea',true)", [
      actor,
    ]);
    await db.query("insert into public.profiles values($1,'ceo',true)", [ceo]);
    const nav =
      "const navigate=url=>{history.pushState({},'',url);window.dispatchEvent(new Event('gmea-refresh'));};";
    const bundle = await build({
      absWorkingDir: process.cwd(),
      entryPoints: [
        { in: path.resolve("tests/gmea/uiHarness.tsx"), out: "bundle" },
      ],
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
            b.onResolve({ filter: /^next\/(navigation|link|image)$/ }, (a) => ({
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
                    : a.path === "next/image"
                      ? "import React from 'react';export default function Image({fill,priority,...props}){return <img {...props}/>;}"
                    : "const options={suppliers:['B.S. Electrical','Solarfy Corporation'],methods:['Cash','Cheque','Bank transfer','GCash'],invoiceNames:['GMEA MARKETING CORP.','Prodisenyo Builders Corp.']};export async function getGmeaProjectsDataAction(){return fetch('/state').then(r=>r.json())}export async function getGmeaProjectDataAction(id){const projects=await getGmeaProjectsDataAction();return {project:projects.find(p=>p.id===id)||null,expenseOptions:options}}export async function saveGmeaProjectAction(projectId,version,command){const response=await fetch('/mutation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,version,command})});const result=await response.json();if(!response.ok)throw new Error(result.error);return result.id;}export async function markGmeaExpenseViewedAction(projectId,expenseId){const response=await fetch('/view-expense',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,expenseId})});if(!response.ok)throw new Error('Unable to mark expense viewed');}",
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
        p.contract_amount = Number(p.contract_amount);
        for (const field of ["expenses", "partners"]) {
          p[field] = (
            await db.query(
              "select id,data from public.gmea_" +
                field +
                " where project_id=$1 order by created_at,id",
              [p.id],
            )
          ).rows
            .map((r) => ({ ...r.data, id: r.id }))
            .sort(
              (left, right) =>
                Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0),
            );
          if (field === "expenses") {
            const unread = new Set(
              (
                await db.query(
                  "select expense_id from public.gmea_expense_notifications where recipient_id=$1 and read_at is null",
                  [ceo],
                )
              ).rows.map((row) => row.expense_id),
            );
            p[field] = p[field].map((expense) => ({
              ...expense,
              is_new: unread.has(expense.id),
            }));
          }
        }
        const receipts = (
          await db.query(
            "select * from public.gmea_collection_receipts where project_id=$1 order by received_date,recorded_at,id",
            [p.id],
          )
        ).rows.map((receipt) => ({
          ...receipt,
          amount: Number(receipt.amount),
        }));
        p.payment_terms = (
          await db.query(
            "select id,data from public.gmea_collections where project_id=$1 order by created_at,id",
            [p.id],
          )
        ).rows
          .map((row) => ({
            ...row.data,
            id: row.id,
            amount: Number(row.data.amount),
            percentage:
              row.data.value_mode === "percentage"
                ? Number(row.data.percentage)
                : null,
            receipts: receipts.filter((receipt) => receipt.term_id === row.id),
          }))
          .sort(
            (left, right) =>
              Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0),
          );
      }
      return projects;
    }
    server = http.createServer(async (req, res) => {
      try {
        if (req.url === "/gmea-portfolio-architecture.png") {
          res.setHeader("Content-Type", "image/png");
          return res.end(
            fs.readFileSync("public/gmea-portfolio-architecture.png"),
          );
        }
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
        if (req.url === "/view-expense") {
          let body = "";
          for await (const chunk of req) body += chunk;
          const input = JSON.parse(body);
          await db.query(
            "select public.mark_gmea_expense_viewed($1,$2,$3)",
            [ceo, input.projectId, input.expenseId],
          );
          return res.end("{}");
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
    await page
      .getByLabel("Project location *", { exact: true })
      .fill("Cagayan de Oro");
    await page
      .getByLabel("Contract amount (PHP) *", { exact: true })
      .fill("85000");
    assert.equal(
      await page
        .getByLabel("Contract amount (PHP) *", { exact: true })
        .inputValue(),
      "85,000",
    );
    await page
      .getByLabel("Starting template", { exact: true })
      .selectOption("75-25");
    await page
      .getByLabel("Project duration *", { exact: true })
      .fill("7–14 days");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "GMEA Solar Installation", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Payment Schedule", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Edit contract terms", exact: true })
      .click();
    await page
      .getByLabel("Contract notes", { exact: true })
      .first()
      .fill("Verify legacy workbook details");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Down payment of the contract" }).click();
    await page.getByRole("button", { name: "Record payment", exact: true }).click();
    await page.getByLabel("Amount received (PHP) *").fill("63000");
    await page.getByLabel("Payment method").fill("Bank transfer");
    await page.getByLabel("Reference number").fill("PAY-001");
    await page.getByRole("button", { name: "Record payment", exact: true }).last().click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.getByText("partial", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Record payment", exact: true }).click();
    await page.getByRole("button", { name: "Record payment", exact: true }).last().click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.getByText("paid", { exact: true }).waitFor();
    assert.ok((await page.locator("body").innerText()).includes("PAY-001"));
    await page.getByRole("button", { name: "Expenses", exact: true }).click();
    await page
      .getByRole("button", { name: "New expense", exact: true })
      .click();
    await page
      .getByLabel("Description *", { exact: true })
      .fill("Materials and labor");
    assert.equal(
      await page.getByLabel("VAT treatment", { exact: true }).inputValue(),
      "inclusive",
    );
    assert.equal(await page.getByLabel("VAT rate (%)").count(), 0);
    await page
      .getByLabel("Supplier / vendor", { exact: true })
      .fill("JIMAR CONSTRUCTION SUPPLY CO.");
    await page.getByLabel("Amount (PHP) *", { exact: true }).fill("11568.20");
    await page
      .getByLabel("Refunded Sir Edward (PHP)", { exact: true })
      .fill("1175");
    await page.getByLabel("Payment method *", { exact: true }).fill("cas");
    await page.getByRole("option", { name: "Cash", exact: true }).click();
    assert.equal(
      await page.getByLabel("Amount (PHP) *", { exact: true }).inputValue(),
      "11,568.20",
    );
    assert.equal(
      await page
        .getByLabel("Payment method *", { exact: true })
        .getAttribute("role"),
      "combobox",
    );
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
    await page.getByText("Materials and labor", { exact: true }).waitFor();
    assert.ok((await page.locator("body").innerText()).includes("Refunded Sir Edward"));
    await page
      .getByRole("button", { name: "Delete expense", exact: true })
      .click();
    await page.getByRole("heading", { name: "Delete expense?" }).waitFor();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page
      .getByRole("button", { name: "Contract Cost Summary", exact: true })
      .click();
    assert.ok((await page.locator("body").innerText()).includes("73,431.80"));
    await page.reload();
    await page
      .getByRole("button", { name: "Contract Cost Summary", exact: true })
      .click();
    assert.ok((await page.locator("body").innerText()).includes("73,431.80"));
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
    await page.getByRole("button", { name: "Expenses", exact: true }).click();
    await page
      .getByRole("button", { name: "New expense", exact: true })
      .click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    const inputBounds = await page
      .getByLabel("Description *", { exact: true })
      .boundingBox();
    assert.ok(
      inputBounds.x + inputBounds.width <= 390,
      "Mobile inputs stay inside the viewport",
    );
    await page
      .getByLabel("Refunded Sir Edward (PHP)", { exact: true })
      .scrollIntoViewIfNeeded();
    assert.ok(
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .isVisible(),
    );
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
    assert.equal(
      await page
        .getByRole("button", { name: "Delete project", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Expenses", exact: true }).click();
    await page.getByText("New", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "New expense", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await page.getByText("New", { exact: true }).waitFor({ state: "detached" });
    assert.equal(
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByLabel("Description *", { exact: true })
        .isDisabled(),
      true,
    );
    if (process.env.GMEA_QA_SCREENSHOT) {
      await page.setViewportSize({ width: 1220, height: 900 });
      await page.goto(url);
      await page
        .getByRole("heading", { name: "Project portfolio", exact: true })
        .waitFor();
      await page.screenshot({
        path: process.env.GMEA_QA_SCREENSHOT,
        fullPage: true,
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: workbook project fields, contract collections, expense dropdowns, expense persistence, contract summary, reload, stale-save recovery, modal focus, mobile width, and CEO read-only controls.",
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
