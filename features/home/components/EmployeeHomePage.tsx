import Link from "next/link";
import { ArrowUpRight, Clock3, Settings } from "lucide-react";

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
    <main className="min-h-full space-y-7 bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-6 rounded-3xl bg-[#075e5b] p-6 text-white sm:p-8 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Home</p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl">Welcome, {name}</h1>
          <p className="mt-3 text-sm text-teal-50/80">Your requests and account, in one place.</p>
        </div>
        <Link href="/request-overtime" className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#076d69] transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-800">
          Request overtime <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <section aria-labelledby="employee-quick-access" className="space-y-5">
        <h2 id="employee-quick-access" className="text-lg font-semibold tracking-tight text-slate-950">Quick access</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {actions.map(({ href, title, description, action, icon: Icon, tone }) => (
            <Link key={href} href={href} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)] transition-shadow hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
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
