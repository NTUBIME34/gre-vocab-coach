import { fetchAllPages } from "@/lib/supabase/paginate";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabulary"]["Row"];

// Module-level cache of the full (shared, rarely-changing) vocabulary table.
//
// SAFETY PRECONDITION: these rows are cached across users on a warm lambda, but
// they are fetched with whichever request's cookie client happened to miss the
// cache. That is only sound because `vocabulary` is readable by every
// authenticated user (see schema.sql -- one shared word bank, no per-user rows).
// If vocabulary ever gains per-user visibility, this cache leaks one user's rows
// to another, silently. Move it to the service-role client and filter per
// request, or drop the cache, before making that change.
// Fetching it costs 3 sequential paginated round trips, and both the practice
// generator and the daily new-word queue need the whole list. 60s TTL keeps a
// freshly imported CSV discoverable within a minute even on lambda instances
// that don't see the invalidate call.
const TTL_MS = 60 * 1000;

let cached: { rows: VocabularyRow[]; fetchedAt: number } | null = null;
let inflight: Promise<VocabularyRow[]> | null = null;
let epoch = 0;

export async function getVocabularyRowsCached(): Promise<VocabularyRow[]> {
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.rows;
  }

  if (!inflight) {
    const fetchEpoch = epoch;
    const promise: Promise<VocabularyRow[]> = fetchAllVocabularyRows()
      .then((rows) => {
        // Empty result guard: an expired token makes RLS silently return zero
        // rows instead of erroring -- caching that would blank practice/review
        // for every request on this instance until the TTL lapses.
        // Epoch guard: an invalidate() during this fetch means these rows may
        // predate an import; hand them to the callers but don't retain them.
        if (rows.length > 0 && fetchEpoch === epoch) {
          cached = { rows, fetchedAt: Date.now() };
        }
        return rows;
      })
      .finally(() => {
        if (inflight === promise) {
          inflight = null;
        }
      });
    inflight = promise;
  }

  return inflight;
}

export function invalidateVocabularyCache() {
  cached = null;
  inflight = null;
  epoch += 1;
}

async function fetchAllVocabularyRows(): Promise<VocabularyRow[]> {
  const supabase = await createClient();

  return fetchAllPages<VocabularyRow>((from, to) =>
    supabase
      .from("vocabulary")
      .select("*")
      .order("frequency_level", { ascending: false })
      .order("difficulty_level", { ascending: false })
      .order("word", { ascending: true })
      .range(from, to)
  );
}
