import type {
  SkillRank,
  SkillRankName,
  CharacterSkillPoints,
} from '@/types/character-skills';
import { getAbilityModifier } from './initiative-utils';

// Skill rank definitions based on the game rules
export const SKILL_RANKS: Record<SkillRankName, SkillRank> = {
  Unskilled: {
    name: 'Unskilled',
    bonus: 0,
    pointsRequired: 0,
    minLevelRequired: 1,
    minLevelRequiredNonClass: 1,
  },
  Skilled: {
    name: 'Skilled',
    bonus: 2,
    pointsRequired: 1,
    minLevelRequired: 1,
    minLevelRequiredNonClass: 1,
  },
  Trained: {
    name: 'Trained',
    bonus: 4,
    pointsRequired: 2,
    minLevelRequired: 1,
    minLevelRequiredNonClass: 4,
  },
  Expert: {
    name: 'Expert',
    bonus: 7,
    pointsRequired: 3,
    minLevelRequired: 4,
    minLevelRequiredNonClass: 7,
  },
  Master: {
    name: 'Master',
    bonus: 10,
    pointsRequired: 4,
    minLevelRequired: 7,
    minLevelRequiredNonClass: 10,
  },
  Legendary: {
    name: 'Legendary',
    bonus: 14,
    pointsRequired: 5,
    minLevelRequired: 10,
    minLevelRequiredNonClass: 999, // Not available for non-class skills
  },
};

/**
 * Get skill rank based on points invested
 */
export function getSkillRank(pointsInvested: number): SkillRank {
  const ranks = Object.values(SKILL_RANKS).sort(
    (a, b) => b.pointsRequired - a.pointsRequired
  );

  for (const rank of ranks) {
    if (pointsInvested >= rank.pointsRequired) {
      return rank;
    }
  }

  return SKILL_RANKS.Unskilled;
}

/**
 * Calculate skill bonus from points invested
 */
export function calculateSkillBonus(pointsInvested: number): number {
  return getSkillRank(pointsInvested).bonus;
}

/**
 * Calculate total bonus (skill bonus + ability modifier)
 */
export function calculateTotalSkillBonus(
  pointsInvested: number,
  associatedStatValue: number
): number {
  const skillBonus = calculateSkillBonus(pointsInvested);
  const abilityModifier = getAbilityModifier(associatedStatValue);
  return skillBonus + abilityModifier;
}

/**
 * Check if character can invest points in a skill rank
 */
export function canInvestInSkillRank(
  currentPoints: number,
  targetPoints: number,
  characterLevel: number,
  isClassSkill: boolean
): boolean {
  if (targetPoints <= currentPoints) {
    return true; // Can always reduce points
  }

  const targetRank = getSkillRank(targetPoints);
  const minLevelRequired = isClassSkill
    ? targetRank.minLevelRequired
    : targetRank.minLevelRequiredNonClass;

  return characterLevel >= minLevelRequired;
}

/**
 * Get maximum points that can be invested in a skill
 */
export function getMaxSkillPoints(
  characterLevel: number,
  isClassSkill: boolean
): number {
  const ranks = Object.values(SKILL_RANKS).sort(
    (a, b) => a.pointsRequired - b.pointsRequired
  );

  let maxPoints = 0;
  for (const rank of ranks) {
    const minLevelRequired = isClassSkill
      ? rank.minLevelRequired
      : rank.minLevelRequiredNonClass;

    if (characterLevel >= minLevelRequired && minLevelRequired < 999) {
      maxPoints = rank.pointsRequired;
    }
  }

  return maxPoints;
}

/**
 * Calculate available skill points for a character
 */
export function calculateSkillPoints(
  skillRanksAtCurrentLevel: number, // skill_ranks from class_base_attributes for current level
  totalPointsSpent: number
): CharacterSkillPoints {
  return {
    availableAtCurrentLevel: skillRanksAtCurrentLevel,
    totalSpent: totalPointsSpent,
    remaining: skillRanksAtCurrentLevel - totalPointsSpent,
  };
}

/**
 * Get next available skill rank for a skill
 */
export function getNextSkillRank(
  currentPoints: number,
  characterLevel: number,
  isClassSkill: boolean
): SkillRank | null {
  const ranks = Object.values(SKILL_RANKS).sort(
    (a, b) => a.pointsRequired - b.pointsRequired
  );

  for (const rank of ranks) {
    if (rank.pointsRequired > currentPoints) {
      const minLevelRequired = isClassSkill
        ? rank.minLevelRequired
        : rank.minLevelRequiredNonClass;

      if (characterLevel >= minLevelRequired && minLevelRequired < 999) {
        return rank;
      }
    }
  }

  return null;
}

/**
 * Check if skill abilities are available based on skill rank
 */
export function getAvailableSkillAbilities(
  pointsInvested: number,
  abilities: Array<{
    id: string;
    name: string;
    description: string;
    level: number;
  }>
): Array<{
  id: string;
  name: string;
  description: string;
  level: number;
  isAvailable: boolean;
}> {
  const currentRank = getSkillRank(pointsInvested);

  return abilities.map((ability) => ({
    ...ability,
    isAvailable:
      pointsInvested >= 2 && ability.level <= currentRank.pointsRequired, // Trained or better (2+ points) to unlock abilities
  }));
}

/**
 * Validate skill point allocation
 */
export function validateSkillPointAllocation(
  skillAllocations: Array<{
    skillId: string;
    points: number;
    isClassSkill: boolean;
  }>,
  characterLevel: number,
  availablePoints: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  let totalPointsUsed = 0;

  for (const allocation of skillAllocations) {
    totalPointsUsed += allocation.points;

    // Check level requirements
    if (
      !canInvestInSkillRank(
        0,
        allocation.points,
        characterLevel,
        allocation.isClassSkill
      )
    ) {
      const rank = getSkillRank(allocation.points);
      const minLevel = allocation.isClassSkill
        ? rank.minLevelRequired
        : rank.minLevelRequiredNonClass;

      errors.push(
        `Cannot achieve ${rank.name} rank: requires level ${minLevel}${
          allocation.isClassSkill ? '' : ' (non-class skill)'
        }`
      );
    }
  }

  // Check total points
  if (totalPointsUsed > availablePoints) {
    errors.push(
      `Not enough skill points: using ${totalPointsUsed}, have ${availablePoints}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate class competency points for a skill
 * Bards have special rules: they get +1 point for ALL class skills from level 1
 * Other classes get +1 point for class skills at the class competency level
 */
export function calculateClassCompetencyPoints(
  isClassSkill: boolean,
  characterLevel: number,
  classCompetencyLevel: number,
  isBard: boolean = false
): number {
  if (!isClassSkill) return 0;

  if (isBard) {
    // Bards get +1 point for all class skills from level 1
    return 1;
  } else {
    // Normal classes get +1 point for class skills at competency level
    return characterLevel >= classCompetencyLevel ? 1 : 0;
  }
}
