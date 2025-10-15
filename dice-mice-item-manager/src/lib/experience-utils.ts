// Standard Experience Chart for levels 1-14
export const EXPERIENCE_CHART: Record<number, number> = {
  1: 0,
  2: 200,
  3: 800,
  4: 2000,
  5: 4000,
  6: 7000,
  7: 11200,
  8: 16800,
  9: 24000,
  10: 33000,
  11: 44000,
  12: 57200,
  13: 72800,
  14: 91000,
};

export const MAX_LEVEL = 14;

/**
 * Calculate the current level based on experience points
 */
export function getLevelFromExperience(experience: number): number {
  let level = 1;

  for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
    if (experience >= EXPERIENCE_CHART[lvl]) {
      level = lvl;
    } else {
      break;
    }
  }

  return level;
}

/**
 * Get experience required for a specific level
 */
export function getExperienceForLevel(level: number): number {
  if (level < 1 || level > MAX_LEVEL) {
    throw new Error(`Level must be between 1 and ${MAX_LEVEL}`);
  }
  return EXPERIENCE_CHART[level];
}

/**
 * Calculate experience needed to reach the next level
 */
export function getExperienceToNextLevel(currentExperience: number): {
  currentLevel: number;
  nextLevel: number | null;
  experienceToNext: number;
  experienceForCurrentLevel: number;
  experienceForNextLevel: number | null;
  progressPercent: number;
} {
  const currentLevel = getLevelFromExperience(currentExperience);
  const nextLevel = currentLevel < MAX_LEVEL ? currentLevel + 1 : null;

  const experienceForCurrentLevel = getExperienceForLevel(currentLevel);
  const experienceForNextLevel = nextLevel
    ? getExperienceForLevel(nextLevel)
    : null;

  const experienceToNext = experienceForNextLevel
    ? experienceForNextLevel - currentExperience
    : 0;

  // Calculate progress percentage within current level
  const progressPercent = experienceForNextLevel
    ? ((currentExperience - experienceForCurrentLevel) /
        (experienceForNextLevel - experienceForCurrentLevel)) *
      100
    : 100; // Max level = 100%

  return {
    currentLevel,
    nextLevel,
    experienceToNext,
    experienceForCurrentLevel,
    experienceForNextLevel,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
  };
}

/**
 * Check if a character should level up based on their experience
 */
export function shouldLevelUp(
  currentLevel: number,
  experience: number
): boolean {
  const calculatedLevel = getLevelFromExperience(experience);
  return calculatedLevel > currentLevel;
}

/**
 * Get all levels and their experience requirements
 */
export function getAllLevelsWithExperience(): Array<{
  level: number;
  experience: number;
}> {
  return Object.entries(EXPERIENCE_CHART).map(([level, experience]) => ({
    level: parseInt(level),
    experience,
  }));
}
