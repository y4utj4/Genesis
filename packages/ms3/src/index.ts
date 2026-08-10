export interface MS3RawDocument {
  readonly patchList: readonly MS3RawPatch[];
  readonly version: string;
  readonly device: string;
  readonly liveSetData?: unknown;
  readonly [key: string]: unknown;
}

export interface MS3RawPatch {
  readonly id?: string;
  readonly params?: Record<string, unknown>;
  readonly orderNumber?: number;
  readonly tcPatch?: unknown;
  readonly patchNo?: number;
  readonly patchID?: string;
  readonly liveSetId?: string;
  readonly name?: string;
  readonly category?: string;
  readonly category2?: string;
  readonly [key: string]: unknown;
}

export interface MS3EffectBlock {
  readonly index: number;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly enabled?: boolean;
  readonly type?: unknown;
}

export interface MS3Assignment {
  readonly index: number;
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface MS3Patch {
  readonly id?: string;
  readonly name: string;
  readonly orderNumber?: number;
  readonly patchNo?: number;
  readonly patchID?: string;
  readonly liveSetId?: string;
  readonly category?: string;
  readonly category2?: string;
  readonly effects: readonly MS3EffectBlock[];
  readonly assignments: readonly MS3Assignment[];
  readonly rawParams: Readonly<Record<string, unknown>>;
  readonly raw: Readonly<MS3RawPatch>;
}

export interface MS3Library {
  readonly format: "ms3-tsl";
  readonly version: string;
  readonly device: string;
  readonly patches: readonly MS3Patch[];
  readonly liveSetData?: unknown;
  readonly raw: Readonly<MS3RawDocument>;
  readonly sourcePath?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertDocument(value: unknown): asserts value is MS3RawDocument {
  if (!isObject(value)) {
    throw new Error("MS-3 TSL document must be a JSON object.");
  }

  if (!Array.isArray(value.patchList)) {
    throw new Error("MS-3 TSL document is missing patchList.");
  }

  if (typeof value.version !== "string") {
    throw new Error("MS-3 TSL document is missing version.");
  }

  if (typeof value.device !== "string") {
    throw new Error("MS-3 TSL document is missing device.");
  }

  if (value.device !== "MS-3") {
    throw new Error(`Unsupported device: ${value.device}`);
  }
}

function collectIndexedBlocks(
  params: Record<string, unknown>,
  prefix: string,
): ReadonlyArray<Readonly<Record<string, unknown>>> {
  const groups = new Map<number, Record<string, unknown>>();

  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith(prefix)) {
      continue;
    }

    const match = key.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)(?:_|$)`));

    if (!match) {
      continue;
    }

    const index = Number(match[1]);
    const group = groups.get(index) ?? {};
    group[key] = value;
    groups.set(index, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group);
}

function buildEffects(params: Record<string, unknown>): readonly MS3EffectBlock[] {
  const prefixes = [
    "fx",
    "od",
    "preamp",
    "delay",
    "reverb",
    "chorus",
    "ns",
    "eq",
  ];

  const blocks: MS3EffectBlock[] = [];

  for (const prefix of prefixes) {
    const groups = collectIndexedBlocks(params, prefix);

    groups.forEach((group, index) => {
      const enabled =
        group[`${prefix}${index + 1}_sw`] ??
        group[`${prefix}${index + 1}_switch`];

      const type =
        group[`${prefix}${index + 1}_fxtype`] ??
        group[`${prefix}${index + 1}_type`];

      blocks.push({
        index: index + 1,
        parameters: group,
        enabled: typeof enabled === "boolean" ? enabled : undefined,
        type,
      });
    });
  }

  return blocks;
}

function buildAssignments(
  params: Record<string, unknown>,
): readonly MS3Assignment[] {
  const groups = collectIndexedBlocks(params, "assign");

  return groups.map((parameters, index) => ({
    index: index + 1,
    parameters,
  }));
}

function normalizePatch(raw: MS3RawPatch): MS3Patch {
  const params = isObject(raw.params) ? raw.params : {};

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    name: typeof raw.name === "string" ? raw.name : "",
    orderNumber:
      typeof raw.orderNumber === "number" ? raw.orderNumber : undefined,
    patchNo: typeof raw.patchNo === "number" ? raw.patchNo : undefined,
    patchID: typeof raw.patchID === "string" ? raw.patchID : undefined,
    liveSetId:
      typeof raw.liveSetId === "string" ? raw.liveSetId : undefined,
    category:
      typeof raw.category === "string" ? raw.category : undefined,
    category2:
      typeof raw.category2 === "string" ? raw.category2 : undefined,
    effects: buildEffects(params),
    assignments: buildAssignments(params),
    rawParams: params,
    raw,
  };
}

export function parseMS3Document(
  document: unknown,
  sourcePath?: string,
): MS3Library {
  assertDocument(document);

  return {
    format: "ms3-tsl",
    version: document.version,
    device: document.device,
    patches: document.patchList.map(normalizePatch),
    liveSetData: document.liveSetData,
    raw: document,
    sourcePath,
  };
}

export function parseMS3(
  text: string,
  sourcePath?: string,
): MS3Library {
  let document: unknown;

  try {
    document = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid MS-3 TSL JSON: ${message}`);
  }

  return parseMS3Document(document, sourcePath);
}

export function serializeMS3(library: MS3Library): string {
  return JSON.stringify(library.raw, null, 2);
}

export function createEmptyLibrary(sourcePath?: string): MS3Library {
  const raw: MS3RawDocument = {
    patchList: [],
    version: "",
    device: "MS-3",
  };

  return {
    format: "ms3-tsl",
    version: "",
    device: "MS-3",
    patches: [],
    raw,
    sourcePath,
  };
}

export type {
  MS3DecodedAssignment,
  MS3Chain,
  MS3ParameterFamily,
} from "./decoder.js";

export {
  decodeAssignments,
  decodeChain,
  decodePatch,
  groupParameterFamilies,
} from "./decoder.js";

export type {
  MS3DecodedEffect,
  MS3EffectSlot,
} from "./effects.js";

export {
  decodeFX1,
  decodeFX2,
  decodeFXBlocks,
} from "./effects.js";
