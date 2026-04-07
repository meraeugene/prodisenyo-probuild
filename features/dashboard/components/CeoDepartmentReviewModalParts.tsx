"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModalShell({
  title,
  eyebrow,
  subtitle,
  onClose,
  children,
  size = "max-w-6xl",
}: {
  title: string;
  eyebrow: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: string;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]",
          size,
        )}
      >
        <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                {eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {title}
              </h2>
              <p className="mt-2 text-sm text-white/80">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close payroll review modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-400/25 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-3 py-2 text-white">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function MetricRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <tr>
      <td className="px-4 py-2 text-apple-steel">{label}</td>
      <td
        className={cn(
          "px-4 py-2 text-right font-semibold text-apple-charcoal",
          valueClass,
        )}
      >
        {value}
      </td>
    </tr>
  );
}
