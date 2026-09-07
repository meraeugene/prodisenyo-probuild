"use client";
import {
  cloneElement,
  useId,
  type ReactElement,
  type ReactNode,
  type InputHTMLAttributes,
} from "react";
import type { VatMode } from "../types";
import { inputClass } from "../utils/gmeaConstants";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5 text-sm font-medium text-slate-700">
      <label htmlFor={id} className="block">
        {label}
      </label>
      {cloneElement(children as ReactElement<{ id: string }>, { id })}
    </div>
  );
}
export function TextField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <Field label={label}>
      <input className={inputClass} {...props} />
    </Field>
  );
}
export function VatFields({
  mode,
  rate,
  onChange,
}: {
  mode: VatMode;
  rate: number;
  onChange: (mode: VatMode, rate: number) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="VAT treatment">
        <select
          className={inputClass}
          value={mode}
          onChange={(e) =>
            onChange(
              e.target.value as VatMode,
              e.target.value === "off" ? 0 : rate,
            )
          }
        >
          <option value="off">No VAT</option>
          <option value="inclusive">Amount includes VAT</option>
          <option value="exclusive">Add VAT to amount</option>
        </select>
      </Field>
      {mode !== "off" && (
        <TextField
          label="VAT rate (%)"
          type="number"
          step="0.01"
          min="0.01"
          max="100"
          required
          value={rate || ""}
          onChange={(e) => onChange(mode, Number(e.target.value))}
        />
      )}
    </div>
  );
}
