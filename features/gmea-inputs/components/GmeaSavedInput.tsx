"use client";
import WorkspaceSearchableInput from "@/components/workspace/WorkspaceSearchableInput";
import { useGmeaInputOptions } from "../hooks/useGmeaInputOptions";
import { mergeGmeaInputValues } from "../utils/gmeaInputOptions";
import type { GmeaInputOptions } from "../types";

export default function GmeaSavedInput({ field, initialOptions = [], ...props }: {
  field: keyof GmeaInputOptions; label: string; value: string; onChange: (value: string) => void;
  initialOptions?: string[]; placeholder?: string; maxLength?: number; required?: boolean; readOnly?: boolean; disabled?: boolean;
  controlClassName?: string; fieldClassName?: string;
}) {
  const { options } = useGmeaInputOptions(!props.readOnly);
  return <WorkspaceSearchableInput {...props} optional={!props.required} options={mergeGmeaInputValues(options[field], initialOptions)} />;
}
