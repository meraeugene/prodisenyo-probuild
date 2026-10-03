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
      <span className="shrink-0 text-[#076d69]">
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-xs font-normal text-[#53736f]">
          {label}
        </span>
        <span
          className={cn(
            "mt-1 block text-sm font-medium leading-5 text-[#1d1d1f] tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </span>
      </span>
    </>
  );

  const className =
    "workspace-header-status flex max-w-full items-center gap-3 rounded-[10px] bg-[#f4faf7] px-4 py-3 text-[#1d1d1f]";

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(
          className,
          "transition hover:bg-[#eaf5f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#076d69]",
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
          "transition hover:bg-[#eaf5f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#076d69]",
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
