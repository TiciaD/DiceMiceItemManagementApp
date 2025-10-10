// Basic class data from the database
export interface Class {
  id: string;
  name: string;
  description: string;
  prerequisiteStat1: string;
  prerequisiteStat2: string | null;
  isAvailable: boolean;
  willpowerProgression: string;
  hitDie: string;
}

// Skill data
export interface Skill {
  id: string;
  name: string;
  description: string;
  associatedStat: string;
}

// Class ability data
export interface ClassAbility {
  id: string;
  name: string;
  description: string; // Markdown formatted
  level: number;
  classId: string;
}

// Class base attributes data
export interface ClassBaseAttribute {
  id: string;
  classId: string;
  level: number;
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

// Combined class data with all related information
export interface ClassWithDetails {
  id: string;
  name: string;
  description: string;
  prerequisiteStat1: string;
  prerequisiteStat2: string | null;
  isAvailable: boolean;
  willpowerProgression: string;
  hitDie: string;
  skills: Skill[];
  abilities: ClassAbility[];
  baseAttributes: ClassBaseAttribute[];
  // Computed properties for display
  hasSlayer: boolean;
  hasRage: boolean;
  hasBrutalAdvantage: boolean;
}

// Type for the table headers that should be displayed
export interface AttributeTableColumn {
  key: keyof ClassBaseAttribute;
  header: string;
  show: boolean;
}
