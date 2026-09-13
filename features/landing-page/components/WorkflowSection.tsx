import LandingSectionHeading from "@/features/landing-page/components/LandingSectionHeading";
import { landingWorkflow } from "@/features/landing-page/utils/landingContent";

export default function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-24 bg-[#076d69] bg-[url('/landing/prodisenyo-building-blocks-login-teal.png')] bg-cover bg-center py-20 sm:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <LandingSectionHeading eyebrow="How ProBuild works" title="From assignment to close" description="Move each project forward with clear ownership and approvals." inverse />
        <ol className="mt-12 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
          {landingWorkflow.map((step, index) => (
            <li key={step.label} className="relative px-3 text-center">
              {index < landingWorkflow.length - 1 ? <span className="absolute left-[62%] top-5 hidden h-px w-[76%] bg-white/45 lg:block" aria-hidden="true" /> : null}
              <span className="relative z-10 mx-auto grid size-10 place-items-center rounded-full border border-teal-100/70 bg-[#076d69] text-sm font-bold text-white">{index + 1}</span>
              <h3 className="mt-4 text-sm font-bold text-white">{step.label}</h3>
              <p className="mt-2 text-xs leading-5 text-teal-50/70">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
