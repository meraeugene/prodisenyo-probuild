import { getCurrentProfile } from "@/lib/auth";
import GmeaProjectsPageSkeleton from "@/features/gmea-projects/components/GmeaProjectsPageSkeleton";
import CeoGmeaProjectsSkeleton from "@/features/gmea-projects/components/CeoGmeaProjectsSkeleton";
export default async function Loading() { const profile = await getCurrentProfile(); return profile?.role === "ceo" ? <CeoGmeaProjectsSkeleton /> : <GmeaProjectsPageSkeleton />; }
