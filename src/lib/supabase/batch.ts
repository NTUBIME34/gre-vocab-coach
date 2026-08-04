// Writes are not subject to the db-max-rows read cap, but a single request
// carrying every row of a 2,000-word book is a large body and one long statement
// -- exactly the shape that trips a serverless timeout. Splitting the write keeps
// each request small and lets a failure name the batch it happened in.
export const SUPABASE_WRITE_CHUNK_SIZE = 500;

type WriteResult = { error: { message: string } | null };

export function chunkRows<T>(rows: T[], chunkSize: number = SUPABASE_WRITE_CHUNK_SIZE): T[][] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new Error(`chunkRows: chunkSize must be a positive integer, received ${chunkSize}.`);
  }

  const chunks: T[][] = [];

  for (let start = 0; start < rows.length; start += chunkSize) {
    chunks.push(rows.slice(start, start + chunkSize));
  }

  return chunks;
}

/**
 * Runs `write` over the rows in sequential batches. Returns the first error
 * encountered, or null when every batch succeeded. Sequential on purpose: these
 * writes target one table for one user, and firing them all at once just makes a
 * partial failure harder to reason about.
 */
export async function writeInChunks<T>(
  rows: T[],
  write: (chunk: T[]) => PromiseLike<WriteResult>,
  chunkSize: number = SUPABASE_WRITE_CHUNK_SIZE
): Promise<{ message: string } | null> {
  for (const chunk of chunkRows(rows, chunkSize)) {
    const { error } = await write(chunk);

    if (error) {
      return error;
    }
  }

  return null;
}
