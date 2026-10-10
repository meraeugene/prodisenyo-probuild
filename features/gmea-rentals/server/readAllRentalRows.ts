import "server-only";

type RentalRowsResult<T> = { data: T[] | null; error: { message: string } | null };

/** Read every page so rental charges and collections are not truncated at the API row limit. */
export async function readAllRentalRows<T>(fetchPage: (from: number, to: number) => PromiseLike<RentalRowsResult<T>>, label: string) {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw new Error(`Unable to load ${label}. ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}
