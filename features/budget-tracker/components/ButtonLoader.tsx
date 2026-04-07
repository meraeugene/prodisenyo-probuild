export default function ButtonLoader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/35 border-t-current" />
      <span>{label}</span>
    </span>
  );
}
