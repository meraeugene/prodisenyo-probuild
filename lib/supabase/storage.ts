import { getSupabaseBrowserEnv } from "@/lib/env";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

export function getStoragePublicUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;

  const { url } = getSupabaseBrowserEnv();
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${url}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

export function getProfileAvatarPublicUrl(path: string | null | undefined) {
  return getStoragePublicUrl(PROFILE_AVATAR_BUCKET, path);
}
