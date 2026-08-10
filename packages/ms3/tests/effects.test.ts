import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  decodeFX1,
  decodeFX2,
  decodeFXBlocks,
  parseMS3,
} from "../src/index.js";

const fixture = readFileSync(
  resolve(
    process.cwd(),
    "../../fixtures/boss/example-library-01.tsl",
  ),
  "utf8",
);

describe("MS-3 FX block decoder", () => {
  it("decodes FX1 as an independent block", () => {
    const library = parseMS3(fixture);
    const patch = library.patches[0];

    const effect = decodeFX1(patch.rawParams);

    expect(effect.slot).toBe("fx1");
    expect(effect.typeId).toBe(
      patch.rawParams.fx1_fxtype,
    );

    expect(effect.parameters.fx1_fxtype).toBe(
      patch.rawParams.fx1_fxtype,
    );
  });

  it("decodes FX2 as an independent block", () => {
    const library = parseMS3(fixture);
    const patch = library.patches[0];

    const effect = decodeFX2(patch.rawParams);

    expect(effect.slot).toBe("fx2");
    expect(effect.typeId).toBe(
      patch.rawParams.fx2_fxtype,
    );

    expect(effect.parameters.fx2_fxtype).toBe(
      patch.rawParams.fx2_fxtype,
    );
  });

  it("does not leak parameters between FX slots", () => {
    const library = parseMS3(fixture);
    const patch = library.patches[0];

    const fx1 = decodeFX1(patch.rawParams);
    const fx2 = decodeFX2(patch.rawParams);

    for (const key of Object.keys(fx1.parameters)) {
      expect(key.startsWith("fx1_")).toBe(true);
    }

    for (const key of Object.keys(fx2.parameters)) {
      expect(key.startsWith("fx2_")).toBe(true);
    }
  });

  it("preserves every raw FX parameter", () => {
    const library = parseMS3(fixture);

    for (const patch of library.patches.slice(0, 25)) {
      const fx1 = decodeFX1(patch.rawParams);
      const fx2 = decodeFX2(patch.rawParams);

      for (const [key, value] of Object.entries(
        fx1.parameters,
      )) {
        expect(patch.rawParams[key]).toEqual(value);
      }

      for (const [key, value] of Object.entries(
        fx2.parameters,
      )) {
        expect(patch.rawParams[key]).toEqual(value);
      }
    }
  });

  it("decodes both FX blocks together", () => {
    const library = parseMS3(fixture);
    const patch = library.patches[0];

    const effects = decodeFXBlocks(
      patch.rawParams,
    );

    expect(effects).toHaveLength(2);
    expect(effects[0].slot).toBe("fx1");
    expect(effects[1].slot).toBe("fx2");
  });

  it("handles patches with different FX type IDs", () => {
    const library = parseMS3(fixture);

    const typePairs = new Set(
      library.patches.map((patch) => {
        const fx1 = decodeFX1(patch.rawParams);
        const fx2 = decodeFX2(patch.rawParams);

        return `${String(fx1.typeId)}:${String(fx2.typeId)}`;
      }),
    );

    expect(typePairs.size).toBeGreaterThan(1);
  });
});
