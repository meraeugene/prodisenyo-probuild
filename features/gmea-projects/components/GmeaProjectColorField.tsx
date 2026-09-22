"use client";

import { useId } from "react";
import {
  PROJECT_COLOR_OPTIONS,
  contrastTextColor,
  projectSwatchStyle,
} from "../utils/projectAppearance";

export default function GmeaProjectColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">Container color</legend>
      <div className="flex flex-wrap items-center gap-2">
        {PROJECT_COLOR_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              title={option.label}
              aria-label={`${option.label} project color`}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 shadow-sm outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
              style={projectSwatchStyle(option.value)}
            >
              {selected && (
                <span
                  aria-hidden="true"
                  className="text-base font-bold"
                  style={{ color: contrastTextColor(option.value) }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
        <label htmlFor={id} className="ml-1 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
          Custom
          <input
            id={id}
            type="color"
            aria-label="Custom project color"
            value={value}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>
      <p className="text-xs font-normal text-slate-500">
        Matching Excel project titles automatically use their workbook tab color.
      </p>
    </fieldset>
  );
}
