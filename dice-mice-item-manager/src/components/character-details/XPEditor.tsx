'use client';

import { useState, useEffect } from 'react';
import {
  getLevelFromExperience,
  getExperienceToNextLevel,
} from '@/lib/experience-utils';

interface XPEditorProps {
  experience: number;
  currentLevel: number;
  onXPChange: (newXP: number) => Promise<void>;
  isEditing: boolean;
  onToggleEdit: () => void;
  isLoading?: boolean;
  onLevelUpTriggered?: (newLevel: number, newXP: number) => void;
}

export function XPEditor({
  experience,
  currentLevel,
  onXPChange,
  isEditing,
  onToggleEdit,
  isLoading = false,
  onLevelUpTriggered
}: XPEditorProps) {
  const [xpValue, setXpValue] = useState(experience);
  const [xpToAdd, setXpToAdd] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Sync local state with props when experience changes (e.g., after level up)
  useEffect(() => {
    setXpValue(experience);
  }, [experience]);

  const experienceData = getExperienceToNextLevel(experience);

  const handleDirectXPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setXpValue(value);
    }
  };

  const handleAddXP = async () => {
    const xpAmount = parseInt(xpToAdd);
    if (!isNaN(xpAmount) && xpAmount > 0) {
      const newXP = experience + xpAmount;
      const newLevel = getLevelFromExperience(newXP);

      // Check for level up - trigger level up modal instead of updating XP directly
      if (newLevel > currentLevel && onLevelUpTriggered) {
        onLevelUpTriggered(newLevel, newXP);
        setXpToAdd('');
        return;
      }

      setLocalLoading(true);
      try {
        await onXPChange(newXP);
        setXpToAdd('');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleDirectSave = async () => {
    const newLevel = getLevelFromExperience(xpValue);

    // Check for level up - trigger level up modal instead of updating XP directly
    if (newLevel > currentLevel && onLevelUpTriggered) {
      onLevelUpTriggered(newLevel, xpValue);
      onToggleEdit();
      return;
    }

    setLocalLoading(true);
    try {
      await onXPChange(xpValue);
      onToggleEdit();
    } finally {
      setLocalLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {experienceData.nextLevel
                ? `${experienceData.experienceToNext}XP to Level ${experienceData.nextLevel}`
                : 'Max Level'
              }
            </span>
            <button
              onClick={onToggleEdit}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
        {experienceData.nextLevel && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${experienceData.progressPercent}%` }}
            />
            {(isLoading || localLoading) && (
              <div className="absolute inset-0 bg-gray-400/50 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Experience</span>
        <button
          onClick={onToggleEdit}
          className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
        >
          Cancel
        </button>
      </div>

      {/* Current XP Display */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Current XP</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {experience} ({experienceData.nextLevel ? `${experienceData.experienceToNext} to next level` : 'Max level'})
          </span>
        </div>
        {experienceData.nextLevel && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${experienceData.progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Add XP */}
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">
          Add Experience
        </label>
        <div className="flex gap-1">
          <input
            type="number"
            min="1"
            value={xpToAdd}
            onChange={(e) => setXpToAdd(e.target.value)}
            placeholder="XP to add"
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleAddXP}
            disabled={!xpToAdd || parseInt(xpToAdd) <= 0 || localLoading || isLoading}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {localLoading || isLoading ? '...' : 'Add XP'}
          </button>
        </div>
      </div>

      {/* Direct XP Setting */}
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">
          Set XP Directly
        </label>
        <div className="flex gap-1">
          <input
            type="number"
            min="0"
            max={91000}
            value={xpValue}
            onChange={handleDirectXPChange}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleDirectSave}
            disabled={localLoading || isLoading}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {localLoading || isLoading ? '...' : 'Set'}
          </button>
        </div>
      </div>

    </div>
  );
}