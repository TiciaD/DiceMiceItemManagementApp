import {
  weaponTemplates,
  weaponTemplateDamageTypes,
  weapons,
  weaponDamageTypes,
} from '@/db/schema';

// Schema-inferred types
export type WeaponTemplate = typeof weaponTemplates.$inferSelect;
export type WeaponTemplateDamageType =
  typeof weaponTemplateDamageTypes.$inferSelect;
export type Weapon = typeof weapons.$inferSelect;
export type WeaponDamageType = typeof weaponDamageTypes.$inferSelect;

// Handedness type
export type Handedness = '1H' | '2H';

// Damage type codes
export type DamageTypeCode = 'S' | 'B' | 'P';

// Special mode codes
export type ModeCode =
  | 'none'
  | 'thrown_short'
  | 'thrown_long'
  | 'versatile'
  | 'reach_10'
  | 'reach_15';

// Damage mode
export type DamageMode = 'single' | 'dual';

// Material codes
export type MaterialCode =
  | 'steel'
  | 'silver'
  | 'gold'
  | 'truesteel'
  | 'crystal'
  | 'obsidian'
  | 'heartwood';

// ============ CONSTANTS ============

// The dice ladder (ordered scale of damage dice)
export const DICE_LADDER = [
  '1d4',
  '1d6',
  '1d8',
  '1d10',
  '1d12',
  '2d6',
  '2d8',
  '2d10',
] as const;

export type DieLadderValue = (typeof DICE_LADDER)[number];

// Starting dice by handedness
export const START_DIE_BY_HANDEDNESS: Record<Handedness, DieLadderValue> = {
  '1H': '1d8',
  '2H': '1d12',
};

// Damage mode step delta
export const DAMAGE_MODE_DELTA: Record<DamageMode, number> = {
  single: 0,
  dual: -1,
};

// Damage type metadata
export const DAMAGE_TYPE_META: Record<
  DamageTypeCode,
  {
    name: string;
    stat: 'STR' | 'CON' | 'DEX';
    colorClass: string;
    bgClass: string;
    borderClass: string;
    dotColor: string;
  }
> = {
  S: {
    name: 'Slashing',
    stat: 'STR',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/20',
    borderClass: 'border-red-500/40',
    dotColor: '#ff7b7b',
  },
  B: {
    name: 'Bludgeoning',
    stat: 'CON',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/40',
    dotColor: '#ffd36a',
  },
  P: {
    name: 'Piercing',
    stat: 'DEX',
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-500/20',
    borderClass: 'border-sky-500/40',
    dotColor: '#7bd0ff',
  },
};

// Stat requirement rules by handedness
export interface StatThresholdOption {
  threshold: number | null; // null = None
  bonus: number;
  label: string;
}

export const STAT_RULES: Record<
  Handedness,
  Record<DamageTypeCode, StatThresholdOption[]>
> = {
  '1H': {
    S: [
      { threshold: null, bonus: 0, label: 'None' },
      { threshold: 11, bonus: 1, label: 'STR 11 (+1)' },
      { threshold: 13, bonus: 2, label: 'STR 13 (+2)' },
    ],
    B: [
      { threshold: null, bonus: 0, label: 'None' },
      { threshold: 11, bonus: 1, label: 'CON 11 (+1)' },
      { threshold: 13, bonus: 2, label: 'CON 13 (+2)' },
    ],
    P: [
      { threshold: null, bonus: 0, label: 'None' },
      { threshold: 11, bonus: 1, label: 'DEX 11 (+1)' },
      { threshold: 13, bonus: 2, label: 'DEX 13 (+2)' },
    ],
  },
  '2H': {
    S: [
      { threshold: null, bonus: 0, label: 'None' },
      { threshold: 13, bonus: 1, label: 'STR 13 (+1)' },
      { threshold: 15, bonus: 2, label: 'STR 15 (+2)' },
    ],
    B: [
      { threshold: null, bonus: 0, label: 'None' },
      { threshold: 13, bonus: 1, label: 'CON 13 (+1)' },
      { threshold: 15, bonus: 2, label: 'CON 15 (+2)' },
    ],
    P: [
      { threshold: null, bonus: 0, label: 'None' },
      { threshold: 13, bonus: 1, label: 'DEX 13 (+1)' },
      { threshold: 15, bonus: 2, label: 'DEX 15 (+2)' },
    ],
  },
};

// Special modes
export interface SpecialMode {
  name: string;
  stepPenalty: number;
  range?: [number, number]; // For thrown weapons
  reach?: number; // For reach weapons
}

export const SPECIAL_MODES: Record<ModeCode, SpecialMode> = {
  none: { name: 'None', stepPenalty: 0 },
  thrown_short: { name: 'Thrown 10/20', stepPenalty: -1, range: [10, 20] },
  thrown_long: { name: 'Long Thrown 15/25', stepPenalty: -2, range: [15, 25] },
  versatile: { name: 'Versatile', stepPenalty: -1 },
  reach_10: { name: 'Reach 10"', stepPenalty: -1, reach: 10 },
  reach_15: { name: 'Reach 15"', stepPenalty: -2, reach: 15 },
};

// Material definitions
export interface MaterialDef {
  name: string;
  description: string;
  dieBonusType?: DamageTypeCode; // Grants +1 die size to this damage type
  requirementReductionType?: DamageTypeCode; // Reduces stat requirement tier by 1 for this type
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const MATERIALS: Record<MaterialCode, MaterialDef> = {
  steel: {
    name: 'Steel',
    description: 'Standard forged steel',
    colorClass: 'text-gray-400',
    bgClass: 'bg-gray-500/20',
    borderClass: 'border-gray-500/40',
  },
  silver: {
    name: 'Silver',
    description: 'Precious silver alloy',
    colorClass: 'text-slate-300',
    bgClass: 'bg-slate-400/20',
    borderClass: 'border-slate-400/40',
  },
  gold: {
    name: 'Gold',
    description: 'Royal gold inlay',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/20',
    borderClass: 'border-yellow-500/40',
  },
  truesteel: {
    name: 'Truesteel',
    description: '-1 tier requirement for Bludgeoning',
    requirementReductionType: 'B',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/20',
    borderClass: 'border-cyan-500/40',
  },
  crystal: {
    name: 'Crystal',
    description: 'Arcane crystal edge',
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-500/20',
    borderClass: 'border-pink-500/40',
  },
  obsidian: {
    name: 'Obsidian',
    description: '+1 die size for Slashing',
    dieBonusType: 'S',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-500/40',
  },
  heartwood: {
    name: 'Heartwood',
    description: 'Ancient heartwood core',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/20',
    borderClass: 'border-green-500/40',
  },
};

/**
 * Get material die bonus for a specific damage type
 */
export function getMaterialDieBonus(
  material: MaterialCode,
  damageType: DamageTypeCode
): number {
  const mat = MATERIALS[material];
  if (mat.dieBonusType === damageType) {
    return 1;
  }
  return 0;
}

/**
 * Get reduced stat threshold for a damage type if material reduces requirement
 */
export function getMaterialReducedThreshold(
  material: MaterialCode,
  handedness: Handedness,
  damageType: DamageTypeCode,
  currentThreshold: number | null
): number | null {
  const mat = MATERIALS[material];
  if (mat.requirementReductionType !== damageType || currentThreshold === null) {
    return currentThreshold;
  }
  
  // Find current tier and reduce by 1
  const rules = STAT_RULES[handedness][damageType];
  const currentTierIndex = rules.findIndex((r) => r.threshold === currentThreshold);
  
  if (currentTierIndex > 0) {
    // Move down one tier (closer to "None")
    return rules[currentTierIndex - 1].threshold;
  }
  
  return currentThreshold;
}

// ============ EXTENDED TYPES ============

// Weapon template with damage types included
export interface WeaponTemplateWithDetails extends WeaponTemplate {
  damageTypes: (WeaponTemplateDamageType & {
    meta: (typeof DAMAGE_TYPE_META)[DamageTypeCode];
  })[];
}

// Weapon damage type config for UI state
export interface DamageTypeConfig {
  code: DamageTypeCode;
  statThreshold: number | null;
  displayOrder: number;
}

// Weapon with computed details
export interface WeaponWithDetails extends Weapon {
  damageTypes: (WeaponDamageType & {
    meta: (typeof DAMAGE_TYPE_META)[DamageTypeCode];
    finalDie: DieLadderValue;
    statBonus: number;
  })[];
  modeMeta: SpecialMode;
  materialMeta: MaterialDef;
  templateName?: string;
}

// Form data for creating a weapon
export interface CreateWeaponFormData {
  name: string;
  weaponTemplateId?: string; // Optional template reference
  handedness: Handedness;
  damageMode: DamageMode;
  modeCode: ModeCode;
  material: MaterialCode;
  damageTypes: DamageTypeConfig[];
}

// Weapon builder state (for UI component)
export interface WeaponBuilderState {
  handedness: Handedness;
  damageMode: DamageMode;
  modeCode: ModeCode;
  selectedTypes: DamageTypeCode[];
  statReqs: Record<DamageTypeCode, number | null>;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Get the index of a die in the ladder
 */
export function getDieIndex(die: DieLadderValue): number {
  return DICE_LADDER.indexOf(die);
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get the stat bonus for a given damage type based on threshold selection
 */
export function getStatBonus(
  handedness: Handedness,
  damageType: DamageTypeCode,
  threshold: number | null
): number {
  const rules = STAT_RULES[handedness][damageType];
  const rule = rules.find((r) => r.threshold === threshold);
  return rule?.bonus ?? 0;
}

/**
 * Compute the final dice for all damage types based on weapon configuration
 */
export function computeFinalDice(config: {
  handedness: Handedness;
  damageMode: DamageMode;
  modeCode: ModeCode;
  damageTypes: { code: DamageTypeCode; statThreshold: number | null }[];
  material?: MaterialCode;
}): Record<DamageTypeCode, { die: DieLadderValue; step: number }> {
  const { handedness, damageMode, modeCode, damageTypes, material = 'steel' } = config;

  // Get base step
  const startDie = START_DIE_BY_HANDEDNESS[handedness];
  const baseStep = getDieIndex(startDie) + DAMAGE_MODE_DELTA[damageMode];

  // Get mode penalty
  const modePenalty = SPECIAL_MODES[modeCode].stepPenalty;

  // Compute final step for each damage type
  const result: Record<
    DamageTypeCode,
    { die: DieLadderValue; step: number }
  > = {} as Record<DamageTypeCode, { die: DieLadderValue; step: number }>;

  for (const dt of damageTypes) {
    const statBonus = getStatBonus(handedness, dt.code, dt.statThreshold);
    const materialBonus = getMaterialDieBonus(material, dt.code);
    const finalStep = clamp(
      baseStep + statBonus + modePenalty + materialBonus,
      0,
      DICE_LADDER.length - 1
    );
    result[dt.code] = {
      die: DICE_LADDER[finalStep],
      step: finalStep,
    };
  }

  return result;
}

/**
 * Compute final die for a single damage type
 */
export function computeSingleFinalDie(config: {
  handedness: Handedness;
  damageMode: DamageMode;
  modeCode: ModeCode;
  damageTypeCode: DamageTypeCode;
  statThreshold: number | null;
  material?: MaterialCode;
}): { die: DieLadderValue; step: number } {
  const { handedness, damageMode, modeCode, damageTypeCode, statThreshold, material = 'steel' } =
    config;

  const startDie = START_DIE_BY_HANDEDNESS[handedness];
  const baseStep = getDieIndex(startDie) + DAMAGE_MODE_DELTA[damageMode];
  const modePenalty = SPECIAL_MODES[modeCode].stepPenalty;
  const statBonus = getStatBonus(handedness, damageTypeCode, statThreshold);
  const materialBonus = getMaterialDieBonus(material, damageTypeCode);

  const finalStep = clamp(
    baseStep + statBonus + modePenalty + materialBonus,
    0,
    DICE_LADDER.length - 1
  );

  return {
    die: DICE_LADDER[finalStep],
    step: finalStep,
  };
}
