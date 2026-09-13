"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
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

  function removeItem(index: number) {
    if (items.length === 1) return;
    updateItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addItem(index);
  }

  return (
    <div className="space-y-1.5 text-sm font-medium text-slate-700">
      <label htmlFor="expense-item-0" className="block">Description / items *</label>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-teal-700" aria-hidden="true">
              {index + 1}.
            </span>
            <input
              ref={(element) => { inputs.current[index] = element; }}
              id={`expense-item-${index}`}
              className={inputClass}
              required={index === 0}
              maxLength={300}
              placeholder={index === 0 ? "Enter an expense item" : "Add another item"}
              value={item}
              onChange={(event) => updateItems(items.map((current, itemIndex) => itemIndex === index ? event.target.value : current))}
              onKeyDown={(event) => handleKeyDown(event, index)}
            />
            {items.length > 1 ? (
              <button
                type="button"
                aria-label={`Remove item ${index + 1}`}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => removeItem(index)}
              >
                <X size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="ml-7 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
        onClick={() => addItem()}
      >
        <Plus size={14} aria-hidden="true" />
        Add another item
      </button>
    </div>
  );
}
