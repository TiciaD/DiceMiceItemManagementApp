'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  calculateAllCharacterStats,
  CharacterBaseStats,
  ClassBaseAttributes,
  CharacterClass,
  getWillpowerProgressionDescription
} from '@/lib/character-stats-utils';
import { getLevelFromExperience } from '@/lib/experience-utils';
import {
  BaseStatsSection,
  OffensiveStatsSection,
  DefensiveStatsSection,
  MiscellaneousStatsSection,
  ClassAbilitiesSection,
} from '@/components/character-details/CharacterStatsSections';
import { HPEditor } from '@/components/character-details/HPEditor';
import { XPEditor } from '@/components/character-details/XPEditor';
import { CharacterInfoEditor } from '@/components/character-details/CharacterInfoEditor';
import { LevelUpModal } from '@/components/character-details/LevelUpModal';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

interface CharacterDetails {
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
  } | null;
  county: {
    id: string;
    name: string;
    description: string;
    associatedStat: string;
    associatedSkills: string | null;
  } | null;
  class: {
    id: string;
    name: string;
    description: string;
    prerequisiteStat1: string;
    prerequisiteStat2: string | null;
    isAvailable: boolean;
    willpowerProgression: string;
    hitDie: string;
  } | null;
}

interface ClassAbility {
  id: string;
  name: string;
  description: string;
  level: number;
}

interface CharacterDetailsData {
  character: CharacterDetails;
  classBaseAttributes: ClassBaseAttributes;
  classAbilities: {
    available: ClassAbility[];
    future: ClassAbility[];
  };
}

export default function CharacterDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const characterId = params.id as string;

  const [data, setData] = useState<CharacterDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingHP, setIsEditingHP] = useState(false);
  const [isEditingXP, setIsEditingXP] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [hpLoading, setHpLoading] = useState(false);
  const [xpLoading, setXpLoading] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; newXP: number; originalXP: number } | null>(null);
  const [levelUpQueue, setLevelUpQueue] = useState<{ fromLevel: number; toLevel: number; totalXP: number; originalXP: number; currentLevelIndex: number }[]>([]);

  const fetchCharacterDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      // Add cache busting to ensure fresh data after level up
      const response = await fetch(`/api/character/${characterId}?_=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch character details');
      }

      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Failed to fetch character details');
      }
    } catch (err) {
      console.error('Error fetching character details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCharacterDetails();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, fetchCharacterDetails]);

  const updateCharacterHP = async (newHP: number) => {
    try {
      setHpLoading(true);
      const response = await fetch(`/api/character/${characterId}/hp`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentHP: newHP }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HP');
      }

      // Update local state
      if (data) {
        setData({
          ...data,
          character: {
            ...data.character,
            currentHP: newHP,
          },
        });
      }
    } catch (err) {
      console.error('Error updating HP:', err);
      setError(err instanceof Error ? err.message : 'Failed to update HP');
    } finally {
      setHpLoading(false);
    }
  };

  const updateCharacterXP = async (newXP: number) => {
    try {
      setXpLoading(true);
      const response = await fetch(`/api/character/${characterId}/experience`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ experience: newXP }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update experience');
      }

      const result = await response.json();

      // Update local state
      if (data) {
        setData({
          ...data,
          character: {
            ...data.character,
            experience: newXP,
            currentLevel: result.currentLevel,
          },
        });
      }
    } catch (err) {
      console.error('Error updating experience:', err);
      setError(err instanceof Error ? err.message : 'Failed to update experience');
    } finally {
      setXpLoading(false);
    }
  };

  const updateCharacterInfo = async (info: { name: string; trait: string | null }) => {
    try {
      const response = await fetch(`/api/character/${characterId}/info`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(info),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update character info');
      }

      // Update local state
      if (data) {
        setData({
          ...data,
          character: {
            ...data.character,
            name: info.name,
            trait: info.trait,
          },
        });
      }
    } catch (err) {
      console.error('Error updating character info:', err);
      setError(err instanceof Error ? err.message : 'Failed to update character info');
    }
  };

  const handleLevelUpTriggered = (newLevel: number, newXP: number) => {
    if (!data?.character) return;

    const currentLevel = data.character.currentLevel;
    const originalXP = data.character.experience;

    // If only gaining 1 level, use the existing single level-up flow
    if (newLevel === currentLevel + 1) {
      setLevelUpData({ newLevel, newXP, originalXP });
      return;
    }

    // For multi-level jumps, create a queue of individual level-ups
    const queue = [];
    for (let level = currentLevel + 1; level <= newLevel; level++) {
      queue.push({
        fromLevel: level - 1,
        toLevel: level,
        totalXP: newXP,
        originalXP,
        currentLevelIndex: level - currentLevel - 1
      });
    }

    setLevelUpQueue(queue);

    // Start with the first level-up in the queue
    if (queue.length > 0) {
      const firstLevelUp = queue[0];
      setLevelUpData({
        newLevel: firstLevelUp.toLevel,
        newXP: firstLevelUp.totalXP,
        originalXP: firstLevelUp.originalXP
      });
    }
  };

  const handleLevelUpComplete = async () => {
    try {
      // Force a complete data refresh by setting loading state
      setLoading(true);

      // Refresh character details to get updated stats
      await fetchCharacterDetails();

      // Check if there are more level-ups in the queue
      if (levelUpQueue.length > 0) {
        const currentIndex = levelUpQueue.findIndex(item =>
          levelUpData && item.toLevel === levelUpData.newLevel
        );

        if (currentIndex >= 0 && currentIndex < levelUpQueue.length - 1) {
          // There's another level-up to process
          const nextLevelUp = levelUpQueue[currentIndex + 1];
          setLevelUpData({
            newLevel: nextLevelUp.toLevel,
            newXP: nextLevelUp.totalXP,
            originalXP: nextLevelUp.originalXP
          });
          return; // Don't close the modal, continue with next level
        } else {
          // All level-ups complete, clear the queue
          setLevelUpQueue([]);
        }
      }

      // Close the level up modal after all level-ups are complete
      setLevelUpData(null);

      // Force component re-render by updating a state value
      const now = Date.now();
      console.log(`Level up sequence complete at ${now}, character refreshed`);

    } catch (error) {
      console.error('Error refreshing character after level up:', error);
      // Still close the modal even if refresh fails
      setLevelUpData(null);
      setLevelUpQueue([]); // Clear queue on error
    }
  };

  const handleLevelUpCancel = async () => {
    if (levelUpData && data) {
      try {
        setXpLoading(true);
        // Revert to the original XP value
        await updateCharacterXP(levelUpData.originalXP);
        console.log(`Level up cancelled, XP reverted to ${levelUpData.originalXP}`);
      } catch (error) {
        console.error('Error reverting XP after level up cancel:', error);
      } finally {
        setXpLoading(false);
      }
    }
    setLevelUpData(null);
    setLevelUpQueue([]); // Clear any remaining level-ups in the queue
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading character details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please Sign In
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              You need to be signed in to view character details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchCharacterDetails}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { character, classBaseAttributes, classAbilities } = data;

  // Check if character is eligible for level-up
  const isLevelUpAvailable = getLevelFromExperience(character.experience) > character.currentLevel;
  const availableLevel = getLevelFromExperience(character.experience);

  // Prepare data for calculations
  const baseStats: CharacterBaseStats = {
    STR: character.currentSTR,
    CON: character.currentCON,
    DEX: character.currentDEX,
    INT: character.currentINT,
    WIS: character.currentWIS,
    CHA: character.currentCHA,
  };

  const characterClass: CharacterClass = {
    willpowerProgression: character.class?.willpowerProgression || 'NONE',
  };

  // Calculate all stats
  const calculatedStats = calculateAllCharacterStats(
    character.currentLevel,
    baseStats,
    classBaseAttributes,
    characterClass
  );

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              ← Back
            </button>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(character.currentStatus)}`}>
              {character.currentStatus}
            </div>
          </div>

          {/* Character Name Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {character.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Level {character.currentLevel} {character.class?.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {character.house?.name}, {character.county?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Level Up Available Banner */}
        {isLevelUpAvailable && (
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  🎉 Level Up Available!
                </h3>
                <p className="text-green-100">
                  {character.name} can advance from Level {character.currentLevel} to Level {availableLevel}
                </p>
              </div>
              <button
                onClick={() => handleLevelUpTriggered(availableLevel, character.experience)}
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-md"
              >
                Level Up Now!
              </button>
            </div>
          </div>
        )}

        {/* Tabbed Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <TabGroup key={`character-${character.id}-${character.updatedAt}-${character.currentLevel}`}>
            <TabList className="flex space-x-1 rounded-t-lg bg-blue-900/20 p-1">
              {['General Info', 'Stats', 'Abilities'].map((category) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-300
                     ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
                     ${selected
                      ? 'bg-white dark:bg-gray-700 shadow text-blue-700 dark:text-blue-300'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-white/[0.12] hover:text-blue-700 dark:hover:text-blue-300'
                    }`
                  }
                >
                  {category}
                </Tab>
              ))}
            </TabList>
            <TabPanels className="p-6">
              {/* General Info Tab */}
              <TabPanel className="focus:outline-none">
                <div className="space-y-6">
                  {/* Character Basic Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Character Information
                    </h3>
                    <CharacterInfoEditor
                      name={character.name}
                      trait={character.trait}
                      onUpdate={updateCharacterInfo}
                      isEditing={isEditingInfo}
                      onToggleEdit={() => setIsEditingInfo(!isEditingInfo)}
                    />
                  </div>

                  {/* HP and XP Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                        Health
                      </h4>
                      <HPEditor
                        currentHP={character.currentHP}
                        maxHP={character.maxHP}
                        onHPChange={updateCharacterHP}
                        isEditing={isEditingHP}
                        onToggleEdit={() => setIsEditingHP(!isEditingHP)}
                        isLoading={hpLoading}
                      />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                        Experience
                      </h4>
                      <XPEditor
                        experience={character.experience}
                        currentLevel={character.currentLevel}
                        onXPChange={updateCharacterXP}
                        isEditing={isEditingXP}
                        onToggleEdit={() => setIsEditingXP(!isEditingXP)}
                        isLoading={xpLoading}
                        onLevelUpTriggered={handleLevelUpTriggered}
                      />
                    </div>
                  </div>

                  {/* Notes Section */}
                  {character.notes && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Notes
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {character.notes}
                      </p>
                    </div>
                  )}
                </div>
              </TabPanel>

              {/* Stats Tab */}
              <TabPanel className="focus:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Stats */}
                  <BaseStatsSection
                    baseStats={baseStats}
                    modifiers={calculatedStats.baseModifiers}
                  />

                  {/* Other Stats */}
                  <OffensiveStatsSection stats={calculatedStats.offensiveStats} />
                  <DefensiveStatsSection stats={calculatedStats.defensiveStats} />
                  <MiscellaneousStatsSection
                    stats={calculatedStats.miscellaneousStats}
                    willpowerDescription={getWillpowerProgressionDescription(characterClass.willpowerProgression)}
                  />
                </div>
              </TabPanel>

              {/* Abilities Tab */}
              <TabPanel className="focus:outline-none">
                <ClassAbilitiesSection
                  availableAbilities={classAbilities.available}
                  futureAbilities={classAbilities.future}
                  currentLevel={character.currentLevel}
                />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>

        {/* Level Up Modal */}
        {levelUpData && (
          <LevelUpModal
            isOpen={true}
            onClose={() => setLevelUpData(null)}
            character={character}
            newLevel={levelUpData.newLevel}
            newXP={levelUpData.newXP}
            onLevelUpComplete={handleLevelUpComplete}
            onCancel={handleLevelUpCancel}
            sequenceInfo={levelUpQueue.length > 0 ? {
              currentStep: levelUpQueue.findIndex(item => item.toLevel === levelUpData.newLevel) + 1,
              totalSteps: levelUpQueue.length,
              targetLevel: levelUpQueue[levelUpQueue.length - 1]?.toLevel || levelUpData.newLevel
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}