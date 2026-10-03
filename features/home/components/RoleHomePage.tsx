import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AppRole } from "@/types/database";
import RoleGreetingHero from "@/features/home/components/RoleGreetingHero";
import EmployeeHomePage from "./EmployeeHomePage";

import { ROLE_FEATURES } from "../utils/homeFeatures";

function getGreetingMessage(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getPhilippineHour() {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      hourCycle: "h23",
      timeZone: "Asia/Manila",
    }).format(new Date()),
  );
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
    timeZone: "Asia/Manila",
  })
    .format(new Date())
    .toUpperCase();
}

function getRoleHints(role: AppRole) {
  if (role === "admin") {
    return [
      "Manage user accounts and platform administration.",
      "Keep administrative tools separate from executive workflows.",
      "Review account access before changing workspace data.",
    ];
  }

  if (role === "ceo") {
    return [
      "Review approvals and reports with a quick daily check.",
      "Track budgets and estimate health across active projects.",
      "Keep company workflows moving without bottlenecks.",
    ];
  }

  if (role === "payroll_manager") {
    return [
      "Process attendance and payroll tasks for today.",
      "Validate records before each payroll run.",
      "Review incoming requests early to avoid delays.",
    ];
  }

  if (role === "engineer") {
    return [
      "Focus on estimates and material planning today.",
      "Track spending before project costs rise too fast.",
      "Submit requests early to keep work on plan.",
    ];
  }

  return [
    "Check overtime and settings for your shift.",
    "Submit overtime requests early for faster approval.",
    "Keep your profile and account settings up to date.",
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
  const greeting = getGreetingMessage(getPhilippineHour());
  const dateLabel = getDateLabel();
  const roleHints = getRoleHints(role);
  const featureCards = ROLE_FEATURES[role];

  if (role === "employee")
    return <EmployeeHomePage fullName={fullName} username={username} />;

  return (
    <main className="min-h-full space-y-6 bg-white p-4 sm:p-6">
      <RoleGreetingHero
        dateLabel={dateLabel}
        title={`${greeting}, ${firstName}!`}
        messages={roleHints}
      />

      <section>
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
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-[22px] border border-transparent bg-white p-5 text-teal-950 shadow-workspace-button  transition-colors duration-200  hover:border-teal-100 "
              >

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-teal-950">
                    {card.title}
                  </p>
                </div>

                <p className="relative z-10 mt-3 text-sm leading-6 text-teal-800">
                  {card.description}
                </p>

                <div className="relative z-10 mt-2 flex items-center justify-end">
                  <ArrowRight
                    size={16}
                    className="text-teal-700 transition duration-300  group-hover:text-teal-800"
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
