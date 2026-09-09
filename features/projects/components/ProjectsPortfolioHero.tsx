import Image from "next/image";
import { Plus } from "lucide-react";

export default function ProjectsPortfolioHero({
  eyebrow,
  description,
  onCreate,
}: {
  eyebrow: string;
  description: string;
  onCreate?: () => void;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-[22px] bg-[#075e5b] px-6 py-8 text-white shadow-[0_18px_45px_-32px_rgba(3,62,60,.7)] sm:px-9">
      <Image
        src="/gmea-portfolio-architecture.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) calc(100vw - 320px), 100vw"
        className="-z-20 object-cover object-right"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,83,79,.98)_0%,rgba(3,91,87,.9)_40%,rgba(3,82,79,.46)_75%,rgba(3,74,71,.62)_100%)]" />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.045em] sm:text-[42px]">
            Prodisenyo Projects
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/82">
            {description}
          </p>
        </div>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/70 bg-white px-5 text-sm font-bold text-[#076d69] shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus size={17} /> New project
          </button>
        )}
      </div>
    </header>
  );
}
