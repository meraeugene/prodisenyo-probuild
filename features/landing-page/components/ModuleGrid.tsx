import LandingSectionHeading from "@/features/landing-page/components/LandingSectionHeading";
import { landingModules } from "@/features/landing-page/utils/landingContent";

export default function ModuleGrid() {
  return (
    <section id="modules" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <LandingSectionHeading eyebrow="Core modules" title="One platform for every project" description="Keep work, approvals, and costs together." />
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {landingModules.map((module) => (
            <article key={module.title} className="bg-white p-7">
              <h3 className="text-base font-bold tracking-[-0.02em] text-slate-950">{module.title}</h3>
              <p className="mt-2 max-w-[280px] text-sm leading-6 text-slate-500">{module.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
