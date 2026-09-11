"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { inputClass } from "../utils/gmeaConstants";
import {
  parseExpenseDescriptions,
  serializeExpenseDescriptions,
} from "../utils/expenseDescriptions";

export default function GmeaExpenseItemsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState(() => {
    const initialItems = parseExpenseDescriptions(value);
    return initialItems.length ? initialItems : [""];
  });
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function updateItems(nextItems: string[]) {
    setItems(nextItems);
    onChange(serializeExpenseDescriptions(nextItems));
  }

  function addItem(afterIndex = items.length - 1) {
    const nextItems = [...items];
    nextItems.splice(afterIndex + 1, 0, "");
    updateItems(nextItems);
    requestAnimationFrame(() => inputs.current[afterIndex + 1]?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addItem(index);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    updateItems(nextItems);
    requestAnimationFrame(() => inputs.current[Math.max(0, index - 1)]?.focus());
  }

  return (
    <div className="space-y-2 text-sm font-medium text-slate-700">
      <label htmlFor="expense-item-0" className="block">Description / items *</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-semibold text-teal-700" aria-hidden="true">
              {index + 1}.
            </span>
            <input
              ref={(element) => { inputs.current[index] = element; }}
              id={`expense-item-${index}`}
              className={inputClass}
              required={index === 0}
              maxLength={300}
              placeholder={index === 0 ? "Enter the first expense item" : "Enter another item"}
              value={item}
              onChange={(event) => updateItems(items.map((current, itemIndex) => itemIndex === index ? event.target.value : current))}
              onKeyDown={(event) => handleKeyDown(event, index)}
            />
            {items.length > 1 && (
              <button type="button" aria-label={`Remove item ${index + 1}`} className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50" onClick={() => removeItem(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 pl-12">
        <p className="text-xs font-normal text-slate-400">Press Enter to add the next numbered item.</p>
        <button type="button" className="shrink-0 text-xs font-semibold text-teal-700 hover:text-teal-900" onClick={() => addItem()}>
          Add item
        </button>
      </div>
    </div>
  );
}
