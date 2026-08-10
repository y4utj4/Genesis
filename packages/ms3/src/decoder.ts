import type { MS3Patch } from "./index.js";

export type MS3ChainBlockType =
  | "NS"
  | "FX2"
  | "COMP"
  | "MOD2"
  | "DLY"
  | "REV"
  | "FX1"
  | "MOD1"
  | "OD/DS"
  | "LOOPS";

export interface MS3ChainBlock {
  readonly position: number;
  readonly id: number;
  readonly type: MS3ChainBlockType;
}

export interface MS3Chain {
  readonly positions: readonly number[];
  readonly positionList: readonly number[];
  readonly rawPositions: readonly number[];
  readonly blocks: readonly MS3ChainBlock[];
  readonly blockTypes: readonly MS3ChainBlockType[];
  readonly raw: Readonly<Record<string, unknown>>;
}

export interface MS3DecodedAssignment {
  readonly index: number;
  readonly enabled: boolean;
  readonly source: unknown;
  readonly sourceMode: unknown;
  readonly target: unknown;
  readonly targetLow: unknown;
  readonly targetHigh: unknown;
  readonly targetMin: unknown;
  readonly targetMax: unknown;
  readonly targetMidiChannel: unknown;
  readonly targetMidiNumber: unknown;
  readonly targetMidiMin: unknown;
  readonly targetMidiMax: unknown;
  readonly activationLow: unknown;
  readonly activationHigh: unknown;
  readonly raw: Readonly<Record<string, unknown>>;
}

export interface MS3ParameterFamily {
  readonly family: string;
  readonly parameters: Readonly<Record<string, unknown>>;
}

function numberValue(
  params: Readonly<Record<string, unknown>>,
  key: string,
): number | undefined {
  const value = params[key];

  return typeof value === "number" ? value : undefined;
}

function value(
  params: Readonly<Record<string, unknown>>,
  key: string,
): unknown {
  return params[key];
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function decodeChain(
  params: Readonly<Record<string, unknown>>,
): MS3Chain {
  const blockTypes: MS3ChainBlockType[] = [
    "NS",
    "FX2",
    "COMP",
    "FX1",
    "MOD1",
    "MOD2",
    "DLY",
    "REV",
    "OD/DS",
    "LOOPS",
  ];

  const chainParams = isRecord(params.chainParams)
    ? params.chainParams
    : undefined;

  let positions: number[];

  const positionList = chainParams?.positionList;

  if (Array.isArray(positionList)) {
    if (
      positionList.length !== 10 ||
      !positionList.every(
        (value) =>
          typeof value === "number" &&
          Number.isInteger(value) &&
          value >= 0 &&
          value <= 9,
      )
    ) {
      throw new Error(
        "Invalid MS-3 chainParams.positionList: expected ten block IDs from 0 through 9.",
      );
    }

    positions = [...positionList];
  } else {
    const fallback: number[] = [];

    for (let index = 1; index <= 9; index += 1) {
      const value = params[`chain_pos${index}`];

      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 9
      ) {
        throw new Error(
          `Invalid MS-3 chain_pos${index}: expected an integer block ID from 0 through 9.`,
        );
      }

      fallback.push(value);
    }

    const tenth = chainParams?.position10;

    if (
      typeof tenth !== "number" ||
      !Number.isInteger(tenth) ||
      tenth < 0 ||
      tenth > 9
    ) {
      throw new Error(
        "Invalid MS-3 chainParams.position10: expected an integer block ID from 0 through 9.",
      );
    }

    fallback.push(tenth);
    positions = fallback;
  }

  const blocks: MS3ChainBlock[] = positions.map((id, index) => ({
    position: index + 1,
    id,
    type: blockTypes[id],
  }));

  return {
    positions,
    positionList: [...positions],
    rawPositions: [...positions],
    blocks,
    blockTypes: blocks.map((block) => block.type),
    raw: params,
  };
}

function assignmentKeys(index: number): Readonly<Record<string, string>> {
  const underscored = `assign_${index}_`;
  const compact = `assign${index}_`;

  return {
    enabled: `${underscored}sw`,
    source: `${underscored}source`,
    sourceMode: `${underscored}source_mode`,
    target: `${underscored}target`,
    targetLow: `${underscored}target_l`,
    targetHigh: `${underscored}target_h`,
    targetMin: `${underscored}target_min`,
    targetMax: `${underscored}target_max`,
    targetMidiChannel: `${underscored}target_midi_ch`,
    targetMidiNumber: `${underscored}target_midi_num`,
    targetMidiMin: `${underscored}target_midi_min`,
    targetMidiMax: `${underscored}target_midi_max`,
    activationLow: `${underscored}act_range_lo`,
    activationHigh: `${underscored}act_range_hi`,
  };
}

export function decodeAssignments(
  params: Readonly<Record<string, unknown>>,
): readonly MS3DecodedAssignment[] {
  return Array.from({ length: 8 }, (_, offset) => {
    const index = offset + 1;
    const keys = assignmentKeys(index);

    const raw: Record<string, unknown> = {};

    for (const [name, key] of Object.entries(keys)) {
      raw[name] = params[key];
    }

    return {
      index,
      enabled: value(params, keys.enabled) === 1,
      source: value(params, keys.source),
      sourceMode: value(params, keys.sourceMode),
      target: value(params, keys.target),
      targetLow: value(params, keys.targetLow),
      targetHigh: value(params, keys.targetHigh),
      targetMin: value(params, keys.targetMin),
      targetMax: value(params, keys.targetMax),
      targetMidiChannel: value(
        params,
        keys.targetMidiChannel,
      ),
      targetMidiNumber: value(
        params,
        keys.targetMidiNumber,
      ),
      targetMidiMin: value(params, keys.targetMidiMin),
      targetMidiMax: value(params, keys.targetMidiMax),
      activationLow: value(params, keys.activationLow),
      activationHigh: value(params, keys.activationHigh),
      raw,
    };
  });
}

export function groupParameterFamilies(
  params: Readonly<Record<string, unknown>>,
): readonly MS3ParameterFamily[] {
  const groups = new Map<string, Record<string, unknown>>();

  for (const [key, parameterValue] of Object.entries(params)) {
    let family: string;

    if (key.startsWith("assign")) {
      family = "assign";
    } else if (key.startsWith("chain")) {
      family = "chain";
    } else if (key.startsWith("ctrl")) {
      family = "ctrl";
    } else if (key.startsWith("fx1_")) {
      family = "fx1";
    } else if (key.startsWith("fx2_")) {
      family = "fx2";
    } else if (key.startsWith("mod1_")) {
      family = "mod1";
    } else if (key.startsWith("mod2_")) {
      family = "mod2";
    } else if (key.startsWith("dly_")) {
      family = "delay";
    } else if (key.startsWith("reverb_")) {
      family = "reverb";
    } else if (key.startsWith("ns_")) {
      family = "noiseSuppressor";
    } else if (key.startsWith("master_")) {
      family = "master";
    } else if (key.startsWith("patch_")) {
      family = "patch";
    } else if (key.startsWith("foot_")) {
      family = "foot";
    } else if (key.startsWith("analogsw_")) {
      family = "analogSwitch";
    } else {
      family = "unknown";
    }

    const group = groups.get(family) ?? {};
    group[key] = parameterValue;
    groups.set(family, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, parameters]) => ({
      family,
      parameters,
    }));
}

export function decodePatch(patch: MS3Patch): {
  readonly chain?: MS3Chain;
  readonly assignments: readonly MS3DecodedAssignment[];
  readonly families: readonly MS3ParameterFamily[];
} {
  return {
    chain: decodeChain(patch.rawParams),
    assignments: decodeAssignments(patch.rawParams),
    families: groupParameterFamilies(patch.rawParams),
  };
}
