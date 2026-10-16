"use client";

import { cloneElement, type ReactElement } from "react";
import OptionalFieldIndicator from "@/components/workspace/OptionalFieldIndicator";

export default function GmeaField({ label, children }: {
  label: string;
  children: ReactElement<{ required?: boolean; "aria-label"?: string }>;
}) {
  const required = children.props.required ?? label.includes("*");
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700">
    <span>{label}{!required && <OptionalFieldIndicator />}</span>
    {cloneElement(children, { required, "aria-label": children.props["aria-label"] ?? label })}
  </label>;
}
