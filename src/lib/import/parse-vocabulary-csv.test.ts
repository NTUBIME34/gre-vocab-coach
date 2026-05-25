import { describe, expect, it } from "vitest";
import { parseVocabularyCsv, splitCsvList } from "./parse-vocabulary-csv";

describe("parseVocabularyCsv", () => {
  it("parses valid vocabulary CSV", () => {
    const result = parseVocabularyCsv(
      [
        "word,part_of_speech,chinese_meaning,english_definition,example_sentence,synonyms,antonyms,memory_hint,difficulty_level,frequency_level,source_book_chapter",
        "abate,v.,減少,to become less intense,The storm abated.,subside;diminish,intensify,,3,4,Chapter 1"
      ].join("\n")
    );

    expect(result.ok).toBe(true);
    expect(result.rows[0]?.word).toBe("abate");
    expect(result.rows[0]?.difficulty_level).toBe(3);
  });

  it("splits semicolon-delimited synonyms", () => {
    expect(splitCsvList("subside; diminish；wane")).toEqual(["subside", "diminish", "wane"]);
  });

  it("rejects rows without word", () => {
    const result = parseVocabularyCsv("word,chinese_meaning\n,減少");

    expect(result.ok).toBe(false);
  });

  it("rejects rows without chinese meaning", () => {
    const result = parseVocabularyCsv("word,chinese_meaning\nabate,");

    expect(result.ok).toBe(false);
  });
});
