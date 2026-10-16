export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export function validateFormControls(form: HTMLFormElement) {
  const invalid: FormControl[] = [];
  for (const control of Array.from(form.querySelectorAll<FormControl>("input, select, textarea"))) {
    control.setCustomValidity("");
    if (!control.willValidate) {
      control.removeAttribute("aria-invalid");
      continue;
    }
    let message = control.dataset.validationMessage || "";
    if (control.required && !control.value.trim()) message = "Fill in this required field.";
    if (control.value && control.dataset.minValue !== undefined) {
      const amount = Number(control.value.replace(/,/g, ""));
      if (!Number.isFinite(amount) || amount < Number(control.dataset.minValue)) {
        message = `Enter a value of at least ${control.dataset.minValue}.`;
      } else if (control.dataset.maxValue !== undefined && amount > Number(control.dataset.maxValue)) {
        message = `Enter a value no greater than ${control.dataset.maxValue}.`;
      }
    }
    control.setCustomValidity(message);
    const valid = control.validity.valid;
    control.setAttribute("aria-invalid", String(!valid));
    if (!valid) invalid.push(control);
  }
  return invalid;
}
