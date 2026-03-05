// ── Rate input with custom/default badge ───────────────
export function RateInput({
  value,
  isCustom,
  onChange,
  onClear,
}: {
  value: number;
  isCustom: boolean;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative flex items-center gap-1">
      <span className="text-xs text-apple-steel">₱</span>
      <input
        type="number"
        value={value || ""}
        min={0}
        step="0.01"
        onChange={(e) => onChange(e.target.value)}
        className="w-20 px-2 py-1.5 rounded-xl border border-apple-silver bg-white text-xs font-mono
          focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
      />
      {isCustom && (
        <button
          onClick={onClear}
          title="Reset to default"
          className="text-2xs text-apple-steel hover:text-apple-charcoal transition-colors underline"
        >
          reset
        </button>
      )}
    </div>
  );
}
