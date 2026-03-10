export function highlight(text: string, query: string) {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-amber-200/70  rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
