"use client";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Popover } from "radix-ui";
import { ChevronDown } from "lucide-react";
import styles from "./workspace.module.css";

export default function WorkspaceSearchableInput({ label, value, options, onChange, placeholder = "Search or enter a value", required, maxLength, readOnly = false, disabled = false, leadingIcon, controlClassName, fieldClassName }: {
  label: string; value: string; options: string[]; onChange: (value: string) => void; placeholder?: string;
  required?: boolean; maxLength?: number; readOnly?: boolean; disabled?: boolean; leadingIcon?: ReactNode; controlClassName?: string; fieldClassName?: string;
}) {
  const id = useId(), listId = `${id}-options`, inputRef = useRef<HTMLInputElement>(null), rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [showAll, setShowAll] = useState(true), [active, setActive] = useState(-1);
  const visible = useMemo(() => [...new Set(options)].filter(option => (!maxLength || option.length <= maxLength) && (showAll || option.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase()))).slice(0, 50), [options, showAll, value, maxLength]);
  const canOpen = !disabled && !readOnly;
  function choose(option: string) { onChange(option); setOpen(false); setActive(-1); }
  return <div ref={rootRef} className={fieldClassName || styles.field}>
    <label htmlFor={id} className="block">{label}</label>
    <Popover.Root open={open && canOpen} onOpenChange={setOpen}>
      <Popover.Anchor asChild><div className="relative">
        <input ref={inputRef} id={id} role="combobox" aria-autocomplete="list" aria-controls={listId} aria-expanded={open && canOpen}
          aria-activedescendant={open && active >= 0 && visible[active] ? `${listId}-${active}` : undefined}
          className={`${controlClassName || styles.control} pr-9 ${leadingIcon ? "pl-12" : ""}`} value={value} placeholder={placeholder} required={required} maxLength={maxLength}
          readOnly={readOnly} disabled={disabled} autoComplete="off"
          onFocus={() => { if (canOpen) { setShowAll(true); setOpen(options.length > 0); } }}
          onChange={event => { onChange(event.target.value); setShowAll(false); setActive(-1); setOpen(true); }}
          onKeyDown={event => {
            if (!canOpen) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); setOpen(true);
              const step = event.key === "ArrowDown" ? 1 : -1;
              const next = visible.length ? active < 0 ? step === 1 ? 0 : visible.length - 1 : (active + step + visible.length) % visible.length : -1;
              setActive(next); document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
            } else if (event.key === "Enter" && open) {
              event.preventDefault(); if (visible[active]) choose(visible[active]); else setOpen(false);
            } else if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
          }} />
        {leadingIcon && <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center" aria-hidden="true">{leadingIcon}</span>}
        <button type="button" aria-label={`Show ${label.toLowerCase()} options`} disabled={!canOpen}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-500 disabled:opacity-40"
          onClick={() => { inputRef.current?.focus(); setShowAll(true); setActive(-1); setOpen(!open); }}><ChevronDown size={15} aria-hidden="true" /></button>
      </div></Popover.Anchor>
      <Popover.Portal><Popover.Content id={listId} role="listbox" aria-label={`${label} options`} align="start" sideOffset={4} collisionPadding={12}
        style={{ width: "var(--radix-popover-trigger-width)", maxHeight: "min(240px, var(--radix-popover-content-available-height))" }}
        className="z-[260] min-w-36 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg"
        onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}
        onInteractOutside={event => { if (rootRef.current?.contains(event.target as Node)) event.preventDefault(); }}
        onEscapeKeyDown={event => { event.preventDefault(); event.stopPropagation(); setOpen(false); }}>
        {visible.map((option, index) => <button key={option} id={`${listId}-${index}`} type="button" role="option" tabIndex={-1} aria-selected={option === value}
          className={`block w-full rounded px-3 py-2 text-left text-sm ${active === index ? "bg-teal-50 text-teal-800" : "text-slate-700 hover:bg-teal-50"}`}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}>{option}</button>)}
        {!visible.length && <p className="px-3 py-2 text-xs text-slate-500">Enter a new value. It will be remembered when you save.</p>}
      </Popover.Content></Popover.Portal>
    </Popover.Root>
  </div>;
}
