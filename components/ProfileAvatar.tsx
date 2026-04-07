"use client";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  name?: string | null;
  fallback?: string;
  sizeClassName?: string;
  textClassName?: string;
};

function getInitials(name?: string | null, fallback = "U") {
  const source = name?.trim() || "User";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase() || fallback;
  }

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || fallback
  );
}

export default function ProfileAvatar({
  avatarUrl,
  name,
  fallback = "U",
  sizeClassName = "h-10 w-10",
  textClassName = "text-xs",
}: ProfileAvatarProps) {
  const initials = getInitials(name, fallback);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-apple-mist font-semibold text-apple-charcoal ${sizeClassName} ${textClassName}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name?.trim() ? `${name} avatar` : "Profile avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
