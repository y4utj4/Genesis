import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  decodeAssignments,
  decodeChain,
  decodePatch,
  groupParameterFamilies,
  parseMS3,
} from "../src/index.js";

const fixture = readFileSync(
  resolve(
    process.cwd(),
    "../../fixtures/boss/example-library-01.tsl",
  ),
  "utf8",
);

const assignmentFixture = readFileSync(
  resolve(
    process.cwd(),
    "../../fixtures/boss/example-libarry-03.tsl",
  ),
  "utf8",
);

describe("MS-3 parameter decoder", () => {
  it("decodes a real chain configuration", () => {
    const library = parseMS3(fixture);
    const patch = library.patches[0];

    const chain = decodeChain(patch.rawParams);

    expect(chain).toBeDefined();
    expect(chain!.positions).toHaveLength(10);
    expect(chain!.positionList).toHaveLength(10);
    expect(chain!.rawPositions).toEqual(
      chain!.positions,
    );

expect(chain!.positions).toEqual(
  patch!.rawParams.chainParams.positionList,
);

    expect(chain!.blocks).toHaveLength(10);
    expect(chain!.blockTypes).toHaveLength(10);
  });

  it("decodes all eight assignment slots", () => {
    const library = parseMS3(assignmentFixture);

    const first = library.patches.find(
      (candidate) => candidate.id === "9462884412",
    );

    const second = library.patches.find(
      (candidate) => candidate.id === "8729258822",
    );

    expect(first).toBeDefined();
    expect(second).toBeDefined();

    expect(first!.name).toBe("ND Main");
    expect(second!.name).toBe("ND Main");

    expect(first!.id).not.toBe(second!.id);

    const assignments = decodeAssignments(
      first!.rawParams,
    );

    expect(assignments).toHaveLength(8);

    expect(assignments[0].target).toBe(
      first!.rawParams.assign_1_target,
    );

    expect(assignments[0].targetLow).toBe(
      first!.rawParams.assign_1_target_l,
    );

    expect(assignments[0].targetHigh).toBe(
      first!.rawParams.assign_1_target_h,
    );

    expect(assignments[0].targetMin).toBe(
      first!.rawParams.assign_1_target_min,
    );

    expect(assignments[0].targetMax).toBe(
      first!.rawParams.assign_1_target_max,
    );

    expect(assignments[0].targetMidiChannel).toBe(
      first!.rawParams.assign_1_target_midi_ch,
    );

    expect(assignments[0].targetMidiNumber).toBe(
      first!.rawParams.assign_1_target_midi_num,
    );
  });


  it("preserves arbitrary MS-3 chain ordering", () => {
    const library = parseMS3(assignmentFixture);

    const patch = library.patches.find(
      (candidate) => candidate.id === "9462884412",
    );

    expect(patch).toBeDefined();

    const chain = decodeChain(patch!.rawParams);

expect(chain.positions).toEqual(
  patch!.rawParams.chainParams.positionList,
);

    expect(chain.positionList).toEqual(chain.positions);
    expect(chain.rawPositions).toEqual(chain.positions);
  });

  it("does not impose a fixed effect order", () => {
    const library = parseMS3(assignmentFixture);

    const decoded = library.patches.map((patch) => ({
      patch,
      chain: decodeChain(patch.rawParams),
    }));

    let first:
      | (typeof decoded)[number]
      | undefined;

    let second:
      | (typeof decoded)[number]
      | undefined;

    for (const candidate of decoded) {
      if (!first) {
        first = candidate;
        continue;
      }

      if (
        !candidate.chain.positions.every(
          (value, index) =>
            value === first!.chain.positions[index],
        )
      ) {
        second = candidate;
        break;
      }
    }

    expect(first).toBeDefined();
    expect(second).toBeDefined();

    expect(first!.chain.positions).not.toEqual(
      second!.chain.positions,
    );

    expect(first!.chain.positions).toHaveLength(10);
    expect(second!.chain.positions).toHaveLength(10);
  });

  it("resolves all ten MS-3 chain block identities", () => {
    const library = parseMS3(assignmentFixture);

    const patch = library.patches.find(
      (candidate) => candidate.id === "9462884412",
    );

    expect(patch).toBeDefined();

    const chain = decodeChain(patch!.rawParams);

    expect(chain.positions).toHaveLength(10);

expect(chain.blockTypes).toEqual([
  "REV",
  "NS",
  "COMP",
  "OD/DS",
  "FX2",
  "FX1",
  "MOD1",
  "MOD2",
  "DLY",
  "LOOPS",
]);
    expect(chain.blocks).toContainEqual({
      position: 2,
      id: 0,
      type: "NS",
    });    expect(chain.blocks[8]).toEqual({
      position: 9,
      id: 6,
      type: "DLY",
    });

    expect(chain.blocks[9]).toEqual({
      position: 10,
      id: 9,
      type: "LOOPS",
    });
  });

  it("keeps the three loops grouped as one chain block", () => {
    const library = parseMS3(assignmentFixture);

    const decoded = library.patches
      .map((patch) => decodeChain(patch.rawParams))
      .filter((chain) =>
        chain.blocks.some((block) => block.type === "LOOPS"),
      );

    expect(decoded.length).toBeGreaterThan(0);

    for (const chain of decoded) {
      const loopBlocks = chain.blocks.filter(
        (block) => block.type === "LOOPS",
      );

      expect(loopBlocks).toHaveLength(1);
      expect(loopBlocks[0].id).toBe(9);
      expect(loopBlocks[0].position).toBe(10);
    }
  });

  it("groups real MS-3 parameters into families", () => {
    const library = parseMS3(fixture);
    const patch = library.patches[0];

    const families = groupParameterFamilies(
      patch.rawParams,
    );

    const names = families.map(
      (family) => family.family,
    );

    expect(names).toContain("fx1");
    expect(names).toContain("fx2");
    expect(names).toContain("assign");
    expect(names).toContain("chain");
    expect(names).toContain("delay");
    expect(names).toContain("reverb");
  });

  it("decodes a patch without losing raw data", () => {
    const library = parseMS3(fixture);
    const patch = library.patches[0];

    const decoded = decodePatch(patch);

    expect(decoded.assignments).toHaveLength(8);
    expect(decoded.families.length).toBeGreaterThan(5);
    expect(patch.rawParams).toBe(patch.rawParams);
  });
});
