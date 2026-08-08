import { describe, expect, it } from "vitest";
import { createEmptyLibrary } from "../src/index.js";
describe("MS-3 package", () => {
  it("creates an empty library model", () => {
    expect(createEmptyLibrary("example.tsl")).toEqual({ format: "ms3-tsl", sourcePath: "example.tsl" });
  });
});
