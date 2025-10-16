'use client';

import { useEffect, useState, useCallback, ChangeEvent } from 'react';

interface PotionTemplate {
  id: string;
  name: string;
  description: string;
}

interface MasteryEntry {
  potionTemplateId: string;
  masteryLevel: number;
  lastUpdated: number;
  potionTemplate: PotionTemplate | null;
}

interface CharacterMasteryTabProps {
  characterId: string;
}

export function CharacterMasteryTab({ characterId }: CharacterMasteryTabProps) {
  const [currentMastery, setCurrentMastery] = useState<MasteryEntry[]>([]);
  const [discoveredPotions, setDiscoveredPotions] = useState<PotionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMastery, setEditingMastery] = useState<Record<string, number>>({});
  const [addingMastery, setAddingMastery] = useState({
    potionTemplateId: '',
    masteryLevel: 1,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const fetchMasteryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/character/${characterId}/mastery`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch mastery data');
      }

      const data = await response.json();
      setCurrentMastery(data.currentMastery);
      setDiscoveredPotions(data.discoveredPotions);
    } catch (err) {
      console.error('Error fetching mastery data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch mastery data');
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    fetchMasteryData();
  }, [fetchMasteryData]);

  const updateMastery = async (potionTemplateId: string, masteryLevel: number) => {
    try {
      setUpdating(prev => ({ ...prev, [potionTemplateId]: true }));
      setError(null);

      const response = await fetch(`/api/character/${characterId}/mastery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          potionTemplateId,
          masteryLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update mastery');
      }

      // Refresh data to reflect changes
      await fetchMasteryData();

      // Clear editing state for this potion
      setEditingMastery(prev => {
        const newState = { ...prev };
        delete newState[potionTemplateId];
        return newState;
      });
    } catch (err) {
      console.error('Error updating mastery:', err);
      setError(err instanceof Error ? err.message : 'Failed to update mastery');
    } finally {
      setUpdating(prev => ({ ...prev, [potionTemplateId]: false }));
    }
  };

  const handleAddMastery = async () => {
    if (!addingMastery.potionTemplateId) {
      setError('Please select a potion');
      return;
    }

    await updateMastery(addingMastery.potionTemplateId, addingMastery.masteryLevel);

    // Reset form and hide it
    setAddingMastery({ potionTemplateId: '', masteryLevel: 1 });
    setShowAddForm(false);
  };

  const startEditing = (potionTemplateId: string, currentLevel: number) => {
    setEditingMastery(prev => ({ ...prev, [potionTemplateId]: currentLevel }));
  };

  const cancelEditing = (potionTemplateId: string) => {
    setEditingMastery(prev => {
      const newState = { ...prev };
      delete newState[potionTemplateId];
      return newState;
    });
  };

  const saveEditing = async (potionTemplateId: string) => {
    const newLevel = editingMastery[potionTemplateId];
    if (newLevel !== undefined) {
      await updateMastery(potionTemplateId, newLevel);
    }
  };

  // Filter out potions that the character already has mastery in
  const availablePotions = discoveredPotions.filter(
    potion => !currentMastery.some(mastery => mastery.potionTemplateId === potion.id)
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading mastery data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchMasteryData}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Mastery Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Potion Mastery
          </h3>
          {availablePotions.length > 0 && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add Mastery'}
            </button>
          )}
        </div>

        {currentMastery.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No potion mastery yet. Start crafting potions to gain mastery!
          </div>
        ) : (
          <div className="grid gap-4">
            {currentMastery.map((mastery) => (
              <div
                key={mastery.potionTemplateId}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {mastery.potionTemplate?.name || 'Unknown Potion'}
                  </h4>
                  {mastery.potionTemplate?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {mastery.potionTemplate.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last updated: {(() => {
                      if (!mastery.lastUpdated || isNaN(mastery.lastUpdated)) return 'Never';

                      // Try both Unix timestamp (seconds) and JavaScript timestamp (milliseconds)
                      let date = new Date(mastery.lastUpdated);
                      if (isNaN(date.getTime())) {
                        date = new Date(mastery.lastUpdated * 1000);
                      }

                      return isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
                    })()}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {editingMastery[mastery.potionTemplateId] !== undefined ? (
                    // Editing mode
                    <>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editingMastery[mastery.potionTemplateId]}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingMastery(prev => ({
                          ...prev,
                          [mastery.potionTemplateId]: Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                        }))}
                        className="w-16 text-center px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                      <button
                        onClick={() => saveEditing(mastery.potionTemplateId)}
                        disabled={updating[mastery.potionTemplateId]}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        {updating[mastery.potionTemplateId] ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => cancelEditing(mastery.potionTemplateId)}
                        disabled={updating[mastery.potionTemplateId]}
                        className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {mastery.masteryLevel}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / 10
                        </span>
                      </div>
                      <button
                        onClick={() => startEditing(mastery.potionTemplateId, mastery.masteryLevel)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Mastery Form */}
      {showAddForm && availablePotions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Add New Potion Mastery
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Potion
              </label>
              <select
                value={addingMastery.potionTemplateId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setAddingMastery(prev => ({ ...prev, potionTemplateId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              >
                <option value="">Select a potion...</option>
                {availablePotions.map((potion) => (
                  <option key={potion.id} value={potion.id}>
                    {potion.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mastery Level (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={addingMastery.masteryLevel}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAddingMastery(prev => ({
                  ...prev,
                  masteryLevel: Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleAddMastery}
                disabled={!addingMastery.potionTemplateId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                Add Mastery
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Text */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium mb-2">About Potion Mastery:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Mastery ranges from 0 to 10 points for each potion type</li>
          <li>Gain mastery by crafting potions: 2 points for critical success, 1 point for success</li>
          <li>Grunt workers gain 1 point for critical success or success</li>
        </ul>
      </div>
    </div>
  );
}