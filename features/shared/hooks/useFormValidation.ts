"use client";

import { useEffect, useRef, useState } from "react";
import { validateFormControls } from "../utils/formValidation";

export function useFormValidation({ compactErrors = false }: { compactErrors?: boolean } = {}) {
  const formRef = useRef<HTMLFormElement>(null);
  const attempted = useRef(false);
  const frame = useRef<number | null>(null);
  const [error, setError] = useState("");

  function validate(focus = false) {
    const form = formRef.current;
    if (!form) return false;
    const invalid = validateFormControls(form);
    setError(invalid.length ? compactErrors
      ? invalid.every(control => control.required && !control.value.trim())
        ? "Complete the required fields."
        : invalid[0].validationMessage
      : "Check the highlighted fields. " + invalid[0].validationMessage : "");
    if (focus && invalid[0]) {
      invalid[0].focus();
      invalid[0].scrollIntoView({ block: "nearest" });
    }
    return invalid.length === 0;
  }

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  function refreshValidation() {
    if (!attempted.current) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    // Wait for React to update dependent fields and saved-input selections.
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (attempted.current && formRef.current) validate();
    });
  }

  function validateSubmission() {
    attempted.current = true;
    const valid = validate(true);
    if (valid) attempted.current = false;
    return valid;
  }

  return { formRef, error, refreshValidation, validateSubmission };
}
