import { Settings } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import SignOutButton from "@/components/auth/SignOutButton";
import { getProfileAvatarPublicUrl } from "@/lib/supabase/storage";
import { formatSidebarRole } from "../utils/profilePresentation";
import type { SidebarProfile } from "../types";
import SidebarNavigationLink from "./SidebarNavigationLink";
import SidebarTooltip from "./SidebarTooltip";

export default function SidebarAccount({ profile, pathname, collapsed, onNavigate }: {
  profile: SidebarProfile | null; pathname: string; collapsed: boolean; onNavigate: () => void;
}) {
  return (
    <div className="mt-auto pt-8">
      <div className="space-y-1 border-t border-teal-900/[0.06] pt-3">
        <SidebarNavigationLink item={{ href: "/settings", label: "Settings", icon: Settings }} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
        <SidebarTooltip active={collapsed} label="Logout"><div><SignOutButton variant="sidebar" collapsed={collapsed} /></div></SidebarTooltip>
      </div>
      <div className={`mt-4 flex items-center gap-2.5 border-t border-teal-900/[0.06] py-4 ${collapsed ? "justify-center" : "px-2"}`}>
        <ProfileAvatar avatarUrl={getProfileAvatarPublicUrl(profile?.avatar_path)} name={profile?.full_name?.trim() || profile?.username} sizeClassName="h-8 w-8" textClassName="text-[10px]" />
        {!collapsed && <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[#1d1d1f]">{profile?.full_name?.trim() || profile?.username || "Signed-in user"}</p>
          <p className="mt-1 truncate text-[10px] text-[#53736f]">{formatSidebarRole(profile?.role ?? null)}</p>
        </div>}
      </div>
    </div>
  );
}
