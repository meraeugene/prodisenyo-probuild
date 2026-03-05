export // ── Pagination button ──────────────────────────────────
function PageButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold
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
