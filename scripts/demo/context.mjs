import { createHash } from "node:crypto";

export const SEED_TAG = "prodisenyo-ui-demo-v1";
export const DEMO_ROLES = ["admin", "ceo", "payroll_manager", "engineer", "purchaser", "gmea", "employee"];
export const DEMO_PASSWORD = "DemoUi123!";

// Reserved namespace: cleanup never scans by names, dates, or roles.
export function demoId(key) {
  const hash = createHash("sha256").update(`${SEED_TAG}:${key}`).digest("hex");
  return `de000001-${hash.slice(0, 4)}-4${hash.slice(5, 8)}-a${hash.slice(9, 12)}-${hash.slice(12, 24)}`;
}

export function createDemoContext(users = {}, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const date = (offset = 0) => {
    const value = new Date(`${today}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
  };
  return {
    id: demoId, date,
    stamp: (offset = 0) => `${date(offset)}T08:00:00+08:00`,
    user: (role) => users[role] ?? demoId(`user:${role}`),
  };
}

export function demoAccount(role) {
  const username = `demo_${role === "payroll_manager" ? "payroll" : role}`;
  return { username, email: `${username}@prodisenyo.local`, full_name: role === "employee" ? "Demo Juan Santos" : `Demo ${role.replaceAll("_", " ")}`, role };
}
