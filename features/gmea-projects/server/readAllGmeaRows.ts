import "server-only";
type Result<T> = { data: T[] | null; error: { message: string } | null };
/** Avoid Supabase's default result limit silently understating financial totals. */
export async function readAllGmeaRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<Result<T>>,
) {
  const rows: T[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw new Error("Unable to load GMEA records. " + error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}
