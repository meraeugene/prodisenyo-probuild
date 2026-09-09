import Image from "next/image";
import { LuPlus as Plus } from "react-icons/lu";

export default function GmeaPortfolioHero({
  canEdit,
  onCreate,
}: {
  canEdit: boolean;
  onCreate?: () => void;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-[22px] bg-[#075e5b] text-white shadow-[0_18px_45px_-32px_rgba(3,62,60,.7)]">
      <Image
        src="/gmea-portfolio-architecture.png"
        alt="Contemporary commercial building"
        fill
        priority
        sizes="(min-width: 1024px) calc(100vw - 312px), 100vw"
        className="-z-20 object-cover object-center sm:object-right"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,83,79,.98)_0%,rgba(3,91,87,.88)_38%,rgba(3,82,79,.44)_72%,rgba(3,74,71,.58)_100%)]" />

      <div className="px-6 py-7 sm:px-8 lg:px-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">
              GMEA Marketing Corporation
            </p>
            <h1 className="mt-2.5 text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[42px]">
              Project portfolio
            </h1>
            <p className="mt-3 text-sm text-white/80 sm:text-[15px]">
              Your projects. Every contract, every cost.
            </p>
          </div>

          {canEdit && (
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/70 bg-white px-4 py-2.5 text-sm font-bold text-[#076d69] shadow-[0_8px_24px_-12px_rgba(0,0,0,.45)] transition hover:-translate-y-0.5 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={onCreate}
            >
              <Plus size={18} aria-hidden="true" />
              <span className="hidden sm:inline">New project</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
