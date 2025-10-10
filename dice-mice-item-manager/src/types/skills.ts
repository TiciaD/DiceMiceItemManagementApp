// Basic skill data from the database
export interface Skill {
  id: string;
  name: string;
  description: string;
  associatedStat: string;
}

// Skill ability data
export interface SkillAbility {
  id: string;
  name: string;
  description: string; // Markdown formatted
  level: number;
  skillId: string;
}

// Combined skill data with all abilities
export interface SkillWithDetails {
  id: string;
  name: string;
  description: string;
  associatedStat: string;
  abilities: SkillAbility[];
}
