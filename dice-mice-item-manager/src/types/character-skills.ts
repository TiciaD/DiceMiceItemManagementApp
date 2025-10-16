// Character skill assignment data
export interface CharacterSkill {
  characterId: string;
  skillId: string;
  pointsInvested: number;
  lastUpdated: number;
}

// Extended skill data with character investment info
export interface CharacterSkillWithDetails {
  id: string;
  name: string;
  description: string;
  associatedStat: string;
  pointsInvested: number;
  classCompetencyPoints: number; // Free points from class competency
  isClassSkill: boolean;
  skillRank: SkillRank;
  skillBonus: number;
  totalBonus: number;
  abilities: SkillAbilityWithAvailability[];
}

// Skill ability with availability based on character's skill level
export interface SkillAbilityWithAvailability {
  id: string;
  name: string;
  description: string;
  level: number;
  isAvailable: boolean;
}

// Skill rank information
export interface SkillRank {
  name: SkillRankName;
  bonus: number;
  pointsRequired: number;
  minLevelRequired: number;
  minLevelRequiredNonClass: number;
}

// Skill rank names
export type SkillRankName =
  | 'Unskilled'
  | 'Skilled'
  | 'Trained'
  | 'Expert'
  | 'Master'
  | 'Legendary';

// Skill point tracking for character
export interface CharacterSkillPoints {
  availableAtCurrentLevel: number; // skill_ranks from class_base_attributes for current level
  totalSpent: number; // Total skill points currently allocated across all skills
  remaining: number; // availableAtCurrentLevel - totalSpent
}

// Full character skills data
export interface CharacterSkillsData {
  skills: CharacterSkillWithDetails[];
  skillPoints: CharacterSkillPoints;
  characterLevel: number;
  classSkillIds: string[];
  classCompetencyLevel: number; // Level at which class skills get +1 free point
  className: string; // Name of the character's class
  isBard: boolean; // Whether the character is a Bard (has special skill rules)
}
