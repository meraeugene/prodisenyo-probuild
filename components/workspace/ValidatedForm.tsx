"use client";

import type { FormHTMLAttributes } from "react";
import { useFormValidation } from "@/features/shared/hooks/useFormValidation";
import styles from "./validatedForm.module.css";

export default function ValidatedForm({ onValidSubmit, children, className = "", ...props }: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onValidSubmit: () => unknown;
}) {
  const { formRef, error, refreshValidation, validateSubmission } = useFormValidation();
  return <form {...props} ref={formRef} noValidate className={`${styles.form} ${className}`}
    onChangeCapture={refreshValidation} onInputCapture={refreshValidation} onClickCapture={refreshValidation}
    onSubmit={event => {
      event.preventDefault();
      if (validateSubmission()) void onValidSubmit();
    }}>
    {error && <p role="alert" className="shrink-0 rounded-lg bg-rose-50 px-5 py-3 text-sm text-rose-700">{error}</p>}
    {children}
  </form>;
}
