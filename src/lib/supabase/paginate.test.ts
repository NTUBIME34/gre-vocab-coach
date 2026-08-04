import { describe, expect, it, vi } from "vitest";
import { fetchAllPages, SUPABASE_PAGE_SIZE } from "./paginate";

function fakeTable(totalRows: number) {
  const rows = Array.from({ length: totalRows }, (_, i) => ({ id: i }));

  return vi.fn(async (from: number, to: number) => ({
    // PostgREST caps each response at db-max-rows regardless of the range asked for.
    data: rows.slice(from, Math.min(to + 1, from + SUPABASE_PAGE_SIZE)),
    error: null
  }));
}

describe("fetchAllPages", () => {
  it("drains past the 1000-row cap that silently truncated these queries", async () => {
    const fetchPage = fakeTable(2060);

    const rows = await fetchAllPages<{ id: number }>(fetchPage);

    expect(rows).toHaveLength(2060);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("stops on a short page instead of looping forever", async () => {
    const fetchPage = fakeTable(10);

    await expect(fetchAllPages<{ id: number }>(fetchPage)).resolves.toHaveLength(10);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("stops cleanly when the table is empty", async () => {
    const fetchPage = fakeTable(0);

    await expect(fetchAllPages<{ id: number }>(fetchPage)).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("makes exactly one extra request when the total is a multiple of the page size", async () => {
    const fetchPage = fakeTable(SUPABASE_PAGE_SIZE);

    await expect(fetchAllPages<{ id: number }>(fetchPage)).resolves.toHaveLength(SUPABASE_PAGE_SIZE);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("surfaces query errors rather than returning a partial result", async () => {
    const fetchPage = vi.fn(async () => ({ data: null, error: { message: "permission denied" } }));

    await expect(fetchAllPages<{ id: number }>(fetchPage)).rejects.toThrow("permission denied");
  });

  it("rejects a nonsensical page size instead of looping", async () => {
    await expect(fetchAllPages<{ id: number }>(fakeTable(5), 0)).rejects.toThrow(/positive integer/);
  });
});
