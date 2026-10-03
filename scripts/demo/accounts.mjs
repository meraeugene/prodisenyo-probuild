import { DEMO_ROLES, SEED_TAG, demoAccount } from "./context.mjs";
import { checked, listAuthUsers } from "./client.mjs";

export function isDemoAccount(user) {
  return user.app_metadata?.demo_seed === SEED_TAG && DEMO_ROLES.some((role) => user.email === demoAccount(role).email);
}

export async function seedDemoAccounts(client, password) {
  const existing = await listAuthUsers(client);
  // Check all collisions before creating any account. Never adopt a real user.
  for (const role of DEMO_ROLES) {
    const account = demoAccount(role);
    const user = existing.find((entry) => entry.email?.toLowerCase() === account.email);
    if (user && !isDemoAccount(user)) throw new Error(`Account ${account.username} already exists and is not owned by this seed.`);
    const profiles = checked(await client.from("profiles").select("id").eq("username", account.username), "Check demo username");
    if (profiles.some((profile) => profile.id !== user?.id)) throw new Error(`Username ${account.username} belongs to another profile.`);
  }
  const users = {};
  for (const role of DEMO_ROLES) {
    const account = demoAccount(role);
    let user = existing.find((entry) => entry.email === account.email);
    if (!user) {
      const result = checked(await client.auth.admin.createUser({ email: account.email, password, email_confirm: true, app_metadata: { demo_seed: SEED_TAG }, user_metadata: account }), `Create ${account.username}`);
      user = result.user;
    }
    checked(await client.from("profiles").upsert({ id: user.id, ...account, is_active: true }, { onConflict: "id", ignoreDuplicates: true }), `Create ${account.username} profile`);
    users[role] = user.id;
  }
  return users;
}
