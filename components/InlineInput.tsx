export // ── Inline editable input ──────────────────────────────
function InlineInput({
  value,
  onChange,
  suffix,
  highlight = false,
}: {
  value: number;
  onChange: (v: string) => void;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        defaultValue={value}
        key={value}
        min={0}
        step="0.5"
        onChange={(e) => onChange(e.target.value)}
        className={`w-14 px-2 py-1.5 rounded-xl border text-xs font-mono font-medium text-center
          focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal
          transition-all
          ${
            highlight
              ? "bg-apple-snow border-apple-silver text-apple-charcoal"
              : "bg-transparent border-transparent hover:border-apple-silver hover:bg-apple-snow"
          }`}
      />
      <span className="text-2xs text-apple-steel">{suffix}</span>
    </div>
  );
}
