export // ── Pagination button ──────────────────────────────────
function PageButton({
  children,
  onClick,
  disabled,
  active,
  wide,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${wide ? "px-3 min-w-[54px]" : "w-8"} h-8 rounded-xl flex items-center justify-center text-xs font-semibold whitespace-nowrap
        transition-all duration-150
        ${
          active
            ? "bg-apple-charcoal text-white"
            : disabled
              ? "text-apple-silver cursor-not-allowed"
              : "text-apple-ash hover:bg-apple-mist border border-apple-silver"
        }`}
    >
      {children}
    </button>
  );
}
