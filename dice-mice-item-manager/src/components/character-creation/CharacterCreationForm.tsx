'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface County {
  id: string;
  name: string;
  description: string;
  associatedStat: string;
  associatedSkills: string | null;
}

interface Class {
  id: string;
  name: string;
  description: string;
  prerequisiteStat1: string;
  prerequisiteStat2: string | null;
  isAvailable: boolean;
  willpowerProgression: string;
  hitDie: string;
}

interface UserHouse {
  id: string;
  name: string;
}

interface CharacterCreationData {
  counties: County[];
  classes: Class[];
  userHouse: UserHouse;
}

interface CharacterFormData {
  name: string;
  trait: string;
  countyId: string;
  classId: string;
  currentHP: number;
  maxHP: number;
  currentSTR: number;
  currentCON: number;
  currentDEX: number;
  currentINT: number;
  currentWIS: number;
  currentCHA: number;
}

export function CharacterCreationForm() {
  const router = useRouter();
  const [data, setData] = useState<CharacterCreationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    trait: '',
    countyId: '',
    classId: '',
    currentHP: 1,
    maxHP: 1,
    currentSTR: 10,
    currentCON: 10,
    currentDEX: 10,
    currentINT: 10,
    currentWIS: 10,
    currentCHA: 10,
  });

  useEffect(() => {
    fetchCreationData();
  }, []);

  const fetchCreationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/character-creation-data');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch creation data');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch creation data');
      }
    } catch (err) {
      console.error('Error fetching creation data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getEligibleClasses = (): Class[] => {
    if (!data) return [];

    return data.classes.filter(cls => {
      const getStatValue = (statName: string): number => {
        switch (statName.toUpperCase()) {
          case 'STR': return formData.currentSTR;
          case 'CON': return formData.currentCON;
          case 'DEX': return formData.currentDEX;
          case 'INT': return formData.currentINT;
          case 'WIS': return formData.currentWIS;
          case 'CHA': return formData.currentCHA;
          default: return 0;
        }
      };

      const primaryStat = getStatValue(cls.prerequisiteStat1);
      const secondaryStat = cls.prerequisiteStat2 ? getStatValue(cls.prerequisiteStat2) : 13;

      return primaryStat >= 13 && secondaryStat >= 13;
    });
  };

  const handleStatChange = (stat: keyof Pick<CharacterFormData, 'currentSTR' | 'currentCON' | 'currentDEX' | 'currentINT' | 'currentWIS' | 'currentCHA'>, value: number) => {
    setFormData(prev => ({
      ...prev,
      [stat]: Math.max(3, Math.min(18, value))
    }));

    // Reset class selection if current class is no longer eligible
    if (formData.classId) {
      const newStats = { ...formData, [stat]: value };
      const eligibleClasses = data?.classes.filter(cls => {
        const getStatValue = (statName: string): number => {
          switch (statName.toUpperCase()) {
            case 'STR': return newStats.currentSTR;
            case 'CON': return newStats.currentCON;
            case 'DEX': return newStats.currentDEX;
            case 'INT': return newStats.currentINT;
            case 'WIS': return newStats.currentWIS;
            case 'CHA': return newStats.currentCHA;
            default: return 0;
          }
        };

        const primaryStat = getStatValue(cls.prerequisiteStat1);
        const secondaryStat = cls.prerequisiteStat2 ? getStatValue(cls.prerequisiteStat2) : 13;

        return primaryStat >= 13 && secondaryStat >= 13;
      }) || [];

      if (!eligibleClasses.find(cls => cls.id === formData.classId)) {
        setFormData(prev => ({ ...prev, classId: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Character name is required');
      return;
    }

    if (!formData.countyId || !formData.classId) {
      setError('County and class are required');
      return;
    }

    if (formData.maxHP < 1) {
      setError('Max HP must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/create-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create character');
      }

      if (result.success) {
        router.push('/my-characters');
      } else {
        throw new Error(result.error || 'Failed to create character');
      }
    } catch (err) {
      console.error('Error creating character:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading character creation data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={fetchCreationData}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const eligibleClasses = getEligibleClasses();

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label htmlFor="trait" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trait (Optional)
            </label>
            <input
              type="text"
              id="trait"
              value={formData.trait}
              onChange={(e) => setFormData(prev => ({ ...prev, trait: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter trait"
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>House:</strong> {data.userHouse.name}
          </p>
        </div>
      </div>

      {/* Origin County */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Origin County</h2>

        <div>
          <label htmlFor="county" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select County *
          </label>
          <select
            id="county"
            value={formData.countyId}
            onChange={(e) => setFormData(prev => ({ ...prev, countyId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Choose a county...</option>
            {data.counties.map(county => (
              <option key={county.id} value={county.id}>
                {county.name} (Associated Stat: {county.associatedStat})
              </option>
            ))}
          </select>

          {formData.countyId && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              {(() => {
                const selectedCounty = data.counties.find(c => c.id === formData.countyId);
                return selectedCounty ? (
                  <div>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                      <strong>Benefits:</strong> 4d6 keep highest 3 for {selectedCounty.associatedStat}
                      {selectedCounty.associatedSkills && `, once per adventure reroll for one of the following checks ${selectedCounty.associatedSkills}`}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Base Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Base Stats</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'currentSTR' as const, label: 'STR' },
            { key: 'currentCON' as const, label: 'CON' },
            { key: 'currentDEX' as const, label: 'DEX' },
            { key: 'currentINT' as const, label: 'INT' },
            { key: 'currentWIS' as const, label: 'WIS' },
            { key: 'currentCHA' as const, label: 'CHA' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label} *
              </label>
              <input
                type="number"
                id={key}
                min="3"
                max="24"
                value={formData[key]}
                onChange={(e) => handleStatChange(key, parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Stats must be between 3-24. Use 4d6 keep highest 3 for your county&apos;s associated stat.
        </p>
      </div>

      {/* Class Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Character Class</h2>

        <div>
          <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Class *
          </label>
          <select
            id="class"
            value={formData.classId}
            onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Choose a class...</option>
            {eligibleClasses.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} (Req: {cls.prerequisiteStat1}{cls.prerequisiteStat2 ? `, ${cls.prerequisiteStat2}` : ''} 13+)
              </option>
            ))}
          </select>

          {eligibleClasses.length === 0 && (
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
              No classes available with current stats. Classes require at least 13 in prerequisite stats.
            </p>
          )}

          {formData.classId && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              {(() => {
                const selectedClass = eligibleClasses.find(c => c.id === formData.classId);
                return selectedClass ? (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedClass.description}</p>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                      <strong>Hit Die:</strong> {selectedClass.hitDie} |
                      <strong> Willpower:</strong> {selectedClass.willpowerProgression}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* HP */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hit Points</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label htmlFor="maxHP" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max HP (Level 1) *
          </label>
          <input
            type="number"
            id="maxHP"
            min="1"
            value={formData.maxHP}
            onChange={(e) => {
              const newMaxHP = parseInt(e.target.value) || 1;
              setFormData(prev => ({
                ...prev,
                maxHP: newMaxHP,
                currentHP: newMaxHP
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      {/* Submit */}
      <div className="text-center">
        <button
          type="submit"
          disabled={submitting || eligibleClasses.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating Character...' : 'Create Character'}
        </button>
      </div>
    </form>
  );
}