import type { ProjectField } from "../types";
export default function Field({
  name,
  label,
  type = "text",
  error,
  onChange,
}: {
  name: ProjectField;
  label: string;
  type?: string;
  error?: string;
  onChange?: () => void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        aria-invalid={Boolean(error)}
        onChange={onChange}
        className={`mt-1 h-11 w-full rounded-xl border px-3 font-normal outline-none transition ${
          error
            ? "border-red-500 focus:border-red-600"
            : "border-slate-200 focus:border-teal-700"
        }`}
      />
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

