import { describe, expect, it } from "vitest";
import {
  createEmptyLibrary,
  parseMS3,
  parseMS3Document,
  serializeMS3,
} from "../src/index.js";

describe("MS-3 parser", () => {
  it("creates an empty library model", () => {
    expect(createEmptyLibrary("example.tsl")).toEqual({
      format: "ms3-tsl",
      version: "",
      device: "MS-3",
      patches: [],
      raw: {
        patchList: [],
        version: "",
        device: "MS-3",
      },
      sourcePath: "example.tsl",
    });
  });

  it("parses MS-3 document metadata and patches", () => {
    const library = parseMS3Document({
      version: "1.0",
      device: "MS-3",
      patchList: [
        {
          id: "patch-1",
          name: "ND Main",
          orderNumber: 1,
          patchNo: 1,
          patchID: "001",
          liveSetId: "live-1",
          category: "USER",
          category2: "ROCK",
          params: {
            fx1_sw: true,
            fx1_fxtype: "OD",
            assign1_target: "fx1_sw",
          },
        },
      ],
    });

    expect(library.patches).toHaveLength(1);

    const patch = library.patches[0];

    expect(patch.name).toBe("ND Main");
    expect(patch.orderNumber).toBe(1);
    expect(patch.patchNo).toBe(1);
    expect(patch.rawParams.fx1_sw).toBe(true);
    expect(patch.effects.length).toBeGreaterThan(0);
    expect(patch.assignments).toHaveLength(1);
  });

  it("rejects non-MS-3 devices", () => {
    expect(() =>
      parseMS3Document({
        version: "1.0",
        device: "GT-1000",
        patchList: [],
      }),
    ).toThrow("Unsupported device: GT-1000");
  });

  it("rejects malformed JSON", () => {
    expect(() => parseMS3("{not-json")).toThrow(
      "Invalid MS-3 TSL JSON",
    );
  });

  it("preserves the original document for serialization", () => {
    const source = {
      version: "1.0",
      device: "MS-3",
      patchList: [
        {
          id: "patch-1",
          name: "Round Trip",
          params: {
            completelyUnknownFutureParameter: 123,
          },
        },
      ],
      liveSetData: {
        name: "Test Live Set",
      },
    };

    const library = parseMS3Document(source);
    const serialized = serializeMS3(library);
    const restored = JSON.parse(serialized);

    expect(restored).toEqual(source);
  });
});
