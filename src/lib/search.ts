export const MAX_SEARCH_LENGTH = 80;

// PostgREST parses `or=(col.op.value,col.op.value)` as filter *syntax*. Interpolating
// raw user input into that string lets `,` add conditions, `.` retarget the column or
// operator, `()` regroup, and `%`/`*` rewrite the LIKE pattern -- confirmed against the
// live project, where `?q=zzz,difficulty_level.gte.1` made Postgres try to cast "1%" to
// an integer. supabase-js offers no parameter binding for `.or()`, so the only fix is to
// strip every character that carries meaning in that grammar before interpolating.
const FILTER_SYNTAX_CHARS = /[,.()%*\\"']/g;

/**
 * Makes a user-supplied search term safe to interpolate into a PostgREST `.or()`
 * filter, and caps its length so a huge term can't turn into a huge scan.
 */
export function sanitizeSearchTerm(raw: string | null | undefined): string {
  if (!raw) {
    return "";
  }

  return raw.replace(FILTER_SYNTAX_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH);
}

/**
 * Builds the `.or()` argument for a case-insensitive contains-match across several
 * columns. Returns null when the sanitized term is empty, so callers can skip the
 * filter entirely instead of matching everything.
 */
export function buildContainsFilter(columns: string[], term: string): string | null {
  const safeTerm = sanitizeSearchTerm(term);

  if (!safeTerm) {
    return null;
  }

  return columns.map((column) => `${column}.ilike.%${safeTerm}%`).join(",");
}
