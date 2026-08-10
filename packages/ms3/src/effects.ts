export type MS3EffectSlot = "fx1" | "fx2";

export interface MS3DecodedEffect {
  readonly slot: MS3EffectSlot;
  readonly typeId: unknown;
  readonly parameters: Readonly<Record<string, unknown>>;
}

function isFXParameter(
  key: string,
  slot: MS3EffectSlot,
): boolean {
  return key.startsWith(`${slot}_`);
}

function decodeEffect(
  params: Readonly<Record<string, unknown>>,
  slot: MS3EffectSlot,
): MS3DecodedEffect {
  const parameters: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (isFXParameter(key, slot)) {
      parameters[key] = value;
    }
  }

  return {
    slot,
    typeId: parameters[`${slot}_fxtype`],
    parameters,
  };
}

export function decodeFX1(
  params: Readonly<Record<string, unknown>>,
): MS3DecodedEffect {
  return decodeEffect(params, "fx1");
}

export function decodeFX2(
  params: Readonly<Record<string, unknown>>,
): MS3DecodedEffect {
  return decodeEffect(params, "fx2");
}

export function decodeFXBlocks(
  params: Readonly<Record<string, unknown>>,
): readonly MS3DecodedEffect[] {
  return [
    decodeFX1(params),
    decodeFX2(params),
  ];
}
