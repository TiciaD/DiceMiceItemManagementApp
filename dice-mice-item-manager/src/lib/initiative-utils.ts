// Initiative Chart based on Dexterity Modifier
export const INITIATIVE_CHART: Record<number, string> = {
  [-4]: '1d4',
  [-3]: '1d6',
  [-2]: '1d8',
  [-1]: '2d4',
  [0]: '1d10',
  [1]: '1d12',
  [2]: '2d6',
  [3]: '3d4',
  [4]: '2d8',
  [5]: '4d4',
  [6]: '3d6',
  [7]: '3d8',
  [8]: '3d10',
  [9]: '5d6',
  [10]: '4d8',
};

export const MIN_DEX_MODIFIER = -4;
export const MAX_DEX_MODIFIER = 10;

/**
 * Calculate the ability modifier from an ability score
 * Standard D&D formula: (score - 10) / 2, rounded down
 */
export function getAbilityModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

/**
 * Get the initiative dice formula for a given dexterity modifier
 */
export function getInitiativeDiceFromModifier(
  dexModifier: number
): string | null {
  // Clamp the modifier to the chart bounds
  const clampedModifier = Math.max(
    MIN_DEX_MODIFIER,
    Math.min(MAX_DEX_MODIFIER, dexModifier)
  );

  return INITIATIVE_CHART[clampedModifier] || null;
}

/**
 * Get the initiative dice formula for a given dexterity score
 */
export function getInitiativeDiceFromScore(dexScore: number): string | null {
  const dexModifier = getAbilityModifier(dexScore);
  return getInitiativeDiceFromModifier(dexModifier);
}

/**
 * Get the full initiative formula (dice + modifier) for a character
 */
export function getInitiativeFormula(dexScore: number): string {
  const dexModifier = getAbilityModifier(dexScore);
  const dice = getInitiativeDiceFromModifier(dexModifier);

  if (!dice) {
    // Fallback for extreme modifiers
    return dexModifier >= 0 ? `1d20+${dexModifier}` : `1d20${dexModifier}`;
  }

  if (dexModifier >= 0) {
    return `${dice}+${dexModifier}`;
  } else {
    return `${dice}${dexModifier}`;
  }
}

/**
 * Get all modifiers and their corresponding dice for display purposes
 */
export function getAllInitiativeData(): Array<{
  modifier: number;
  dice: string;
  formula: string;
}> {
  const results: Array<{ modifier: number; dice: string; formula: string }> =
    [];

  for (
    let modifier = MIN_DEX_MODIFIER;
    modifier <= MAX_DEX_MODIFIER;
    modifier++
  ) {
    const dice = INITIATIVE_CHART[modifier];
    const formula =
      modifier >= 0 ? `${dice}+${modifier}` : `${dice}${modifier}`;

    results.push({
      modifier,
      dice,
      formula,
    });
  }

  return results;
}

/**
 * Check if a dexterity modifier is within the valid range
 */
export function isValidDexModifier(dexModifier: number): boolean {
  return dexModifier >= MIN_DEX_MODIFIER && dexModifier <= MAX_DEX_MODIFIER;
}

/**
 * Get the initiative description for a character
 */
export function getInitiativeDescription(dexScore: number): string {
  const dexModifier = getAbilityModifier(dexScore);
  const formula = getInitiativeFormula(dexScore);

  return `Initiative: ${formula} (DEX ${dexScore}, modifier ${
    dexModifier >= 0 ? '+' : ''
  }${dexModifier})`;
}
