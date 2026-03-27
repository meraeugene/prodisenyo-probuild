function readPublicEnvValue(key: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value =
    key === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readServerEnvValue(key: "SUPABASE_SERVICE_ROLE_KEY" | "SUPABASE_STORAGE_BUCKET") {
  const value =
    key === "SUPABASE_SERVICE_ROLE_KEY"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.SUPABASE_STORAGE_BUCKET;

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getRequiredPublicEnvValue(
  key: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  const value = readPublicEnvValue(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getRequiredServerEnvValue(key: "SUPABASE_SERVICE_ROLE_KEY") {
  const value = readServerEnvValue(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function hasSupabaseEnv() {
  return Boolean(
    readPublicEnvValue("NEXT_PUBLIC_SUPABASE_URL") &&
      readPublicEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function getSupabaseBrowserEnv() {
  return {
    url: getRequiredPublicEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredPublicEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServerEnv() {
  return {
    ...getSupabaseBrowserEnv(),
    serviceRoleKey: getRequiredServerEnvValue("SUPABASE_SERVICE_ROLE_KEY"),
    storageBucket: readServerEnvValue("SUPABASE_STORAGE_BUCKET") || "attendance-reports",
  };
}
