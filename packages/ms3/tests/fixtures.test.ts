import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseMS3 } from "../src/index.js";

const fixture = (name: string): string =>
  readFileSync(
    resolve(process.cwd(), "../../fixtures/boss", name),
    "utf8",
  );

describe("MS-3 real-world fixtures", () => {
  it("parses the 200-patch library", () => {
    const library = parseMS3(
      fixture("example-library-01.tsl"),
      "example-library-01.tsl",
    );

    expect(library.device).toBe("MS-3");
    expect(library.patches).toHaveLength(200);
    expect(library.sourcePath).toBe("example-library-01.tsl");
  });

  it("parses the 4-patch library", () => {
    const library = parseMS3(
      fixture("example-library-02.tsl"),
      "example-library-02.tsl",
    );

    expect(library.device).toBe("MS-3");
    expect(library.patches).toHaveLength(4);
  });

  it("parses the 3-patch library", () => {
    const library = parseMS3(
      fixture("example-libarry-03.tsl"),
      "example-libarry-03.tsl",
    );

    expect(library.device).toBe("MS-3");
    expect(library.patches).toHaveLength(3);
  });

  it("extracts known patch names from real data", () => {
    const library = parseMS3(
      fixture("example-library-01.tsl"),
    );

    const names = library.patches.map((patch) => patch.name);

    expect(names).toContain("ND > Main");
    expect(names).toContain("ND > Main > REC");
    expect(names).toContain("ND > PrevailSolo");
  });

  it("preserves raw parameters from real patches", () => {
    const library = parseMS3(
      fixture("example-library-01.tsl"),
    );

    const patch = library.patches.find(
      (candidate) => candidate.name === "ND > Main",
    );

    expect(patch).toBeDefined();
    expect(Object.keys(patch!.rawParams).length).toBeGreaterThan(0);
  });

  it("preserves the complete source document through serialization", () => {
    const source = fixture("example-library-02.tsl");
    const library = parseMS3(source);

    const restored = JSON.parse(
      JSON.stringify(library.raw),
    );

    expect(restored).toEqual(JSON.parse(source));
  });
});
