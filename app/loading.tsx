import { Building2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-apple-snow px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shadow-[0_18px_40px_rgba(31,106,55,0.12)]">
          <Building2 className="h-11 w-11" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col items-center">
          <p className="animate-pulse text-sm font-semibold uppercase tracking-[0.42em] text-apple-steel">
            Prodisenyo
          </p>
          <p className="animate-pulse text-2xl font-black uppercase tracking-[0.12em] text-apple-charcoal [animation-delay:180ms] sm:text-3xl">
            ProBuild
          </p>
        </div>
      </div>
    </div>
  );
}
