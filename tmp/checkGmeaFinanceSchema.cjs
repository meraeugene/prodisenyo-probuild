const fs = require("node:fs");
async function main() {
  const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")];
  }));
  const response = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/", {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, Accept: "application/openapi+json" },
  });
  if (!response.ok) throw new Error("Schema inspection failed: HTTP " + response.status);
  const specification = await response.json();
  const paths = Object.keys(specification.paths || {});
  console.log(JSON.stringify({ customerIncomeTable: paths.includes("/gmea_rental_customer_income"),
    operationExpensesTable: paths.includes("/gmea_operation_expenses"),
    savedInputOptionsTable: paths.includes("/gmea_expense_options"),
    customerIncomeSave: paths.includes("/rpc/save_gmea_customer_income"),
    customerExpenseSave: paths.includes("/rpc/create_gmea_customer_expense"),
    customerExpenseLink: Boolean(specification.definitions?.gmea_rental_expenses?.properties?.income_record_id),
    sqlTools: paths.filter(path => /rpc\/(.*sql|.*query|.*exec|.*migration)/i.test(path)) }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
