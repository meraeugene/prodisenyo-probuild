import LandingIcon from "@/features/landing-page/components/LandingIcon";
import LandingSectionHeading from "@/features/landing-page/components/LandingSectionHeading";
import { landingRoles } from "@/features/landing-page/utils/landingContent";

export default function RolesSection() {
  return (
    <section id="roles" className="scroll-mt-24 bg-[#0d4f48] py-20 sm:py-24">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
        <LandingSectionHeading
          eyebrow="For every role"
          title="The right view for every role"
          description="Role-based views keep work focused and approvals controlled."
          inverse
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {landingRoles.map((role) => (
            <article
              key={role.title}
              className="rounded-2xl border border-white/15 bg-white/[0.06] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-800">
                <LandingIcon name={role.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{role.title}</h3>
              <p className="mt-3 text-sm leading-6 text-teal-50/75">
                {role.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
