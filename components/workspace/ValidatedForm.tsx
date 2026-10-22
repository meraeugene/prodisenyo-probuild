"use client";

import type { FormEvent, FormHTMLAttributes } from "react";
import { useFormValidation } from "@/features/shared/hooks/useFormValidation";
import styles from "./validatedForm.module.css";

export default function ValidatedForm({ onValidSubmit, children, className = "", compactErrors = false, ...props }: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onValidSubmit: (event: FormEvent<HTMLFormElement>) => unknown;
  compactErrors?: boolean;
}) {
  const { formRef, error, refreshValidation, validateSubmission } = useFormValidation({ compactErrors });
  return <form {...props} ref={formRef} noValidate className={`${styles.form} ${className}`}
    onChangeCapture={refreshValidation} onInputCapture={refreshValidation} onClickCapture={refreshValidation}
    onSubmit={event => {
      event.preventDefault();
      if (validateSubmission()) void onValidSubmit(event);
    }}>
    {error && <p role="alert" className={compactErrors ? styles.compactAlert : "shrink-0 rounded-lg bg-rose-50 px-5 py-3 text-sm text-rose-700"}>{error}</p>}
    {children}
  </form>;
}
