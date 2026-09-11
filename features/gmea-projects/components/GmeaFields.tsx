"use client";
import {
  cloneElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type InputHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
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
  leadingIcon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; leadingIcon?: ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5 text-sm font-medium text-slate-700">
      <label htmlFor={id} className="block">{label}</label>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-px left-px grid w-12 place-items-center rounded-l-[11px] border-r border-slate-100 bg-slate-50 text-slate-500" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input id={id} className={inputClass + (leadingIcon ? " pl-14" : "")} {...props} />
      </div>
    </div>
  );
}

function formatAmount(value: number) {
  return value
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    : "";
}

export function MoneyField({
  label,
  value,
  onValueChange,
  required,
  leadingIcon,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  required?: boolean;
  leadingIcon?: ReactNode;
}) {
  const [display, setDisplay] = useState(() => formatAmount(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDisplay(formatAmount(value));
  }, [value]);

  function update(raw: string) {
    const plain = raw.replace(/,/g, "").trim();
    if (!plain) {
      setDisplay("");
      onValueChange(0);
      return;
    }
    if (!/^\d*(?:\.\d{0,2})?$/.test(plain)) return;
    const [whole = "", decimal] = plain.split(".");
    const grouped = (whole.replace(/^0+(?=\d)/, "") || "0").replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ",",
    );
    setDisplay(decimal === undefined ? grouped : grouped + "." + decimal);
    onValueChange(Number(plain));
  }

  return (
    <TextField
      label={label}
      required={required}
      leadingIcon={leadingIcon}
      inputMode="decimal"
      value={display}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setDisplay(formatAmount(value));
      }}
      onChange={(event) => update(event.target.value)}
    />
  );
}

export function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  required,
  maxLength,
  leadingIcon,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  leadingIcon?: ReactNode;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const listId = id + "-options";
  const [open, setOpen] = useState(false);
  const visible = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();
    return [...new Set(options)]
      .filter((option) => !query || option.toLocaleLowerCase().includes(query))
      .slice(0, 50);
  }, [options, value]);

  return (
    <div
      className={"relative space-y-1.5 text-sm font-medium text-slate-700 " +
        (open ? "z-30" : "")}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="block">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          className={inputClass + (leadingIcon ? " pl-14 pr-10" : " pr-10")}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
        />
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-px left-px grid w-12 place-items-center rounded-l-[11px] border-r border-slate-100 bg-slate-50 text-slate-500" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <button
          type="button"
          aria-label={"Show " + label.toLowerCase() + " options"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500"
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        >
          {visible.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-normal text-slate-700 hover:bg-teal-50 hover:text-teal-900"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
          {!visible.length && (
            <p className="px-3 py-2 text-xs font-normal text-slate-500">
              Enter a new value and save the expense.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
export function VatFields({
  mode,
  onChange,
}: {
  mode: VatMode;
  onChange: (mode: VatMode, rate: number) => void;
}) {
  return (
    <div className="grid gap-4">
      <Field label="VAT treatment">
        <select
          className={inputClass}
          value={mode}
          onChange={(e) => {
            const next = e.target.value as VatMode;
            onChange(next, next === "off" ? 0 : 12);
          }}
        >
          <option value="off">No VAT</option>
          <option value="inclusive">12% VAT included</option>
          <option value="exclusive">Add 12% VAT</option>
        </select>
      </Field>
      <p className="text-xs font-normal text-slate-500">
        VAT is fixed at 12% when applied.
      </p>
    </div>
  );
}
