import { redirect } from "next/navigation";
import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";
import {
  ArrowDown,
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { getCurrentProfile, getRoleHomePath } from "@/lib/auth";

export const metadata = {
  title: "Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(getRoleHomePath(profile.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next ?? null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(174,220,188,0.34),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(56,140,82,0.18),transparent_28%),linear-gradient(180deg,#f4fbf6_0%,#ffffff_46%,#f2faf5_100%)]">
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-stretch px-0 py-0 sm:items-center sm:px-8 sm:py-10 lg:px-10">
        <div className="grid w-full gap-0 sm:gap-6 lg:grid-cols-[0.82fr_1fr] lg:items-stretch">
          <section className="order-1 relative overflow-hidden rounded-none bg-[linear-gradient(135deg,#112e1a_0%,#1c4728_42%,#245f34_100%)] p-7 text-white shadow-[0_24px_64px_rgba(17,46,26,0.22)] sm:rounded-[32px] sm:p-8 lg:order-1">
            <div className="absolute right-[-60px] top-[-80px] h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-[-70px] left-[-30px] h-52 w-52 rounded-full bg-[rgb(var(--theme-chart-5))]/15 blur-2xl" />

            <div className="relative flex h-full flex-col gap-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-3 py-2 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--theme-chart-5))]/25 bg-[rgb(var(--theme-chart-5))]/35 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <Building2 className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.03em]">
                      Prodisenyo ProBuild
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                      Integrated System
                    </p>
                  </div>
                </div>

                <div className="max-w-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--theme-chart-5))]">
                    Secure Sign In
                  </p>
                  <h1 className="mt-4 max-w-sm text-4xl font-semibold tracking-[-0.05em] text-white sm:text-[44px]">
                    Payroll, budget, and cost estimate in one place.
                  </h1>
                </div>
              </div>

              <div className="grid flex-1 gap-4 lg:mt-auto">
                <div className="">
                  <div className="relative mx-auto flex min-h-full items-end justify-center">
                    <Image
                      src="/login-robot-team.png"
                      alt="Payroll robot team"
                      width={1152}
                      height={768}
                      priority
                      className="relative z-10 h-auto w-full object-contain object-bottom drop-shadow-[0_28px_56px_rgba(0,0,0,0.24)]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">
                    Access
                  </p>
                  <div className="mt-4 flex items-end gap-6">
                    <div>
                      <p className="text-3xl font-semibold tracking-[-0.04em]">
                        24/7
                      </p>
                      <p className="mt-1 text-xs text-white/65">admin access</p>
                    </div>
                    <div>
                      <p className="text-3xl text-center font-semibold tracking-[-0.04em]">
                        1
                      </p>
                      <p className="mt-1 text-xs text-white/65">
                        unified dashboard
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="sm:inline-flex hidden  items-center justify-center gap-2 rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white backdrop-blur-md">
                    <BriefcaseBusiness className="h-4 w-4 text-[rgb(var(--theme-chart-5))]" />
                    Internal Workspace{" "}
                  </div>
                  <a
                    href="#login-panel"
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-emerald-200/60 bg-[linear-gradient(135deg,#97f3b2,#6fdd8d)] px-5 py-3 text-sm font-semibold text-[#0f3a1f] shadow-[0_10px_24px_rgba(93,211,132,0.30)] transition hover:brightness-105 sm:hidden"
                  >
                    <ArrowDown className="h-4 w-4" />
                    Get started
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section
            id="login-panel"
            className="order-2 flex lg:order-2 lg:items-stretch lg:pl-4"
          >
            <div className="flex w-full flex-col rounded-none border border-apple-mist bg-white/92 p-6 shadow-[0_24px_60px_rgba(24,83,43,0.10)] backdrop-blur-xl sm:rounded-[30px] sm:p-8 lg:h-full lg:max-w-[560px]">
              <div className="mb-8 ">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Account Login
                  </p>
                  <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-apple-charcoal">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-apple-steel">
                    Sign in to continue managing attendance uploads, payroll
                    generation, and analytics.
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col">
                <LoginForm nextPath={nextPath} />
                <div className="mt-auto pt-6">
                  <div className="rounded-[24px] border border-apple-mist bg-[linear-gradient(180deg,rgba(222,243,229,0.5),rgba(255,255,255,0.95))] p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1f6a37] shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-apple-charcoal">
                          Protected payroll workspace
                        </p>
                        <p className="mt-1 text-xs leading-5 text-apple-steel">
                          Use your authorized company account to access payroll
                          operations and reporting tools.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-6 text-center text-xs text-apple-steel">
                    Need an account? Contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
