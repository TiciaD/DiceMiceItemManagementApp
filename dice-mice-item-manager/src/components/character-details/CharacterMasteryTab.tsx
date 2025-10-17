'use client';

import { useEffect, useState, useCallback, ChangeEvent } from 'react';

interface PotionTemplate {
  id: string;
  name: string;
  description: string;
}

interface SpellTemplate {
  id: string;
  name: string;
  baseEffect: string;
  school: string;
  level: number;
}

interface PotionMasteryEntry {
  potionTemplateId: string;
  masteryLevel: number;
  lastUpdated: number;
  potionTemplate: PotionTemplate | null;
}

interface SpellMasteryEntry {
  spellTemplateId: string;
  masteryLevel: number;
  lastUpdated: number;
  spellTemplate: SpellTemplate | null;
}

interface CharacterMasteryTabProps {
  characterId: string;
}

export function CharacterMasteryTab({ characterId }: CharacterMasteryTabProps) {
  const [currentPotionMastery, setCurrentPotionMastery] = useState<PotionMasteryEntry[]>([]);
  const [currentSpellMastery, setCurrentSpellMastery] = useState<SpellMasteryEntry[]>([]);
  const [discoveredPotions, setDiscoveredPotions] = useState<PotionTemplate[]>([]);
  const [discoveredSpells, setDiscoveredSpells] = useState<SpellTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPotionMastery, setEditingPotionMastery] = useState<Record<string, number>>({});
  const [editingSpellMastery, setEditingSpellMastery] = useState<Record<string, number>>({});
  const [addingPotionMastery, setAddingPotionMastery] = useState({
    potionTemplateId: '',
    masteryLevel: 1,
  });
  const [addingSpellMastery, setAddingSpellMastery] = useState({
    spellTemplateId: '',
    masteryLevel: 1,
  });
  const [showAddPotionForm, setShowAddPotionForm] = useState(false);
  const [showAddSpellForm, setShowAddSpellForm] = useState(false);
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
      setCurrentPotionMastery(data.currentPotionMastery);
      setCurrentSpellMastery(data.currentSpellMastery);
      setDiscoveredPotions(data.discoveredPotions);
      setDiscoveredSpells(data.discoveredSpells);
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

  const updatePotionMastery = async (potionTemplateId: string, masteryLevel: number) => {
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
        throw new Error(errorData.error || 'Failed to update potion mastery');
      }

      // Refresh data to reflect changes
      await fetchMasteryData();

      // Clear editing state for this potion
      setEditingPotionMastery(prev => {
        const newState = { ...prev };
        delete newState[potionTemplateId];
        return newState;
      });
    } catch (err) {
      console.error('Error updating potion mastery:', err);
      setError(err instanceof Error ? err.message : 'Failed to update potion mastery');
    } finally {
      setUpdating(prev => ({ ...prev, [potionTemplateId]: false }));
    }
  };

  const updateSpellMastery = async (spellTemplateId: string, masteryLevel: number) => {
    try {
      setUpdating(prev => ({ ...prev, [spellTemplateId]: true }));
      setError(null);

      const response = await fetch(`/api/character/${characterId}/mastery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spellTemplateId,
          masteryLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update spell mastery');
      }

      // Refresh data to reflect changes
      await fetchMasteryData();

      // Clear editing state for this spell
      setEditingSpellMastery(prev => {
        const newState = { ...prev };
        delete newState[spellTemplateId];
        return newState;
      });
    } catch (err) {
      console.error('Error updating spell mastery:', err);
      setError(err instanceof Error ? err.message : 'Failed to update spell mastery');
    } finally {
      setUpdating(prev => ({ ...prev, [spellTemplateId]: false }));
    }
  };

  const handleAddPotionMastery = async () => {
    if (!addingPotionMastery.potionTemplateId) {
      setError('Please select a potion');
      return;
    }

    await updatePotionMastery(addingPotionMastery.potionTemplateId, addingPotionMastery.masteryLevel);

    // Reset form and hide it
    setAddingPotionMastery({ potionTemplateId: '', masteryLevel: 1 });
    setShowAddPotionForm(false);
  };

  const handleAddSpellMastery = async () => {
    if (!addingSpellMastery.spellTemplateId) {
      setError('Please select a spell');
      return;
    }

    await updateSpellMastery(addingSpellMastery.spellTemplateId, addingSpellMastery.masteryLevel);

    // Reset form and hide it
    setAddingSpellMastery({ spellTemplateId: '', masteryLevel: 1 });
    setShowAddSpellForm(false);
  };

  const startEditingPotion = (potionTemplateId: string, currentLevel: number) => {
    setEditingPotionMastery(prev => ({ ...prev, [potionTemplateId]: currentLevel }));
  };

  const cancelEditingPotion = (potionTemplateId: string) => {
    setEditingPotionMastery(prev => {
      const newState = { ...prev };
      delete newState[potionTemplateId];
      return newState;
    });
  };

  const saveEditingPotion = async (potionTemplateId: string) => {
    const newLevel = editingPotionMastery[potionTemplateId];
    if (newLevel !== undefined) {
      await updatePotionMastery(potionTemplateId, newLevel);
    }
  };

  const startEditingSpell = (spellTemplateId: string, currentLevel: number) => {
    setEditingSpellMastery(prev => ({ ...prev, [spellTemplateId]: currentLevel }));
  };

  const cancelEditingSpell = (spellTemplateId: string) => {
    setEditingSpellMastery(prev => {
      const newState = { ...prev };
      delete newState[spellTemplateId];
      return newState;
    });
  };

  const saveEditingSpell = async (spellTemplateId: string) => {
    const newLevel = editingSpellMastery[spellTemplateId];
    if (newLevel !== undefined) {
      await updateSpellMastery(spellTemplateId, newLevel);
    }
  };

  // Filter out potions that the character already has mastery in
  const availablePotions = discoveredPotions.filter(
    potion => !currentPotionMastery.some(mastery => mastery.potionTemplateId === potion.id)
  );

  // Filter out spells that the character already has mastery in
  const availableSpells = discoveredSpells.filter(
    spell => !currentSpellMastery.some(mastery => mastery.spellTemplateId === spell.id)
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
    <div className="space-y-8">
      {/* Potion Mastery Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Potion Mastery
          </h3>
          {availablePotions.length > 0 && (
            <button
              onClick={() => setShowAddPotionForm(!showAddPotionForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
            >
              {showAddPotionForm ? 'Cancel' : 'Add Potion Mastery'}
            </button>
          )}
        </div>

        {currentPotionMastery.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No potion mastery yet. Start crafting potions to gain mastery!
          </div>
        ) : (
          <div className="grid gap-4">
            {currentPotionMastery.map((mastery) => (
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
                  {editingPotionMastery[mastery.potionTemplateId] !== undefined ? (
                    // Editing mode
                    <>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editingPotionMastery[mastery.potionTemplateId]}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingPotionMastery(prev => ({
                          ...prev,
                          [mastery.potionTemplateId]: Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                        }))}
                        className="w-16 text-center px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                      <button
                        onClick={() => saveEditingPotion(mastery.potionTemplateId)}
                        disabled={updating[mastery.potionTemplateId]}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        {updating[mastery.potionTemplateId] ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => cancelEditingPotion(mastery.potionTemplateId)}
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
                        onClick={() => startEditingPotion(mastery.potionTemplateId, mastery.masteryLevel)}
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

      {/* Add New Potion Mastery Form */}
      {showAddPotionForm && availablePotions.length > 0 && (
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
                value={addingPotionMastery.potionTemplateId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setAddingPotionMastery(prev => ({ ...prev, potionTemplateId: e.target.value }))}
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
                value={addingPotionMastery.masteryLevel}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAddingPotionMastery(prev => ({
                  ...prev,
                  masteryLevel: Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleAddPotionMastery}
                disabled={!addingPotionMastery.potionTemplateId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                Add Mastery
              </button>
              <button
                onClick={() => setShowAddPotionForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spell Mastery Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Spell Mastery
          </h3>
          {availableSpells.length > 0 && (
            <button
              onClick={() => setShowAddSpellForm(!showAddSpellForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
            >
              {showAddSpellForm ? 'Cancel' : 'Add Spell Mastery'}
            </button>
          )}
        </div>

        {currentSpellMastery.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No spell mastery yet. Start crafting scrolls to gain mastery!
          </div>
        ) : (
          <div className="grid gap-4">
            {currentSpellMastery.map((mastery) => (
              <div
                key={mastery.spellTemplateId}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {mastery.spellTemplate?.name || 'Unknown Spell'}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      {mastery.spellTemplate?.school} • Level {mastery.spellTemplate?.level}
                    </span>
                  </div>
                  {mastery.spellTemplate?.baseEffect && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {mastery.spellTemplate.baseEffect}
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
                  {editingSpellMastery[mastery.spellTemplateId] !== undefined ? (
                    // Editing mode
                    <>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editingSpellMastery[mastery.spellTemplateId]}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingSpellMastery(prev => ({
                          ...prev,
                          [mastery.spellTemplateId]: Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                        }))}
                        className="w-16 text-center px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                      <button
                        onClick={() => saveEditingSpell(mastery.spellTemplateId)}
                        disabled={updating[mastery.spellTemplateId]}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        {updating[mastery.spellTemplateId] ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => cancelEditingSpell(mastery.spellTemplateId)}
                        disabled={updating[mastery.spellTemplateId]}
                        className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {mastery.masteryLevel}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / 10
                        </span>
                      </div>
                      <button
                        onClick={() => startEditingSpell(mastery.spellTemplateId, mastery.masteryLevel)}
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

      {/* Add New Spell Mastery Form */}
      {showAddSpellForm && availableSpells.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Add New Spell Mastery
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Spell
              </label>
              <select
                value={addingSpellMastery.spellTemplateId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setAddingSpellMastery(prev => ({ ...prev, spellTemplateId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              >
                <option value="">Select a spell...</option>
                {availableSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name} ({spell.school} {spell.level})
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
                value={addingSpellMastery.masteryLevel}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAddingSpellMastery(prev => ({
                  ...prev,
                  masteryLevel: Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleAddSpellMastery}
                disabled={!addingSpellMastery.spellTemplateId}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                Add Mastery
              </button>
              <button
                onClick={() => setShowAddSpellForm(false)}
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
        <h4 className="font-medium mb-2">About Mastery:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Potion Mastery:</strong> Ranges from 0 to 10 points for each potion type</li>
          <li>Gain potion mastery by crafting and consuming potions: 2 points for critical success, 1 point for success</li>
          <li>Grunt workers gain 1 point for critical success or success</li>
          <li><strong>Spell Mastery:</strong> Ranges from 0 to 10 points for each spell type</li>
          <li>Gain spell mastery by casting spells: 2 points for critical success, 1 point for success, 2 points for failure</li>
        </ul>
      </div>
    </div>
  );
}