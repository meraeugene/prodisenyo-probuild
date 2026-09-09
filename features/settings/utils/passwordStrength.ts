export function getPasswordStrength(password: string) {
  if (!password) return { label: "Password strength", width: "0%", color: "bg-slate-300" };
  const variety = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  if (password.length < 8) return { label: "Too short — use at least 8 characters", width: "20%", color: "bg-rose-400" };
  if (password.length >= 12 && variety >= 3) return { label: "Strong", width: "100%", color: "bg-teal-600" };
  if (variety >= 3) return { label: "Good", width: "70%", color: "bg-teal-400" };
  return { label: "Could be stronger", width: "40%", color: "bg-amber-400" };
}
