'use client';

import { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@headlessui/react';
import type { CharacterSkillsData, CharacterSkillWithDetails } from '@/types/character-skills';
import {
  getMaxSkillPoints,
  canInvestInSkillRank,
  getNextSkillRank,
  SKILL_RANKS
} from '@/lib/skill-utils';

interface CharacterSkillsTabProps {
  characterId: string;
  characterStats?: {
    STR: number;
    CON: number;
    DEX: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
}

export function CharacterSkillsTab({ characterId, characterStats }: CharacterSkillsTabProps) {
  const [data, setData] = useState<CharacterSkillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tempAllocations, setTempAllocations] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStat, setFilterStat] = useState('');
  const [showOnlyClassSkills, setShowOnlyClassSkills] = useState(false);
  const [showClassSkillExplanation, setShowClassSkillExplanation] = useState(false);

  const fetchSkillsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/character/${characterId}/skills`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch character skills');
      }

      const result = await response.json();
      setData(result);

      // Initialize temp allocations with current values
      const allocations: Record<string, number> = {};
      result.skills.forEach((skill: CharacterSkillWithDetails) => {
        allocations[skill.id] = skill.pointsInvested; // Only track invested points, not class competency
      });
      setTempAllocations(allocations);
    } catch (err) {
      console.error('Error fetching character skills:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    fetchSkillsData();
  }, [fetchSkillsData]);

  const handleSkillPointChange = (skillId: string, newPoints: number) => {
    setTempAllocations(prev => ({
      ...prev,
      [skillId]: Math.max(0, newPoints),
    }));
  };

  const saveSkillAllocations = async () => {
    if (!data) return;

    try {
      setSaving(true);
      setError(null);

      const skillAllocations = Object.entries(tempAllocations).map(([skillId, points]) => ({
        skillId,
        points,
      }));

      const response = await fetch(`/api/character/${characterId}/skills`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillAllocations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save skill allocations');
      }

      // Refresh data
      await fetchSkillsData();
    } catch (err) {
      console.error('Error saving skill allocations:', err);
      setError(err instanceof Error ? err.message : 'Failed to save skill allocations');
    } finally {
      setSaving(false);
    }
  };

  const resetAllocations = () => {
    if (!data) return;

    const allocations: Record<string, number> = {};
    data.skills.forEach(skill => {
      allocations[skill.id] = skill.pointsInvested;
    });
    setTempAllocations(allocations);
  };

  const calculateTempTotalSpent = () => {
    return Object.values(tempAllocations).reduce((sum, points) => sum + points, 0);
  };

  const hasChanges = () => {
    if (!data) return false;
    return data.skills.some(skill => tempAllocations[skill.id] !== skill.pointsInvested);
  };

  const filteredSkills = data?.skills.filter(skill => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = skill.name.toLowerCase().includes(searchLower);
      const descMatch = skill.description.toLowerCase().includes(searchLower);
      if (!nameMatch && !descMatch) return false;
    }

    // Stat filter
    if (filterStat && skill.associatedStat !== filterStat) return false;

    // Class skill filter
    if (showOnlyClassSkills && !skill.isClassSkill) return false;

    return true;
  }) || [];

  // Group skills by associated stat with proper sorting
  const groupedSkills = () => {
    const statOrder = ['STR', 'CON', 'DEX', 'INT', 'WIS', 'CHA'];
    const groups: Record<string, CharacterSkillWithDetails[]> = {};

    // Initialize groups
    statOrder.forEach(stat => {
      groups[stat] = [];
    });

    // Group skills by stat
    filteredSkills.forEach(skill => {
      if (groups[skill.associatedStat]) {
        groups[skill.associatedStat].push(skill);
      }
    });

    // Sort within each group: invested skills first, then alphabetical
    Object.keys(groups).forEach(stat => {
      groups[stat].sort((a, b) => {
        const aPoints = tempAllocations[a.id] || 0;
        const bPoints = tempAllocations[b.id] || 0;

        // Skills with points invested come first
        if (aPoints > 0 && bPoints === 0) return -1;
        if (aPoints === 0 && bPoints > 0) return 1;
        if (aPoints > 0 && bPoints > 0) {
          // Both have points, sort by points invested (descending), then alphabetical
          if (aPoints !== bPoints) return bPoints - aPoints;
        }

        // Alphabetical order for skills with same investment level
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  };

  const skillGroups = groupedSkills();

  const uniqueStats = [...new Set(data?.skills.map(skill => skill.associatedStat) || [])].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading skills...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchSkillsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const tempTotalSpent = calculateTempTotalSpent();
  const remainingPoints = data.skillPoints.availableAtCurrentLevel - tempTotalSpent;

  return (
    <div className="space-y-6">
      {/* Skill Points Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Skill Points Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Available This Level:</span>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {data.skillPoints.availableAtCurrentLevel}
            </div>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Currently Spent:</span>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {tempTotalSpent}
            </div>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Remaining:</span>
            <div className={`text-xl font-bold ${remainingPoints < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {remainingPoints}
            </div>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Current Level:</span>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {data.characterLevel}
            </div>
          </div>
        </div>

        {remainingPoints < 0 && (
          <div className="mt-3 text-red-600 dark:text-red-400 text-sm font-medium">
            ⚠️ You have allocated more points than available!
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasChanges() && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveSkillAllocations}
            disabled={saving || remainingPoints < 0}
            className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={resetAllocations}
            disabled={saving}
            className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Reset Changes
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Filters</h3>

        {/* Class Skill Explanation */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <button
            onClick={() => setShowClassSkillExplanation(!showClassSkillExplanation)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">What are Class Skills?</h4>
            <svg
              className={`w-4 h-4 text-blue-900 dark:text-blue-100 transition-transform ${showClassSkillExplanation ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showClassSkillExplanation && (
            <div className="mt-3">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                {data.isBard
                  ? "As a Bard, all your class skills automatically get +1 skill point from Level 1. Class skills also have lower level requirements than non-class skills."
                  : "Class skills are easier to advance in and have lower level requirements than non-class skills."
                }
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-blue-300 dark:border-blue-700">
                      <th className="text-left py-2 px-2 font-semibold text-blue-900 dark:text-blue-100">Rank</th>
                      <th className="text-left py-2 px-2 font-semibold text-blue-900 dark:text-blue-100">Bonus</th>
                      <th className="text-left py-2 px-2 font-semibold text-blue-900 dark:text-blue-100">Min Level (Class)</th>
                      <th className="text-left py-2 px-2 font-semibold text-blue-900 dark:text-blue-100">Min Level (Non-Class)</th>
                    </tr>
                  </thead>
                  <tbody className="text-blue-700 dark:text-blue-300">
                    <tr className="border-b border-blue-200 dark:border-blue-800">
                      <td className="py-1 px-2 font-medium">Unskilled</td>
                      <td className="py-1 px-2">+0</td>
                      <td className="py-1 px-2">1</td>
                      <td className="py-1 px-2">1</td>
                    </tr>
                    <tr className="border-b border-blue-200 dark:border-blue-800">
                      <td className="py-1 px-2 font-medium">Skilled</td>
                      <td className="py-1 px-2">+2</td>
                      <td className="py-1 px-2">1</td>
                      <td className="py-1 px-2">1</td>
                    </tr>
                    <tr className="border-b border-blue-200 dark:border-blue-800">
                      <td className="py-1 px-2 font-medium">Trained</td>
                      <td className="py-1 px-2">+4</td>
                      <td className="py-1 px-2">1</td>
                      <td className="py-1 px-2">4</td>
                    </tr>
                    <tr className="border-b border-blue-200 dark:border-blue-800">
                      <td className="py-1 px-2 font-medium">Expert</td>
                      <td className="py-1 px-2">+7</td>
                      <td className="py-1 px-2">4</td>
                      <td className="py-1 px-2">7</td>
                    </tr>
                    <tr className="border-b border-blue-200 dark:border-blue-800">
                      <td className="py-1 px-2 font-medium">Master</td>
                      <td className="py-1 px-2">+10</td>
                      <td className="py-1 px-2">7</td>
                      <td className="py-1 px-2">10</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-medium">Legendary</td>
                      <td className="py-1 px-2">+14</td>
                      <td className="py-1 px-2">10</td>
                      <td className="py-1 px-2">N/A</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {data.characterLevel >= data.classCompetencyLevel && !data.isBard && (
                <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
                  <p className="text-xs text-purple-800 dark:text-purple-200">
                    <strong>Class Competency (Level {data.classCompetencyLevel}+):</strong> All class skills automatically receive +1 free skill point. These cannot be removed or redistributed.
                  </p>
                </div>
              )}

              {data.isBard && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Bard Special Ability:</strong> You gain a rank in every class skill from Level 1. This replaces the normal Level 7 Class Competency feature. At first level, you picked 3 skills as class skills, and each time you level you can designate a new skill as a class skill.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Skills
            </label>
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Associated Stat
            </label>
            <select
              value={filterStat}
              onChange={(e) => setFilterStat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Stats</option>
              {uniqueStats.map(stat => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Checkbox
              checked={showOnlyClassSkills}
              onChange={setShowOnlyClassSkills}
              className="group size-6 rounded-md bg-white dark:bg-gray-700 p-1 ring-1 ring-gray-300 dark:ring-gray-600 ring-inset data-[checked]:bg-blue-600 data-[checked]:ring-blue-600"
            >
              <svg
                className="opacity-0 stroke-white group-data-[checked]:opacity-100"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="m3 8 2.5 2.5L12 4"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Checkbox>
            <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Class Skills Only
            </label>
          </div>
        </div>
      </div>

      {/* Skills List */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Skills ({filteredSkills.length})
        </h3>

        {filteredSkills.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No skills found matching your filters.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(skillGroups).map(([stat, skills]) => {
              if (skills.length === 0) return null;

              return (
                <div key={stat} className="space-y-3">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {stat} Skills ({skills.length})
                  </h4>
                  <div className="grid gap-4">
                    {skills.map(skill => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        currentPoints={tempAllocations[skill.id] || 0}
                        characterLevel={data.characterLevel}
                        characterStats={characterStats}
                        onPointsChange={(points) => handleSkillPointChange(skill.id, points)}
                        isBard={data.isBard}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface SkillCardProps {
  skill: CharacterSkillWithDetails;
  currentPoints: number;
  characterLevel: number;
  characterStats?: {
    STR: number;
    CON: number;
    DEX: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  onPointsChange: (points: number) => void;
  isBard: boolean;
}

function SkillCard({ skill, currentPoints, characterLevel, characterStats, onPointsChange, isBard }: SkillCardProps) {
  const [showAbilities, setShowAbilities] = useState(false);

  const maxPoints = getMaxSkillPoints(characterLevel, skill.isClassSkill);
  const nextRank = getNextSkillRank(currentPoints + skill.classCompetencyPoints, characterLevel, skill.isClassSkill);

  // Calculate bonuses with current temp points + class competency
  const totalEffectivePoints = currentPoints + skill.classCompetencyPoints;
  const currentRank = Object.values(SKILL_RANKS).find(rank =>
    totalEffectivePoints >= rank.pointsRequired &&
    (totalEffectivePoints === 0 || totalEffectivePoints < rank.pointsRequired + 1 ||
      !Object.values(SKILL_RANKS).some(r => r.pointsRequired === rank.pointsRequired + 1))
  ) || SKILL_RANKS.Unskilled;

  const skillBonus = currentRank.bonus;

  // Get the actual stat value for this skill
  const getStatValue = (statName: string): number => {
    if (!characterStats) return 10; // Default if no stats provided

    switch (statName.toUpperCase()) {
      case 'STR': return characterStats.STR;
      case 'CON': return characterStats.CON;
      case 'DEX': return characterStats.DEX;
      case 'INT': return characterStats.INT;
      case 'WIS': return characterStats.WIS;
      case 'CHA': return characterStats.CHA;
      default: return 10;
    }
  };

  const statValue = getStatValue(skill.associatedStat);
  const abilityModifier = Math.floor((statValue - 10) / 2);
  const totalBonus = skillBonus + abilityModifier;

  // Show class competency notification
  const showClassCompetencyInfo = skill.classCompetencyPoints > 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* Skill Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {skill.name}
            </h4>
            {skill.isClassSkill && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                Class Skill
              </span>
            )}
            {showClassCompetencyInfo && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${isBard
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                }`}>
                +{skill.classCompetencyPoints} {isBard ? 'Bard Skill' : 'Competency'}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {skill.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Associated Stat:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{skill.associatedStat}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Current Rank:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{currentRank.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Total Bonus:</span>
              <span className="ml-1 text-lg font-bold text-green-600 dark:text-green-400">
                +{totalBonus}
              </span>
            </div>
          </div>
        </div>

        {/* Skill Point Controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPointsChange(currentPoints - 1)}
              disabled={currentPoints <= 0}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
            >
              -
            </button>

            <div className="text-center min-w-[3rem]">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {currentPoints}
                {skill.classCompetencyPoints > 0 && (
                  <span className="text-purple-600 dark:text-purple-400">+{skill.classCompetencyPoints}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                / {maxPoints}
                {skill.classCompetencyPoints > 0 && (
                  <div className={`text-xs ${isBard
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-purple-600 dark:text-purple-400'
                    }`}>
                    ({currentPoints} invested + {skill.classCompetencyPoints} {isBard ? 'bard bonus' : 'free'})
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onPointsChange(currentPoints + 1)}
              disabled={currentPoints >= maxPoints || !canInvestInSkillRank(currentPoints, currentPoints + 1, characterLevel, skill.isClassSkill)}
              className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
            >
              +
            </button>
          </div>

          {nextRank && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Next: {nextRank.name}<br />
              (+{nextRank.bonus - currentRank.bonus} bonus)
            </div>
          )}
        </div>
      </div>

      {/* Skill Abilities */}
      {skill.abilities.length > 0 && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => setShowAbilities(!showAbilities)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span>Skill Abilities ({skill.abilities.filter(a => a.isAvailable).length}/{skill.abilities.length} unlocked)</span>
            <svg
              className={`w-4 h-4 transition-transform ${showAbilities ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAbilities && (
            <div className="mt-3 space-y-2">
              {skill.abilities.map(ability => (
                <div
                  key={ability.id}
                  className={`p-3 rounded border ${ability.isAvailable
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {ability.name}
                    </h5>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ability.isAvailable
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        Level {ability.level}
                      </span>
                      {ability.isAvailable && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                          Unlocked
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {ability.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}