// Supabase enforces a `db-max-rows` cap (1000 on this project) on every PostgREST
// request. A `.select()` without an explicit `.range()` loop is therefore silently
// truncated at 1000 rows -- no error, no warning, just a short array. Both
// `vocabulary` and `user_progress` are already past that cap (2060 rows each), so
// any full-table read MUST page or it will quietly compute the wrong answer.
export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Drains a PostgREST query page by page until a short page proves the end was
 * reached. `fetchPage` receives an inclusive `[from, to]` range, matching
 * `PostgrestFilterBuilder.range()`.
 *
 * Kept free of any Supabase import so it can be unit tested against a fake.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = SUPABASE_PAGE_SIZE
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error(`fetchAllPages: pageSize must be a positive integer, received ${pageSize}.`);
  }

  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) {
      return rows;
    }

    rows.push(...data);

    // A page shorter than requested is the only reliable end-of-data signal:
    // PostgREST has no "hasMore" flag and the total count costs an extra scan.
    if (data.length < pageSize) {
      return rows;
    }
  }
}
