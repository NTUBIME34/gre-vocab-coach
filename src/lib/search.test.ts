import { describe, expect, it } from "vitest";
import { buildContainsFilter, MAX_SEARCH_LENGTH, sanitizeSearchTerm } from "./search";

describe("sanitizeSearchTerm", () => {
  it("strips the characters PostgREST reads as filter syntax", () => {
    // Confirmed live: ?q=zzz,difficulty_level.gte.1 made Postgres try to cast
    // "1%" to an integer, proving the input was parsed as filter syntax.
    const injected = sanitizeSearchTerm("zzz,difficulty_level.gte.1");

    for (const char of [",", ".", "(", ")", "%", "*", "\\", '"', "'"]) {
      expect(injected).not.toContain(char);
    }
  });

  it("keeps ordinary search terms usable", () => {
    expect(sanitizeSearchTerm("  abate ")).toBe("abate");
    expect(sanitizeSearchTerm("平息")).toBe("平息");
  });

  it("caps the length so a huge term cannot become a huge scan", () => {
    expect(sanitizeSearchTerm("a".repeat(500))).toHaveLength(MAX_SEARCH_LENGTH);
  });

  it("treats empty and missing input the same", () => {
    expect(sanitizeSearchTerm(null)).toBe("");
    expect(sanitizeSearchTerm(undefined)).toBe("");
    expect(sanitizeSearchTerm("   ")).toBe("");
    expect(sanitizeSearchTerm(",,,")).toBe("");
  });
});

describe("buildContainsFilter", () => {
  it("builds one ilike clause per column", () => {
    expect(buildContainsFilter(["word", "chinese_meaning"], "abate")).toBe(
      "word.ilike.%abate%,chinese_meaning.ilike.%abate%"
    );
  });

  it("returns null for an empty term so callers skip the filter entirely", () => {
    expect(buildContainsFilter(["word"], "")).toBeNull();
    expect(buildContainsFilter(["word"], "()")).toBeNull();
  });

  it("cannot be used to inject a second condition", () => {
    const filter = buildContainsFilter(["word"], "zzz,difficulty_level.gte.1");

    expect(filter).toBe("word.ilike.%zzz difficulty_level gte 1%");
  });
});
