import Link from "next/link";
import { ArrowUpRight, Clock3, Settings } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";

const actions = [
  {
    href: "/request-overtime",
    title: "Request overtime",
    description: "Submit overtime and check your requests.",
    action: "View requests",
    icon: Clock3,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    href: "/settings",
    title: "Account settings",
    description: "Update your profile and password.",
    action: "Manage account",
    icon: Settings,
    tone: "bg-slate-100 text-slate-600",
  },
];

export default function EmployeeHomePage({ fullName, username }: { fullName: string | null; username: string }) {
  const name = fullName?.trim() || username.trim() || "there";

  return (
    <main className="min-h-full space-y-7 bg-white p-4 sm:p-6 lg:p-8">
      <DashboardPageHero eyebrow="Employee workspace" title={`Welcome, ${name}`} description="Your requests and account tools, organized in one place." actions={<Link href="/request-overtime" className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#076d69] shadow-sm transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-fit">
          Request overtime <ArrowUpRight size={16} aria-hidden="true" />
        </Link>} />

      <section aria-labelledby="employee-quick-access" className="space-y-5">
        <h2 id="employee-quick-access" className="text-lg font-semibold tracking-tight text-slate-950">Quick access</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {actions.map(({ href, title, description, action, icon: Icon, tone }) => (
            <Link key={href} href={href} className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white/80 shadow-[0_16px_42px_-28px_rgba(15,23,42,.3)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_-26px_rgba(15,23,42,.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
              <div className="flex-1 p-6">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={21} aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 group-hover:text-[#076d69]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 text-sm font-semibold text-[#076d69]">
                <span>{action}</span><ArrowUpRight size={16} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
