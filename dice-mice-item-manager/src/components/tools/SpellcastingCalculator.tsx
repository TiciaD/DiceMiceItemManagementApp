'use client';

import { useState, useEffect, useCallback } from 'react';
import { SpellTemplate } from '@/types/spells';

interface SpellcastingResult {
  dc: number;
  criticalFailChance: number;
  failChance: number;
  successChance: number;
  criticalSuccessChance: number;
  willpowerCosts: {
    criticalFail: number;
    fail: number;
    success: number;
    criticalSuccess: number;
  };
  hpDamage: {
    criticalFail: number;
    fail: number;
    success: number;
    criticalSuccess: number;
  };
}

export default function SpellcastingCalculator() {
  const [characterLevel, setCharacterLevel] = useState<number>(1);
  const [modifierTotal, setModifierTotal] = useState<number>(0);
  const [spellMastery, setSpellMastery] = useState<number>(0);
  const [selectedSpell, setSelectedSpell] = useState<SpellTemplate | null>(null);
  const [currentWillpower, setCurrentWillpower] = useState<number>(1);
  const [currentHP, setCurrentHP] = useState<number>(10);
  const [spellTemplates, setSpellTemplates] = useState<SpellTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [result, setResult] = useState<SpellcastingResult | null>(null);

  // Fetch spell templates on component mount
  useEffect(() => {
    const fetchSpellTemplates = async () => {
      try {
        const response = await fetch('/api/spell-templates');
        if (response.ok) {
          const templates = await response.json();
          setSpellTemplates(templates);
        }
      } catch (error) {
        console.error('Failed to fetch spell templates:', error);
      }
    };

    fetchSpellTemplates();
  }, []);

  // Filter spell templates based on search term (only discovered spells)
  const filteredSpells = spellTemplates.filter(spell =>
    spell.isDiscovered &&
    (spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spell.school.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate spellcasting results
  const calculateResults = useCallback(() => {
    if (!selectedSpell) return;

    const spellLevel = selectedSpell.level;

    // DC calculation: (Spell Level - Caster Level) * 3 + 13, minimum DC 10
    const dc = Math.max(10, (spellLevel - characterLevel) * 3 + 13);

    // Total bonus for the roll
    const totalBonus = modifierTotal + spellMastery;

    // Calculate probabilities (assuming d20 roll)
    // Critical fail: natural 1
    const criticalFailChance = 5; // 1/20 = 5%

    // Critical success: natural 20
    const criticalSuccessChance = 5; // 1/20 = 5%

    // Regular success: roll + bonus >= DC (excluding natural 20)
    const minRollForSuccess = Math.max(1, dc - totalBonus);
    let successChance = 0;
    if (minRollForSuccess <= 19) {
      successChance = Math.max(0, 19 - minRollForSuccess + 1) * 5; // Each point on d20 is 5%
    }

    // Fail: everything else (excluding natural 1)
    const failChance = Math.max(0, 90 - criticalSuccessChance - successChance);

    // Willpower costs
    const willpowerCosts = {
      criticalSuccess: 1,
      success: 1,
      fail: 1 + spellLevel,
      criticalFail: 1 + (spellLevel * 2),
    };

    // HP damage (2 HP per 1 willpower overflow)
    const calculateHPDamage = (willpowerCost: number) => {
      const overflow = Math.max(0, willpowerCost - currentWillpower);
      return overflow * 2;
    };

    const hpDamage = {
      criticalSuccess: calculateHPDamage(willpowerCosts.criticalSuccess),
      success: calculateHPDamage(willpowerCosts.success),
      fail: calculateHPDamage(willpowerCosts.fail),
      criticalFail: calculateHPDamage(willpowerCosts.criticalFail),
    };

    setResult({
      dc,
      criticalFailChance,
      failChance,
      successChance,
      criticalSuccessChance,
      willpowerCosts,
      hpDamage,
    });
  }, [selectedSpell, characterLevel, modifierTotal, spellMastery, currentWillpower]);

  // Update calculations when inputs change
  useEffect(() => {
    if (selectedSpell) {
      calculateResults();
    }
  }, [selectedSpell, calculateResults]);

  const handleSpellSelect = (spell: SpellTemplate) => {
    setSelectedSpell(spell);
    setSearchTerm(spell.name);
    setShowDropdown(false);
  };

  const getResultColor = (chance: number) => {
    if (chance >= 50) return 'text-green-600 dark:text-green-400';
    if (chance >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getWillpowerColor = (cost: number) => {
    if (cost <= currentWillpower) return 'text-green-600 dark:text-green-400';
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
            Modifier Total
            <span className="text-xs text-gray-500 dark:text-gray-400 block">
              (INT/WIS/CHA mod)
            </span>
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
            Spell Mastery
          </label>
          <input
            type="number"
            min="0"
            value={spellMastery}
            onChange={(e) => setSpellMastery(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Willpower
          </label>
          <input
            type="number"
            min="0"
            value={currentWillpower}
            onChange={(e) => setCurrentWillpower(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current HP
          </label>
          <input
            type="number"
            min="1"
            value={currentHP}
            onChange={(e) => setCurrentHP(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Spell Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Spell
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a spell..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
              if (!e.target.value) setSelectedSpell(null);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />

          {showDropdown && filteredSpells.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredSpells.slice(0, 10).map((spell) => (
                <button
                  key={spell.id}
                  onClick={() => handleSpellSelect(spell)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 dark:text-white">{spell.name}</span>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Level {spell.level} • {spell.school}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedSpell && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-600 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{selectedSpell.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Level {selectedSpell.level} {selectedSpell.school}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && selectedSpell && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spellcasting Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Probabilities */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Success Probabilities (DC {result.dc})
              </h4>
              <div className="space-y-2">
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
              </div>
            </div>

            {/* Costs and Damage */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Willpower Costs & HP Damage
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Critical Success:</span>
                  <div className="text-right">
                    <div className={getWillpowerColor(result.willpowerCosts.criticalSuccess)}>
                      {result.willpowerCosts.criticalSuccess} WP
                    </div>
                    {result.hpDamage.criticalSuccess > 0 && (
                      <div className="text-red-600 dark:text-red-400 text-sm">
                        {result.hpDamage.criticalSuccess} HP damage
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Success:</span>
                  <div className="text-right">
                    <div className={getWillpowerColor(result.willpowerCosts.success)}>
                      {result.willpowerCosts.success} WP
                    </div>
                    {result.hpDamage.success > 0 && (
                      <div className="text-red-600 dark:text-red-400 text-sm">
                        {result.hpDamage.success} HP damage
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Fail:</span>
                  <div className="text-right">
                    <div className={getWillpowerColor(result.willpowerCosts.fail)}>
                      {result.willpowerCosts.fail} WP
                    </div>
                    {result.hpDamage.fail > 0 && (
                      <div className="text-red-600 dark:text-red-400 text-sm">
                        {result.hpDamage.fail} HP damage
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Critical Fail:</span>
                  <div className="text-right">
                    <div className={getWillpowerColor(result.willpowerCosts.criticalFail)}>
                      {result.willpowerCosts.criticalFail} WP
                    </div>
                    {result.hpDamage.criticalFail > 0 && (
                      <div className="text-red-600 dark:text-red-400 text-sm">
                        {result.hpDamage.criticalFail} HP damage
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning if casting could be lethal */}
          {(result.hpDamage.fail >= currentHP || result.hpDamage.criticalFail >= currentHP) && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
              <div className="flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                <span className="text-red-800 dark:text-red-200 font-medium">
                  Warning: Casting this spell could result in lethal damage!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Rules Reference */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Quick Reference
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>DC Formula:</strong> (Spell Level - Caster Level) × 3 + 13 (minimum DC 10)</p>
          <p><strong>Critical Success (Nat 20):</strong> 1 WP cost, +2 mastery if not master</p>
          <p><strong>Success:</strong> 1 WP cost, +1 mastery if not master</p>
          <p><strong>Fail:</strong> 1 + spell level WP cost, +2 mastery if not master</p>
          <p><strong>Critical Fail (Nat 1):</strong> 1 + (2 × spell level) WP cost, no mastery gained</p>
          <p><strong>HP Damage:</strong> 2 HP per 1 WP over current willpower</p>
        </div>
      </div>
    </div>
  );
}