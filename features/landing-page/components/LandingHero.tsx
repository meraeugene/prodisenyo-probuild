import Link from "next/link";

const capabilities = [
  ["Project control", "Assignments and progress"],
  ["Estimate to buy", "BOQs and procurement"],
  ["Payroll ready", "Attendance and approval"],
  ["Budget visibility", "Committed and actual costs"],
];

export default function LandingHero() {
  return (
    <section className="flex min-h-screen flex-col bg-[#076d69] bg-[url('/landing/prodisenyo-building-blocks-login-teal.png')] bg-cover bg-center pt-[62px] text-white">
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-teal-100/80 sm:text-xs">Construction, connected</p>
        <h1 className="mt-5 max-w-[820px] text-balance text-[44px] font-bold leading-[0.98] tracking-[-0.055em] sm:text-[62px] lg:text-[72px]">Construction work,<br className="hidden sm:block" /> in one place.</h1>
        <p className="mt-6 max-w-[680px] text-[15px] leading-7 text-teal-50/85 sm:text-lg">Manage projects, costs, materials, progress, and payroll in one system.</p>
        <div className="mt-8 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
          <Link href="/auth/login?switch=1" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-[#076966] transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#076d69]">Sign In to ProBuild</Link>
          <a href="#modules" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/70 bg-[#044f4c]/35 px-5 text-sm font-bold text-white transition-colors hover:bg-[#044f4c]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#076d69]">Explore Modules</a>
        </div>
      </div>
      <div className="border-t border-white/15 bg-[#055f5b]/80">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4">
          {capabilities.map(([title, description], index) => (
            <div key={title} className={`py-5 text-center ${index % 2 ? "border-l border-white/15" : ""} ${index > 1 ? "border-t border-white/15 lg:border-t-0" : ""} ${index > 0 ? "lg:border-l lg:border-white/15" : ""}`}>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 hidden text-[11px] text-teal-50/60 sm:block">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
