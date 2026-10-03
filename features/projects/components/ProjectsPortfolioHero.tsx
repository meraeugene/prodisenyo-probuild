import { Plus } from "lucide-react";
export default function ProjectsPortfolioHero({ eyebrow, description, onCreate }: { eyebrow: string; description: string; onCreate?: () => void }) {
 return <header className="flex flex-wrap items-start justify-between gap-4 pb-2">
  <div><p className="mb-5 text-xs text-[#53736f]">Workspace <span aria-hidden="true" className="mx-2">/</span> {eyebrow}</p><h1 className="text-[28px] font-semibold tracking-[-.04em] text-[#1d1d1f] sm:text-[32px]">Projects</h1><p className="mt-1 text-sm leading-6 text-[#53736f]">{description}</p></div>
  {onCreate && <button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#076d69] px-4 text-sm font-medium text-white shadow-workspace-button transition hover:bg-[#065c59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#076d69] sm:mt-9"><Plus size={16} />New project</button>}
 </header>;
}
