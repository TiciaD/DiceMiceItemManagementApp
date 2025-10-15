'use client';

import { getExperienceToNextLevel } from '@/lib/experience-utils';

export interface CharacterData {
  id: string;
  name: string;
  currentLevel: number;
  currentHP: number;
  maxHP: number;
  currentStatus: string;
  currentSTR: number;
  currentCON: number;
  currentDEX: number;
  currentINT: number;
  currentWIS: number;
  currentCHA: number;
  trait: string | null;
  notes: string | null;
  experience: number;
  createdAt: number;
  updatedAt: number;
  house: {
    id: string;
    name: string;
    motto: string | null;
    bio: string | null;
    gold: number;
  };
  county: {
    id: string;
    name: string;
    description: string;
    associatedStat: string;
    associatedSkills: string | null;
  };
  class: {
    id: string;
    name: string;
    description: string;
    prerequisiteStat1: string;
    prerequisiteStat2: string | null;
    isAvailable: boolean;
    willpowerProgression: string;
    hitDie: string;
  };
}

interface CharacterCardProps {
  character: CharacterData;
  onClick?: () => void;
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  const experienceData = getExperienceToNextLevel(character.experience);

  // Calculate HP percentage
  const hpPercent = character.maxHP > 0 ? (character.currentHP / character.maxHP) * 100 : 0;

  // Get HP bar color based on percentage
  const getHPBarColor = (percent: number) => {
    if (percent >= 75) return 'bg-green-500';
    if (percent >= 50) return 'bg-yellow-500';
    if (percent >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ALIVE': return 'text-green-600 bg-green-100';
      case 'DEAD': return 'text-red-600 bg-red-100';
      case 'INJURED': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
        }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {character.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Level {character.currentLevel} {character.class.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {character.house.name}, {character.county.name}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(character.currentStatus)}`}>
          {character.currentStatus}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-2 mb-4 text-center">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">STR</div>
          <div className="font-semibold text-gray-900 dark:text-white">{character.currentSTR}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">CON</div>
          <div className="font-semibold text-gray-900 dark:text-white">{character.currentCON}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">DEX</div>
          <div className="font-semibold text-gray-900 dark:text-white">{character.currentDEX}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">INT</div>
          <div className="font-semibold text-gray-900 dark:text-white">{character.currentINT}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">WIS</div>
          <div className="font-semibold text-gray-900 dark:text-white">{character.currentWIS}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">CHA</div>
          <div className="font-semibold text-gray-900 dark:text-white">{character.currentCHA}</div>
        </div>
      </div>

      {/* HP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Health</span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {character.currentHP}/{character.maxHP}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getHPBarColor(hpPercent)}`}
            style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
          />
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Experience</span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {experienceData.nextLevel
              ? `${experienceData.experienceToNext} to Level ${experienceData.nextLevel}`
              : 'Max Level'
            }
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${experienceData.progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {character.experience} XP total
        </div>
      </div>

      {/* Trait */}
      {character.trait && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Trait:</span> {character.trait}
        </div>
      )}
    </div>
  );
}