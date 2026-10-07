import { DEMO_ROLES, createDemoContext } from "./context.mjs";
import { buildDemoData, TABLE_ORDER } from "./data.mjs";
import { buildGmeaData } from "./gmeaData.mjs";

export function buildDemoCleanupPlan(gmeaOnly = false) {
  const context = createDemoContext();
  const tables = gmeaOnly ? buildGmeaData(context) : buildDemoData(context);
  return {
    tables,
    order: [...TABLE_ORDER].reverse().filter((table) => table in tables),
    roles: gmeaOnly ? ["gmea"] : DEMO_ROLES,
    deleteFiles: !gmeaOnly,
  };
}
