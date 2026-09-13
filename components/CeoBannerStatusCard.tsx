import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CeoBannerStatusCardProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  href?: string;
  onClick?: () => void;
  valueClassName?: string;
  ariaLabel?: string;
};

export default function CeoBannerStatusCard({
  icon: Icon,
  label,
  value,
  href,
  onClick,
  valueClassName,
  ariaLabel,
}: CeoBannerStatusCardProps) {
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 block truncate whitespace-nowrap text-2xl font-bold leading-none text-white tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </span>
      </span>
    </>
  );

  const className =
    "flex min-w-[210px] max-w-full shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-white/12 px-4 py-3 text-white backdrop-blur-sm";

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(
          className,
          "transition hover:border-white/35 hover:bg-[#075e5b]/72 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        )}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          className,
          "transition hover:border-white/35 hover:bg-[#075e5b]/72 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
