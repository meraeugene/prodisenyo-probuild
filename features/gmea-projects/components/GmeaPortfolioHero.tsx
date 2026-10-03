import { LuPlus as Plus } from "react-icons/lu";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function GmeaPortfolioHero({ canEdit, onCreate }: { canEdit: boolean; onCreate?: () => void; }) {
  return (
    <DashboardPageHero
      eyebrow="GMEA Marketing Corporation" title="Project portfolio" description="Your projects. Every contract, every cost."
      actions={canEdit && (
        <button type="button" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/70 bg-white px-4 py-2.5 text-sm font-bold text-[#076d69] shadow-workspace-button transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={onCreate}>
          <Plus size={18} aria-hidden="true" />
          <span className="hidden sm:inline">New project</span>
          <span className="sm:hidden">New</span>
        </button>
      )}
    />
  );
}
