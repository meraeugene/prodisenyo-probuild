"use client";

import RoleHintTypewriter from "@/features/home/components/RoleHintTypewriter";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function RoleGreetingHero({ dateLabel, title, messages }: {
  dateLabel: string;
  title: string;
  messages: string[];
}) {
  return (
    <DashboardPageHero
      eyebrow={dateLabel}
      title={title}
      description={<RoleHintTypewriter messages={messages} />}
    />
  );
}
