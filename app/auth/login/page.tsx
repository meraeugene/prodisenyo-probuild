import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { BriefcaseBusiness, Building2, ShieldCheck } from "lucide-react";
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
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.32),transparent_32%,rgba(174,220,188,0.08)_100%)]" />
      <div className="absolute left-[-80px] top-20 h-64 w-64 rounded-full bg-apple-mist/50 blur-3xl" />
      <div className="absolute bottom-[-40px] right-[-40px] h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid w-full gap-6 lg:grid-cols-[0.82fr_1fr] lg:items-stretch">
          <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#112e1a_0%,#1c4728_42%,#245f34_100%)] p-7 text-white shadow-[0_24px_64px_rgba(17,46,26,0.22)] sm:p-8">
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
                      Prodisenyo PayTrack
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                      Payroll System
                    </p>
                  </div>
                </div>

                <div className="max-w-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--theme-chart-5))]">
                    Secure Sign In
                  </p>
                  <h1 className="mt-4 max-w-sm text-4xl font-semibold tracking-[-0.05em] text-white sm:text-[44px]">
                    Payroll, attendance, and reports in one place.
                  </h1>
                </div>
              </div>

              <div className="grid gap-4 lg:mt-auto">
                <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">
                      System Flow
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                      Simple workflow
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/8 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--theme-chart-5))]/25 bg-[rgb(var(--theme-chart-5))]/35 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                        01
                      </span>
                      <p className="mt-2 text-sm font-medium text-white">
                        Upload logs
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--theme-chart-5))]/25 bg-[rgb(var(--theme-chart-5))]/35 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                        02
                      </span>
                      <p className="mt-2 text-sm font-medium text-white">
                        Review hours
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--theme-chart-5))]/25 bg-[rgb(var(--theme-chart-5))]/35 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                        03
                      </span>
                      <p className="mt-2 text-sm font-medium text-white">
                        Release payroll
                      </p>
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
                        <p className="mt-1 text-xs text-white/65">
                          admin access
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-semibold tracking-[-0.04em]">
                          1
                        </p>
                        <p className="mt-1 text-xs text-white/65">
                          unified dashboard
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white backdrop-blur-md">
                    <BriefcaseBusiness className="h-4 w-4 text-[rgb(var(--theme-chart-5))]" />
                    Internal workspace
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex lg:items-stretch lg:pl-4">
            <div className="flex w-full flex-col rounded-[30px] border border-apple-mist bg-white/92 p-6 shadow-[0_24px_60px_rgba(24,83,43,0.10)] backdrop-blur-xl sm:p-8 lg:h-full lg:max-w-[560px]">
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
                    Need an account? Contact your payroll administrator for
                    access.
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
