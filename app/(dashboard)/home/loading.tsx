import { getCurrentProfile } from "@/lib/auth";
import HomePageSkeleton from "@/features/home/components/HomePageSkeleton";
export default async function Loading() { const profile = await getCurrentProfile(); return <HomePageSkeleton role={profile?.role ?? null} />; }
