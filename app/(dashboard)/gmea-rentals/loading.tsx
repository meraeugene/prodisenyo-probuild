import GmeaRentalsSkeleton from "@/features/gmea-rentals/components/GmeaRentalsSkeleton";
import { getCurrentProfile } from "@/lib/auth";
export default async function Loading() { const profile = await getCurrentProfile(); return <GmeaRentalsSkeleton view="rentals" canEdit={profile?.role !== "ceo"} />; }
