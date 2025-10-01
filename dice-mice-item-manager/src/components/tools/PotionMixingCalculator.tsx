'use client';

import { useState, useEffect, useCallback } from 'react';
import { PotionTemplate } from '@/types/potions';

interface MortalityResult {
  totalPenalty: number;
  totalBonus: number;
  netModifier: number;
  safeChance: number; // 6+ result
  outcomes: {
    instantDeath: number; // -6 or lower
    maxDamage: number; // -5 to 0
    halfDamage: number; // 1-5
    highestLevelDamage: number; // 6-10
    oneDamage: number; // 11-15
    noEffect: number; // 16+
  };
  damageAmounts: {
    maxDamage: number;
    halfDamage: number;
    highestLevelDamage: number;
  };
}

interface SelectedPotion {
  potion: PotionTemplate;
  searchTerm: string;
  showDropdown: boolean;
}

export default function PotionMixingCalculator() {
  const [characterLevel, setCharacterLevel] = useState<number>(1);
  const [constitutionMod, setConstitutionMod] = useState<number>(0);
  const [maxHP, setMaxHP] = useState<number>(10);
  const [potionTemplates, setPotionTemplates] = useState<PotionTemplate[]>([]);
  const [selectedPotions, setSelectedPotions] = useState<SelectedPotion[]>([
    { potion: null as any, searchTerm: '', showDropdown: false },
    { potion: null as any, searchTerm: '', showDropdown: false },
    { potion: null as any, searchTerm: '', showDropdown: false },
    { potion: null as any, searchTerm: '', showDropdown: false },
    { potion: null as any, searchTerm: '', showDropdown: false },
  ]);
  const [result, setResult] = useState<MortalityResult | null>(null);

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

  // Calculate mortality results
  const calculateResults = useCallback(() => {
    const consumedPotions = selectedPotions.filter(sp => sp.potion?.id);

    if (consumedPotions.length < 2) {
      setResult(null);
      return;
    }

    // Calculate total penalty (combined levels of all potions)
    const totalPenalty = consumedPotions.reduce((sum, sp) => sum + sp.potion.level, 0);

    // Calculate total bonus (character level + constitution modifier)
    const totalBonus = characterLevel + constitutionMod;

    // Net modifier for the roll
    const netModifier = totalBonus - totalPenalty;

    // Calculate probabilities for each outcome range
    // Roll is 1d20 + netModifier
    const calculateChanceForRange = (minResult: number, maxResult: number) => {
      const minRoll = Math.max(1, minResult - netModifier);
      const maxRoll = Math.min(20, maxResult - netModifier);

      if (minRoll > maxRoll) return 0;
      if (minRoll <= 1 && maxRoll >= 20) return 100;

      const validRolls = Math.max(0, maxRoll - minRoll + 1);
      return (validRolls / 20) * 100;
    };

    const outcomes = {
      instantDeath: calculateChanceForRange(-Infinity, -6), // -6 or lower
      maxDamage: calculateChanceForRange(-5, 0), // -5 to 0
      halfDamage: calculateChanceForRange(1, 5), // 1-5
      highestLevelDamage: calculateChanceForRange(6, 10), // 6-10
      oneDamage: calculateChanceForRange(11, 15), // 11-15
      noEffect: calculateChanceForRange(16, Infinity), // 16+
    };

    // Safe chance is 6+ (everything except instant death, max damage, and half damage)
    const safeChance = outcomes.highestLevelDamage + outcomes.oneDamage + outcomes.noEffect;

    // Calculate damage amounts
    const highestLevel = Math.max(...consumedPotions.map(sp => sp.potion.level));
    const damageAmounts = {
      maxDamage: Math.max(maxHP, totalPenalty),
      halfDamage: Math.max(Math.floor(maxHP / 2), totalPenalty),
      highestLevelDamage: highestLevel,
    };

    setResult({
      totalPenalty,
      totalBonus,
      netModifier,
      safeChance,
      outcomes,
      damageAmounts,
    });
  }, [characterLevel, constitutionMod, maxHP, selectedPotions]);

  // Update calculations when inputs change
  useEffect(() => {
    calculateResults();
  }, [calculateResults]);

  // Filter potion templates based on search term for a specific slot (only discovered potions)
  const getFilteredPotions = (index: number) => {
    const searchTerm = selectedPotions[index].searchTerm;
    return potionTemplates.filter(potion =>
      potion.isDiscovered &&
      (potion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        potion.school.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const handlePotionSelect = (index: number, potion: PotionTemplate) => {
    const newSelectedPotions = [...selectedPotions];
    newSelectedPotions[index] = {
      potion,
      searchTerm: potion.name,
      showDropdown: false,
    };
    setSelectedPotions(newSelectedPotions);
  };

  const handleSearchChange = (index: number, searchTerm: string) => {
    const newSelectedPotions = [...selectedPotions];
    newSelectedPotions[index] = {
      potion: searchTerm ? newSelectedPotions[index].potion : null as any,
      searchTerm,
      showDropdown: true,
    };
    if (!searchTerm) {
      newSelectedPotions[index].potion = null as any;
    }
    setSelectedPotions(newSelectedPotions);
  };

  const clearPotion = (index: number) => {
    const newSelectedPotions = [...selectedPotions];
    newSelectedPotions[index] = {
      potion: null as any,
      searchTerm: '',
      showDropdown: false,
    };
    setSelectedPotions(newSelectedPotions);
  };

  const getOutcomeColor = (chance: number) => {
    if (chance === 0) return 'text-gray-500 dark:text-gray-400';
    if (chance >= 50) return 'text-red-600 dark:text-red-400';
    if (chance >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const consumedPotions = selectedPotions.filter(sp => sp.potion?.id);

  return (
    <div className="space-y-6">
      {/* Character Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            Constitution Modifier
          </label>
          <input
            type="number"
            value={constitutionMod}
            onChange={(e) => setConstitutionMod(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum HP
          </label>
          <input
            type="number"
            min="1"
            value={maxHP}
            onChange={(e) => setMaxHP(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Potion Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select Potions to Consume
        </h3>

        {selectedPotions.map((selectedPotion, index) => (
          <div key={index} className="relative">
            <div className="flex items-center space-x-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                Potion {index + 1}:
              </label>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search for a potion..."
                  value={selectedPotion.searchTerm}
                  onChange={(e) => handleSearchChange(index, e.target.value)}
                  onFocus={() => {
                    const newSelectedPotions = [...selectedPotions];
                    newSelectedPotions[index].showDropdown = true;
                    setSelectedPotions(newSelectedPotions);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />

                {selectedPotion.showDropdown && getFilteredPotions(index).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {getFilteredPotions(index).slice(0, 10).map((potion) => (
                      <button
                        key={potion.id}
                        onClick={() => handlePotionSelect(index, potion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 dark:text-white">{potion.name}</span>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Level {potion.level} • {potion.school}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPotion.potion?.id && (
                <button
                  onClick={() => clearPotion(index)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  ✕
                </button>
              )}
            </div>

            {selectedPotion.potion?.id && (
              <div className="mt-2 ml-22 p-2 bg-gray-50 dark:bg-gray-600 rounded-md">
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedPotion.potion.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">
                    (Level {selectedPotion.potion.level} {selectedPotion.potion.school})
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Results */}
      {result && consumedPotions.length >= 2 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mortality Check Results
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Check Details */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Check Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Potion Levels:</span>
                  <span className="text-red-600 dark:text-red-400">-{result.totalPenalty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Character Level + CON:</span>
                  <span className="text-green-600 dark:text-green-400">+{result.totalBonus}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-gray-900 dark:text-white">Net Modifier:</span>
                  <span className={`font-medium ${result.netModifier >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.netModifier >= 0 ? '+' : ''}{result.netModifier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Safe Outcome (6+):</span>
                  <span className={`font-medium ${result.safeChance >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.safeChance.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Outcome Probabilities */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Outcome Probabilities
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Instant Death (≤-6):</span>
                  <span className={getOutcomeColor(result.outcomes.instantDeath)}>
                    {result.outcomes.instantDeath.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Max/Combined Damage (-5 to 0):</span>
                  <span className={getOutcomeColor(result.outcomes.maxDamage)}>
                    {result.outcomes.maxDamage.toFixed(1)}% ({result.damageAmounts.maxDamage} dmg)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Half/Combined Damage (1-5):</span>
                  <span className={getOutcomeColor(result.outcomes.halfDamage)}>
                    {result.outcomes.halfDamage.toFixed(1)}% ({result.damageAmounts.halfDamage} dmg)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Highest Level Damage (6-10):</span>
                  <span className={getOutcomeColor(result.outcomes.highestLevelDamage)}>
                    {result.outcomes.highestLevelDamage.toFixed(1)}% ({result.damageAmounts.highestLevelDamage} dmg)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">1 Damage (11-15):</span>
                  <span className={getOutcomeColor(result.outcomes.oneDamage)}>
                    {result.outcomes.oneDamage.toFixed(1)}% (1 dmg)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">No Effect (16+):</span>
                  <span className={getOutcomeColor(result.outcomes.noEffect)}>
                    {result.outcomes.noEffect.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning for dangerous combinations */}
          {(result.outcomes.instantDeath > 25 || result.outcomes.maxDamage > 50) && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
              <div className="flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                <span className="text-red-800 dark:text-red-200 font-medium">
                  Warning: This potion combination is extremely dangerous!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {consumedPotions.length === 1 && (
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            💡 Select at least 2 potions to calculate mortality check results.
          </p>
        </div>
      )}

      {/* Game Rules Reference */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Mortality Check Reference
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>Check:</strong> 1d20 + Character Level + CON Modifier - Combined Potion Levels</p>
          <p><strong>-6 or lower:</strong> Instant death</p>
          <p><strong>-5 to 0:</strong> Damage = max(Max HP, Combined Potion Levels)</p>
          <p><strong>1-5:</strong> Damage = max(Half Max HP, Combined Potion Levels)</p>
          <p><strong>6-10:</strong> Damage = Highest level potion consumed</p>
          <p><strong>11-15:</strong> 1 point of damage</p>
          <p><strong>16+:</strong> No effect</p>
        </div>
      </div>
    </div>
  );
}