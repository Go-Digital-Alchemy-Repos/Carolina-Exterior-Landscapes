import { describe, expect, it } from "vitest";
import { encodeCsvCell } from "./csv";

describe("encodeCsvCell", () => {
  it.each(["=2+2", "+cmd", "-1+1", "@SUM(A1:A2)", '  =HYPERLINK("https://example.test")'])(
    "neutralizes spreadsheet formulas in %s",
    (value) => expect(encodeCsvCell(value)).toMatch(/^"'/),
  );

  it("preserves ordinary values and escapes quotes", () => {
    expect(encodeCsvCell('Landscape "quote"')).toBe('"Landscape ""quote"""');
  });
});
