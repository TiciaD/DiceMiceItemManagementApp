import { getAbilityModifier, getInitiativeFormula } from './initiative-utils';

// Interface for character base stats
export interface CharacterBaseStats {
  STR: number;
  CON: number;
  DEX: number;
  INT: number;
  WIS: number;
  CHA: number;
}

// Interface for class base attributes from database
export interface ClassBaseAttributes {
  attack: number;
  spellAttack: number;
  ac: number;
  fortitude: number;
  reflex: number;
  will: number;
  damageBonus: string;
  leadership: number;
  skillRanks: number;
  slayer: string | null;
  rage: string | null;
  brutalAdvantage: number | null;
}

// Interface for character class info
export interface CharacterClass {
  willpowerProgression: string; // 'EVEN', 'EVERY', 'NONE'
}

// Interface for calculated character stats
export interface CalculatedCharacterStats {
  baseModifiers: {
    STR: number;
    CON: number;
    DEX: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  offensiveStats: {
    attack: number;
    spellAttack: number;
    damageBonus: string;
    initiative: string;
  };
  defensiveStats: {
    ac: number;
    fortitude: number;
    reflex: number;
    will: number;
  };
  miscellaneousStats: {
    willpower: number;
    leadership: number;
    skillRanks: number;
    slayer: string | null;
    rage: string | null;
    brutalAdvantage: number | null;
  };
}

/**
 * Calculate all base ability modifiers from ability scores
 */
export function calculateBaseModifiers(
  baseStats: CharacterBaseStats
): CalculatedCharacterStats['baseModifiers'] {
  return {
    STR: getAbilityModifier(baseStats.STR),
    CON: getAbilityModifier(baseStats.CON),
    DEX: getAbilityModifier(baseStats.DEX),
    INT: getAbilityModifier(baseStats.INT),
    WIS: getAbilityModifier(baseStats.WIS),
    CHA: getAbilityModifier(baseStats.CHA),
  };
}

/**
 * Calculate offensive stats (attack, spell attack, damage bonus, initiative)
 */
export function calculateOffensiveStats(
  baseStats: CharacterBaseStats,
  classAttributes: ClassBaseAttributes
): CalculatedCharacterStats['offensiveStats'] {
  return {
    attack: classAttributes.attack,
    spellAttack: classAttributes.spellAttack,
    damageBonus: classAttributes.damageBonus,
    initiative: getInitiativeFormula(baseStats.DEX),
  };
}

/**
 * Calculate defensive stats with ability modifier bonuses
 */
export function calculateDefensiveStats(
  baseStats: CharacterBaseStats,
  classAttributes: ClassBaseAttributes
): CalculatedCharacterStats['defensiveStats'] {
  const modifiers = calculateBaseModifiers(baseStats);

  return {
    // AC = class AC + highest of DEX/INT mod
    ac: classAttributes.ac + Math.max(modifiers.DEX, modifiers.INT),

    // Fortitude = class Fortitude + highest of STR/CON mod
    fortitude:
      classAttributes.fortitude + Math.max(modifiers.STR, modifiers.CON),

    // Reflex = class Reflex + highest of DEX/INT mod
    reflex: classAttributes.reflex + Math.max(modifiers.DEX, modifiers.INT),

    // Will = class Will + highest of WIS/CHA mod
    will: classAttributes.will + Math.max(modifiers.WIS, modifiers.CHA),
  };
}

/**
 * Calculate willpower based on level and progression type
 */
export function calculateWillpower(
  level: number,
  willpowerProgression: string,
  baseStats: CharacterBaseStats
): number {
  const modifiers = calculateBaseModifiers(baseStats);
  let willpowerFromLevel = 0;

  switch (willpowerProgression.toUpperCase()) {
    case 'EVEN':
      // Gain willpower on even levels (2, 4, 6, 8, etc.)
      willpowerFromLevel = Math.floor(level / 2);
      break;
    case 'EVERY':
      // Gain willpower every level (1, 2, 3, 4, etc.)
      willpowerFromLevel = level;
      break;
    case 'NONE':
    default:
      // Never gain willpower from leveling
      willpowerFromLevel = 0;
      break;
  }

  // Add highest of WIS/CHA mod to willpower from level
  return willpowerFromLevel + Math.max(modifiers.WIS, modifiers.CHA);
}

/**
 * Calculate miscellaneous stats
 */
export function calculateMiscellaneousStats(
  level: number,
  baseStats: CharacterBaseStats,
  classAttributes: ClassBaseAttributes,
  characterClass: CharacterClass
): CalculatedCharacterStats['miscellaneousStats'] {
  return {
    willpower: calculateWillpower(
      level,
      characterClass.willpowerProgression,
      baseStats
    ),
    leadership: classAttributes.leadership,
    skillRanks: classAttributes.skillRanks,
    slayer: classAttributes.slayer,
    rage: classAttributes.rage,
    brutalAdvantage: classAttributes.brutalAdvantage,
  };
}

/**
 * Calculate all character stats at once
 */
export function calculateAllCharacterStats(
  level: number,
  baseStats: CharacterBaseStats,
  classAttributes: ClassBaseAttributes,
  characterClass: CharacterClass
): CalculatedCharacterStats {
  return {
    baseModifiers: calculateBaseModifiers(baseStats),
    offensiveStats: calculateOffensiveStats(baseStats, classAttributes),
    defensiveStats: calculateDefensiveStats(baseStats, classAttributes),
    miscellaneousStats: calculateMiscellaneousStats(
      level,
      baseStats,
      classAttributes,
      characterClass
    ),
  };
}

/**
 * Format modifier with proper + or - sign
 */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Get a readable description of willpower progression
 */
export function getWillpowerProgressionDescription(
  willpowerProgression: string
): string {
  switch (willpowerProgression.toUpperCase()) {
    case 'EVEN':
      return 'Gains willpower on even levels';
    case 'EVERY':
      return 'Gains willpower every level';
    case 'NONE':
      return 'Does not gain willpower from leveling';
    default:
      return 'Unknown willpower progression';
  }
}

/**
 * Check if an optional stat should be displayed
 */
export function shouldDisplayOptionalStat(
  value: string | number | null
): boolean {
  return value !== null && value !== undefined && value !== '';
}
