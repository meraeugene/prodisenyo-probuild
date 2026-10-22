"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { formatMoneyInput, moneyInputCaret, parseMoneyInput } from "../utils/moneyInput";

export function useGmeaMoneyInput(value: string | number, onValueChange: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focused = useRef(false);
  const caret = useRef<number | null>(null);
  const [display, setDisplay] = useState(() => formatMoneyInput(value, true));
  useEffect(() => {
    if (!focused.current) setDisplay(formatMoneyInput(value, true));
  }, [value]);
  useLayoutEffect(() => {
    if (focused.current && caret.current !== null) {
      inputRef.current?.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [display]);

  function change(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const plain = parseMoneyInput(input.value);
    if (plain === null) return;
    const next = formatMoneyInput(plain);
    const plainOffset = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/,/g, "").length;
    caret.current = moneyInputCaret(next, plainOffset);
    setDisplay(next);
    onValueChange(plain);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget, start = input.selectionStart;
    if (start === null || start !== input.selectionEnd) return;
    // Skip formatting punctuation so Delete/Backspace still remove a digit.
    if (event.key === "Backspace" && input.value[start - 1] === ",") input.setSelectionRange(start - 1, start - 1);
    if (event.key === "Delete" && input.value[start] === ",") input.setSelectionRange(start + 1, start + 1);
  }

  return { inputRef, display, change, keyDown,
    focus: () => { focused.current = true; },
    blur: () => { focused.current = false; setDisplay(formatMoneyInput(value, true)); },
  };
}
