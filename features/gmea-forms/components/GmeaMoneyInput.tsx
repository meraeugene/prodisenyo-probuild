"use client";

import type { InputHTMLAttributes } from "react";
import { useGmeaMoneyInput } from "../hooks/useGmeaMoneyInput";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "step"> & {
  value: string | number;
  onValueChange: (value: string) => void;
};

export default function GmeaMoneyInput({ value, onValueChange, min = 0, max = 1e10, onFocus, onBlur, onKeyDown, ...props }: MoneyInputProps) {
  const { inputRef, display, change, focus, blur, keyDown } = useGmeaMoneyInput(value, onValueChange);
  return <input {...props} ref={inputRef} type="text" inputMode="decimal" data-money-input
    data-min-value={min} data-max-value={max} value={display}
    onChange={change}
    onFocus={event => { focus(); onFocus?.(event); }}
    onBlur={event => { blur(); onBlur?.(event); }}
    onKeyDown={event => { keyDown(event); onKeyDown?.(event); }} />;
}
