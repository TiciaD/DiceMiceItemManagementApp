'use client';

import { useState, useEffect } from 'react';
import { PotionTemplate } from '@/types/potions';

interface CraftingResult {
  dc: number;
  totalBonus: number;
  criticalFailChance: number;
  failChance: number;
  successChance: number;
  criticalSuccessChance: number;
  daysRequired: number;
  cost: number;
  discoveryMode: boolean;
}

export default function PotionCraftingCalculator() {
  const [characterLevel, setCharacterLevel] = useState<number>(1);
  const [modifierTotal, setModifierTotal] = useState<number>(0);
  const [potionMastery, setPotionMastery] = useState<number>(0);
  const [extraBonus, setExtraBonus] = useState<number>(0);
  const [discoveryMode, setDiscoveryMode] = useState<boolean>(false);
  const [potionLevel, setPotionLevel] = useState<number>(1);
  const [selectedPotion, setSelectedPotion] = useState<PotionTemplate | null>(null);
  const [potionTemplates, setPotionTemplates] = useState<PotionTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [result, setResult] = useState<CraftingResult | null>(null);

  // Fetch potion templates on component mount
  useEffect(() => {
    const fetchPotionTemplates = async () => {
      try {
        const response = await fetch('/api/potion-templates');
        if (response.ok) {
          const templates = await response.json();
          setPotionTemplates(templates);
        }
      } catch (error) {
        console.error('Failed to fetch potion templates:', error);
      }
    };

    fetchPotionTemplates();
  }, []);

  // Filter potion templates based on search term (only discovered potions)
  const filteredPotions = potionTemplates.filter(potion =>
    potion.isDiscovered &&
    (potion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      potion.school.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate crafting results
  const calculateResults = () => {
    if (!discoveryMode && !selectedPotion) return;
    if (discoveryMode && !potionLevel) return;

    const currentPotionLevel = discoveryMode ? potionLevel : selectedPotion!.level;

    // DC calculation: (Potion Level - Crafter Level) * 3 + 13, minimum DC 10
    const dc = Math.max(10, (currentPotionLevel - characterLevel) * 3 + 13);

    // Total bonus for the roll
    const totalBonus = modifierTotal + potionMastery + extraBonus;

    // Calculate probabilities (assuming d20 roll)
    // We need to account for natural 1s and 20s

    let criticalSuccessChance = 0;
    let successChance = 0;
    let failChance = 0;
    let criticalFailChance = 0;

    // For each possible d20 roll (1-20)
    for (let roll = 1; roll <= 20; roll++) {
      const total = roll + totalBonus;
      const isNat1 = roll === 1;
      const isNat20 = roll === 20;

      if (total >= dc + 10 || (isNat20 && total >= dc)) {
        // Critical Success: exceeds DC by 10+ OR nat 20 with success
        criticalSuccessChance += 5; // 1/20 = 5%
      } else if (total >= dc) {
        // Regular Success
        successChance += 5;
      } else if (total <= dc - 10 || (isNat1 && total < dc)) {
        // Critical Fail: below DC by 10+ OR nat 1 with failure
        criticalFailChance += 5;
      } else {
        // Regular Fail
        failChance += 5;
      }
    }

    // Calculate time required
    const daysRequired = currentPotionLevel <= characterLevel ? 1 : 1 + (currentPotionLevel - characterLevel);

    // Calculate cost (double for discovery)
    const baseCost = discoveryMode ? currentPotionLevel * 10 : (selectedPotion!.cost || currentPotionLevel * 10);
    const cost = discoveryMode ? baseCost * 2 : baseCost;

    setResult({
      dc,
      totalBonus,
      criticalFailChance,
      failChance,
      successChance,
      criticalSuccessChance,
      daysRequired,
      cost,
      discoveryMode,
    });
  };

  // Update calculations when inputs change
  useEffect(() => {
    if (selectedPotion || discoveryMode) {
      calculateResults();
    }
  }, [characterLevel, modifierTotal, potionMastery, extraBonus, discoveryMode, potionLevel, selectedPotion]);

  const handlePotionSelect = (potion: PotionTemplate) => {
    setSelectedPotion(potion);
    setSearchTerm(potion.name);
    setShowDropdown(false);
  };

  const getResultColor = (chance: number) => {
    if (chance >= 50) return 'text-green-600 dark:text-green-400';
    if (chance >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Character Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Character Level
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={characterLevel}
            onChange={(e) => setCharacterLevel(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            INT/WIS Modifier
          </label>
          <input
            type="number"
            value={modifierTotal}
            onChange={(e) => setModifierTotal(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Potion Mastery
          </label>
          <input
            type="number"
            min="0"
            value={potionMastery}
            onChange={(e) => setPotionMastery(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Extra Bonus
            <span className="text-xs text-gray-500 dark:text-gray-400 block">
              (Items, class features, etc.)
            </span>
          </label>
          <input
            type="number"
            value={extraBonus}
            onChange={(e) => setExtraBonus(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Discovery Mode Toggle */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="discoveryMode"
            checked={discoveryMode}
            onChange={(e) => {
              setDiscoveryMode(e.target.checked);
              if (e.target.checked) {
                setSelectedPotion(null);
                setSearchTerm('');
              }
            }}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="discoveryMode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Discovery Mode (Attempt to discover an unknown potion)
          </label>
        </div>

        {discoveryMode && (
          <div className="ml-7">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Potion Level to Discover
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={potionLevel}
              onChange={(e) => setPotionLevel(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Potion Selection */}
      {!discoveryMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Known Potion to Craft
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a potion..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) setSelectedPotion(null);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />

            {showDropdown && filteredPotions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredPotions.slice(0, 10).map((potion) => (
                  <button
                    key={potion.id}
                    onClick={() => handlePotionSelect(potion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 dark:text-white">{potion.name}</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Level {potion.level} • {potion.school} • {potion.cost || potion.level * 10}gp
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPotion && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-600 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{selectedPotion.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Level {selectedPotion.level} {selectedPotion.school} •
                    Base Cost: {selectedPotion.cost || selectedPotion.level * 10}gp
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${selectedPotion.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                  selectedPotion.rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                    selectedPotion.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      selectedPotion.rarity === 'very_rare' ? 'bg-purple-100 text-purple-800' :
                        selectedPotion.rarity === 'legendary' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                  }`}>
                  {selectedPotion.rarity?.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (selectedPotion || discoveryMode) && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {discoveryMode ? 'Discovery' : 'Crafting'} Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check Details */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Crafting Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">DC:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{result.dc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Bonus:</span>
                  <span className="text-green-600 dark:text-green-400">+{result.totalBonus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Time Required:</span>
                  <span className="text-gray-900 dark:text-white">{result.daysRequired} day{result.daysRequired > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Cost:</span>
                  <span className="text-gray-900 dark:text-white">
                    {result.cost}gp {result.discoveryMode && '(discovery)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Probabilities */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Success Probabilities
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Critical Success:</span>
                  <span className={getResultColor(result.criticalSuccessChance)}>
                    {result.criticalSuccessChance}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Success:</span>
                  <span className={getResultColor(result.successChance)}>
                    {result.successChance}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Fail:</span>
                  <span className={getResultColor(100 - result.failChance)}>
                    {result.failChance}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Critical Fail:</span>
                  <span className={getResultColor(100 - result.criticalFailChance)}>
                    {result.criticalFailChance}%
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-gray-900 dark:text-white">Overall Success:</span>
                  <span className={`font-medium ${getResultColor(result.criticalSuccessChance + result.successChance)}`}>
                    {result.criticalSuccessChance + result.successChance}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Outcome explanations */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Outcome Effects</h5>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {discoveryMode ? (
                <>
                  <p><strong>Critical Success:</strong> Craft two successful potions of the discovered type</p>
                  <p><strong>Success:</strong> Craft one successful potion of the discovered type</p>
                  <p><strong>Fail:</strong> Craft one failed version (no mastery gained)</p>
                  <p><strong>Critical Fail:</strong> No potion created, lose materials and time</p>
                </>
              ) : (
                <>
                  <p><strong>Critical Success:</strong> Craft the potion with maximum potency</p>
                  <p><strong>Success:</strong> Craft the potion with normal potency</p>
                  <p><strong>Fail:</strong> Craft the potion with low potency</p>
                  <p><strong>Critical Fail:</strong> No potion created, lose materials and time</p>
                </>
              )}
            </div>
          </div>

          {/* Warning for difficult crafts */}
          {(result.criticalFailChance > 25 || result.criticalSuccessChance + result.successChance < 50) && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md">
              <div className="flex items-center">
                <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Warning: This is a challenging craft with high risk of failure!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Rules Reference */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Crafting Rules Reference
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>DC Formula:</strong> (Potion Level - Crafter Level) × 3 + 13 (minimum DC 10)</p>
          <p><strong>Time:</strong> 1 day if potion level ≤ character level, +1 day per level above</p>
          <p><strong>Cost:</strong> Base cost (double for discovery mode)</p>
          <p><strong>Critical Success:</strong> Exceed DC by 10+ OR natural 20 with success</p>
          <p><strong>Critical Fail:</strong> Below DC by 10+ OR natural 1 with failure</p>
        </div>
      </div>
    </div>
  );
}