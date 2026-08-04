import { describe, expect, it, vi } from "vitest";
import { chunkRows, SUPABASE_WRITE_CHUNK_SIZE, writeInChunks } from "./batch";

describe("chunkRows", () => {
  it("splits a full 2,060-word book into bounded batches", () => {
    const chunks = chunkRows(Array.from({ length: 2060 }, (_, i) => i));

    expect(chunks).toHaveLength(5);
    expect(chunks.flat()).toHaveLength(2060);
    expect(chunks.every((chunk) => chunk.length <= SUPABASE_WRITE_CHUNK_SIZE)).toBe(true);
  });

  it("returns nothing to write for an empty list", () => {
    expect(chunkRows([])).toEqual([]);
  });

  it("rejects a nonsensical chunk size instead of looping forever", () => {
    expect(() => chunkRows([1, 2, 3], 0)).toThrow(/positive integer/);
  });
});

describe("writeInChunks", () => {
  it("writes every row across batches", async () => {
    const written: number[] = [];
    const write = vi.fn(async (chunk: number[]) => {
      written.push(...chunk);
      return { error: null };
    });

    const error = await writeInChunks(
      Array.from({ length: 2060 }, (_, i) => i),
      write
    );

    expect(error).toBeNull();
    expect(written).toHaveLength(2060);
    expect(write).toHaveBeenCalledTimes(5);
  });

  it("stops at the first failing batch and reports it", async () => {
    const write = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "statement timeout" } });

    const error = await writeInChunks(Array.from({ length: 1500 }, (_, i) => i), write);

    expect(error).toEqual({ message: "statement timeout" });
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("makes no request at all for an empty list", async () => {
    const write = vi.fn();

    await expect(writeInChunks([], write)).resolves.toBeNull();
    expect(write).not.toHaveBeenCalled();
  });
});
