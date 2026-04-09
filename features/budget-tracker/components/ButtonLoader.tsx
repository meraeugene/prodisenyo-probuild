import { LoaderCircle } from "lucide-react";

export default function ButtonLoader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />
      <span>{label}</span>
    </span>
  );
}
