import LandingSectionHeading from "@/features/landing-page/components/LandingSectionHeading";
import { landingRoles } from "@/features/landing-page/utils/landingContent";

export default function RolesSection() {
  return (
    <section id="roles" className="scroll-mt-24 border-t border-slate-100 bg-[#fbfcfc] py-20 sm:py-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <LandingSectionHeading eyebrow="For every role" title="The right view for every role" description="Role-based views keep work focused and approvals controlled." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {landingRoles.map((role) => (
            <article
              key={role.title}
              className="rounded-2xl border border-slate-200 bg-white p-7"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#076d69]">Role workspace</p>
              <h3 className="mt-8 text-xl font-bold tracking-[-0.03em] text-slate-950">{role.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{role.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
