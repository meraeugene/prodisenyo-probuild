import Link from "next/link";

export default function LandingCta() {
  return (
    <section className="bg-[#076d69] bg-[url('/landing/prodisenyo-building-blocks-login-teal.png')] bg-cover bg-center px-5 py-16 text-center text-white sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[860px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-100/75">Ready to manage projects in one place?</p>
        <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-[42px]">Bring planning, purchasing, progress, payroll, and costs together.</h2>
        <div className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:flex-row">
          <Link href="/auth/login?switch=1" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-white px-6 text-sm font-bold text-[#076966] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Sign In</Link>
          <a href="#modules" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/70 bg-[#044f4c]/35 px-6 text-sm font-bold text-white hover:bg-[#044f4c]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Explore the product</a>
        </div>
      </div>
    </section>
  );
}
