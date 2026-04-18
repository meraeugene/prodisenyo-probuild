import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ClipboardList,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  Receipt,
  Settings,
  Trash2,
  Upload,
  UserRoundSearch,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppRole } from "@/types/database";
import RoleHintTypewriter from "@/features/home/components/RoleHintTypewriter";

type FeatureCard = {
  href: string;
  title: string;
  description: string;
};

const FEATURE_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/upload-attendance": Upload,
  "/review-attendance": UserRoundSearch,
  "/generate-payroll": FolderKanban,
  "/budget-tracker": Receipt,
  "/payroll-reports": LineChart,
  "/overtime-approvals": Clock3,
  "/estimate-reviews": Calculator,
  "/add-user": Users,
  "/reset-data": Trash2,
  "/request-overtime": Clock3,
  "/settings": Settings,
  "/cost-estimator": Calculator,
  "/request-material": ClipboardList,
};

const ROLE_FEATURES: Record<AppRole, FeatureCard[]> = {
  ceo: [
    {
      href: "/dashboard",
      title: "Dashboard",
      description: "Monitor company-wide payroll and review queues.",
    },
    {
      href: "/budget-tracker",
      title: "Budget Tracker",
      description: "Track project budget usage and spending status.",
    },
    {
      href: "/payroll-reports",
      title: "Payroll Reports",
      description: "Review submitted payroll runs and approvals.",
    },
    {
      href: "/overtime-approvals",
      title: "Overtime Approvals",
      description: "Approve or reject pending overtime requests.",
    },
    {
      href: "/estimate-reviews",
      title: "Estimate Reviews",
      description: "Check project estimate submissions for approval.",
    },
    {
      href: "/add-user",
      title: "User Management",
      description: "Create and manage employee system accounts.",
    },
    {
      href: "/reset-data",
      title: "Reset Data",
      description: "Clear workspace payroll and attendance data safely.",
    },
  ],
  payroll_manager: [
    {
      href: "/upload-attendance",
      title: "Upload Attendance",
      description: "Upload and prepare site attendance files.",
    },

    {
      href: "/request-overtime",
      title: "Request Overtime",
      description: "Submit overtime requests for team members.",
    },
    {
      href: "/budget-tracker",
      title: "Budget Tracker",
      description: "Track project budget usage and spending status.",
    },
    {
      href: "/settings",
      title: "Settings",
      description: "Manage account settings and preferences.",
    },
  ],
  engineer: [
    {
      href: "/budget-tracker",
      title: "Budget Tracker",
      description: "Track project budget usage and spending status.",
    },
    {
      href: "/cost-estimator",
      title: "Cost Estimator",
      description: "Prepare project estimates and cost breakdowns.",
    },
    {
      href: "/request-overtime",
      title: "Request Overtime",
      description: "Submit overtime requests when needed.",
    },
    {
      href: "/request-material",
      title: "Request Material",
      description: "Create and track material requests for projects.",
    },

    {
      href: "/settings",
      title: "Settings",
      description: "Manage account settings and preferences.",
    },
  ],
  employee: [
    {
      href: "/budget-tracker",
      title: "Budget Tracker",
      description: "Track project budget usage and spending status.",
    },
    {
      href: "/request-overtime",
      title: "Request Overtime",
      description: "Send overtime requests to your approver.",
    },
    {
      href: "/settings",
      title: "Settings",
      description: "Manage account settings and preferences.",
    },
  ],
};

function getGreetingMessage(hour: number) {
  if (hour < 12) return "Good morny";
  if (hour < 18) return "Good afty";
  return "Good evee";
}

function getFirstName(fullName: string | null, username: string) {
  const source = (fullName?.trim() || username.trim() || "there").replace(
    /[_-]+/g,
    " ",
  );
  const [first] = source.split(/\s+/);
  return first || "there";
}

function getDateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date())
    .toUpperCase();
}

function getRoleHints(role: AppRole) {
  if (role === "ceo") {
    return [
      "Oversee approvals, reports, and company-wide operations from your dashboard.",
      "Review pending overtime and payroll submissions from one place.",
      "Track budgets, estimates, and key workflow health for every team.",
    ];
  }

  if (role === "payroll_manager") {
    return [
      "You are set to process attendance and payroll workflow today.",
      "Upload attendance, validate records, and keep payroll timelines on track.",
      "Review requests quickly to avoid payroll delays for your teams.",
    ];
  }

  if (role === "engineer") {
    return [
      "Focus on estimates and material requests to keep projects moving.",
      "Use budget tracker to monitor spending before costs run over plan.",
      "Submit overtime and material requests early to avoid site delays.",
    ];
  }

  return [
    "Check overtime and account settings to stay updated for your shift.",
    "Monitor your budget tracker and requests so work stays on schedule.",
    "Keep your profile updated for smoother payroll and approvals.",
  ];
}

export default function RoleHomePage({
  role,
  fullName,
  username,
}: {
  role: AppRole;
  fullName: string | null;
  username: string;
}) {
  const firstName = getFirstName(fullName, username);
  const greeting = getGreetingMessage(new Date().getHours());
  const dateLabel = getDateLabel();
  const roleHints = getRoleHints(role);
  const featureCards = ROLE_FEATURES[role];

  return (
    <main className="space-y-6 p-0 sm:p-6">
      <section className="relative overflow-visible rounded-none bg-[linear-gradient(140deg,#114023,#1f6a37,#2e8b57)] px-4 pb-3 pt-5 text-white shadow-[0_16px_34px_rgba(22,101,52,0.2)] sm:rounded-[18px] sm:px-6 sm:pb-4 sm:pt-6">
        <div className="pointer-events-none absolute -bottom-16 -left-[118px] w-full  ">
          <Image
            src="/login-robot.png"
            alt="Workflow robot"
            width={420}
            height={420}
            priority
            className="object-contain drop-shadow-[0_14px_26px_rgba(0,0,0,0.22)]"
          />
        </div>

        <div className="pl-[122px] sm:pl-[170px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">
            {dateLabel}
          </p>
          <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
            {greeting}, {firstName}!
          </h1>

          <div className="relative mt-2 max-w-lg rounded-[18px] bg-white px-3 py-2 text-apple-charcoal shadow-[0_10px_22px_rgba(15,23,42,0.15)] sm:px-4 sm:py-3">
            <span
              aria-hidden="true"
              className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-white"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
              Prody
            </p>
            <p className="mt-1 text-xs leading-5 text-apple-steel sm:text-sm">
              <RoleHintTypewriter messages={roleHints} />
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-4 sm:p-0">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-apple-steel">
            Available Features
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
            Start from here
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = FEATURE_ICONS[card.href] ?? FolderKanban;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[18px] border border-emerald-200 bg-white p-4 text-emerald-950 shadow-[0_12px_26px_rgba(14,53,30,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_34px_rgba(14,53,30,0.18)]"
              >
                <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-emerald-100/60 blur-2xl transition duration-300 group-hover:bg-emerald-100" />

                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_6px_14px_rgba(22,101,52,0.12)] transition duration-300 group-hover:scale-105 group-hover:border-emerald-300 group-hover:text-emerald-800">
                  <Icon size={18} />
                </div>

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <p className="text-[20px] font-semibold tracking-[-0.02em] text-emerald-950">
                    {card.title}
                  </p>
                </div>

                <p className="relative z-10 mt-4 text-base leading-6 text-emerald-800">
                  {card.description}
                </p>

                <div className="relative z-10 mt-2 flex items-center justify-end">
                  <ArrowRight
                    size={16}
                    className="text-emerald-700 transition duration-300 group-hover:translate-x-1 group-hover:text-emerald-800"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
