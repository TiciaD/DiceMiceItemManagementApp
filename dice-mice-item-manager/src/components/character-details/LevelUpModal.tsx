'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    id: string;
    name: string;
    currentLevel: number;
    currentSTR: number;
    currentCON: number;
    currentDEX: number;
    currentINT: number;
    currentWIS: number;
    currentCHA: number;
    maxHP: number;
    class: {
      hitDie: string;
    } | null;
  };
  newLevel: number;
  newXP: number;
  onLevelUpComplete: () => void;
  onCancel?: () => void;
  sequenceInfo?: {
    currentStep: number;
    totalSteps: number;
    targetLevel: number;
  };
}

// Level caps based on the chart provided
const getAttributeCap = (level: number): number => {
  if (level >= 12) return 24;
  if (level >= 8) return 22;
  if (level >= 4) return 20;
  return 18;
};

const getModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

const parseHitDie = (hitDie: string): number => {
  // Parse strings like "1d6", "1d8", etc.
  const match = hitDie.match(/1d(\d+)/);
  return match ? parseInt(match[1]) : 6; // Default to d6 if parsing fails
};

export function LevelUpModal({ isOpen, onClose, character, newLevel, newXP, onLevelUpComplete, sequenceInfo }: LevelUpModalProps) {
  const [step, setStep] = useState<'attributes' | 'hitpoints' | 'confirm'>('attributes');
  const [attributeChanges, setAttributeChanges] = useState({
    STR: 0,
    CON: 0,
    DEX: 0,
    INT: 0,
    WIS: 0,
    CHA: 0,
  });
  const [hpRolls, setHpRolls] = useState<number[]>([]);
  const [totalHPGain, setTotalHPGain] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [manualHPGain, setManualHPGain] = useState('');

  const attributeCap = advancedMode ? 30 : getAttributeCap(newLevel); // Higher cap in advanced mode
  const pointsToSpend = advancedMode ? 20 : 2; // More flexible in advanced mode
  const pointsSpent = Object.values(attributeChanges).reduce((sum, val) => sum + val, 0);
  const canProceed = advancedMode ?
    pointsSpent >= 0 : // Any positive allocation in advanced mode
    (pointsSpent === pointsToSpend && Object.entries(attributeChanges).filter(([_, val]) => val > 0).length === 2);  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('attributes');
      setAttributeChanges({ STR: 0, CON: 0, DEX: 0, INT: 0, WIS: 0, CHA: 0 });
      setHpRolls([]);
      setTotalHPGain(0);
      setAdvancedMode(false);
      setManualHPGain('');
    }
  }, [isOpen, newLevel]);

  const handleAttributeChange = (attr: keyof typeof attributeChanges, delta: number) => {
    const currentValue = character[`current${attr}`];
    const newValue = currentValue + attributeChanges[attr] + delta;

    if (advancedMode) {
      // In advanced mode, allow more flexibility but prevent negative values
      if (newValue >= 1 && newValue <= attributeCap) {
        const newChanges = { ...attributeChanges, [attr]: attributeChanges[attr] + delta };
        const newPointsSpent = Object.values(newChanges).reduce((sum, val) => sum + val, 0);

        if (newPointsSpent <= pointsToSpend) {
          setAttributeChanges(newChanges);
        }
      }
    } else {
      // Normal mode with standard restrictions
      if (newValue <= attributeCap && newValue >= currentValue) {
        const newChanges = { ...attributeChanges, [attr]: attributeChanges[attr] + delta };
        const newPointsSpent = Object.values(newChanges).reduce((sum, val) => sum + val, 0);
        const attributesWithPoints = Object.entries(newChanges).filter(([_, val]) => val > 0).length;

        // Rule: Exactly 2 points total, must be in different attributes (max 1 point per attribute)
        const maxPointsPerAttribute = 1;
        const wouldExceedAttributeLimit = newChanges[attr] > maxPointsPerAttribute;

        if (newPointsSpent <= pointsToSpend && attributesWithPoints <= 2 && !wouldExceedAttributeLimit) {
          setAttributeChanges(newChanges);
        }
      }
    }
  }; const rollHitPoints = () => {
    const hitDieSides = parseHitDie(character.class?.hitDie || '1d6');
    const conModifier = getModifier(character.currentCON + attributeChanges.CON);

    let roll = Math.floor(Math.random() * hitDieSides) + 1;
    const rolls = [roll];

    // Reroll if result is <= CON modifier
    while (roll <= conModifier && roll < hitDieSides) {
      roll = Math.floor(Math.random() * hitDieSides) + 1;
      rolls.push(roll);
    }

    // If CON modifier would force max roll, take max
    if (conModifier >= hitDieSides) {
      roll = hitDieSides;
    }

    setHpRolls(rolls);
    setTotalHPGain(roll);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Apply all changes to the character
      const response = await fetch(`/api/character/${character.id}/level-up`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newLevel,
          newXP,
          attributeChanges,
          hpGain: totalHPGain,
          advancedMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply level up changes');
      }

      onLevelUpComplete();
      onClose();
    } catch (error) {
      console.error('Error applying level up:', error);
      // Could add error handling here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => { }} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div className="p-6">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              🎉 Level Up! {character.name} → Level {newLevel}
              {sequenceInfo && (
                <div className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                  Level {sequenceInfo.currentStep} of {sequenceInfo.totalSteps} (to Level {sequenceInfo.targetLevel})
                </div>
              )}
            </DialogTitle>

            {step === 'attributes' && (
              <div className="space-y-6">
                {/* Advanced Mode Toggle */}
                <div className="flex justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advancedMode}
                      onChange={(e) => {
                        setAdvancedMode(e.target.checked);
                        // Reset changes when switching modes
                        setAttributeChanges({ STR: 0, CON: 0, DEX: 0, INT: 0, WIS: 0, CHA: 0 });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Advanced Mode (bypass normal restrictions)
                    </span>
                  </label>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {advancedMode ?
                      `You have ${pointsToSpend - pointsSpent} points available (flexible allocation)` :
                      `You have ${pointsToSpend - pointsSpent} attribute points to spend`
                    }
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {advancedMode ?
                      `Advanced Mode: Higher cap (${attributeCap}) • Flexible point allocation` :
                      `2 points total • 1 point max per attribute • Cap: ${attributeCap} (${getModifier(attributeCap) >= 0 ? '+' : ''}${getModifier(attributeCap)})`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(attributeChanges).map(([attr, change]) => {
                    const currentValue = character[`current${attr}` as keyof typeof character] as number;
                    const newValue = currentValue + change;

                    const canIncrease = advancedMode ?
                      (newValue < attributeCap && pointsSpent < pointsToSpend) :
                      (newValue < attributeCap && pointsSpent < pointsToSpend &&
                        change === 0 && // Can only add to attributes that don't have points yet
                        Object.entries(attributeChanges).filter(([_, val]) => val > 0).length < 2); // Max 2 different attributes

                    const canDecrease = advancedMode ?
                      (newValue > 1) : // Prevent going below 1 in advanced mode
                      (change > 0); // Only decrease if we've added points in normal mode

                    return (
                      <div key={attr} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">{attr}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {currentValue} → {newValue} ({getModifier(newValue) >= 0 ? '+' : ''}{getModifier(newValue)})
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button
                            onClick={() => handleAttributeChange(attr as keyof typeof attributeChanges, -1)}
                            disabled={!canDecrease}
                            className="w-8 h-8 bg-red-600 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-700"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-blue-600 dark:text-blue-400">
                            {change > 0 ? `+${change}` : '0'}
                          </span>
                          <button
                            onClick={() => handleAttributeChange(attr as keyof typeof attributeChanges, 1)}
                            disabled={!canIncrease}
                            className="w-8 h-8 bg-green-600 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-green-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between">
                  {/* <button
                    onClick={() => {
                      if (onCancel) {
                        onCancel();
                      }
                      onClose();
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel Level Up
                  </button> */}
                  <button
                    onClick={() => setStep('hitpoints')}
                    disabled={!canProceed}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Roll Hit Points
                  </button>
                </div>
              </div>
            )}

            {step === 'hitpoints' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {advancedMode ?
                      'Set your hit point gain manually or roll normally' :
                      `Roll for hit points using your ${character.class?.hitDie || '1d6'}`
                    }
                  </p>
                  {!advancedMode && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      CON modifier: {getModifier(character.currentCON + attributeChanges.CON) >= 0 ? '+' : ''}{getModifier(character.currentCON + attributeChanges.CON)}
                      (reroll results ≤ modifier)
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                  {hpRolls.length === 0 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {advancedMode ? 'Manual HP Gain (no restrictions)' : 'Enter Your Dice Roll Result'}
                        </label>
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            min={advancedMode ? "1" : "1"}
                            max={advancedMode ? "50" : parseHitDie(character.class?.hitDie || '1d6').toString()}
                            value={manualHPGain}
                            onChange={(e) => setManualHPGain(e.target.value)}
                            placeholder={advancedMode ? "Enter HP gain" : `1-${parseHitDie(character.class?.hitDie || '1d6')}`}
                            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                          />
                          <button
                            onClick={() => {
                              const value = parseInt(manualHPGain);
                              const hitDieSides = parseHitDie(character.class?.hitDie || '1d6');
                              const conModifier = getModifier(character.currentCON + attributeChanges.CON);

                              if (!isNaN(value) && value > 0) {
                                if (advancedMode) {
                                  // Advanced mode: any value 1-50
                                  if (value <= 50) {
                                    setTotalHPGain(value);
                                    setHpRolls([value]);
                                  }
                                } else {
                                  // Normal mode: validate against hit die and CON modifier rules
                                  if (value >= 1 && value <= hitDieSides) {
                                    const finalHP = value;

                                    // Apply CON modifier reroll rule - if roll is <= CON mod, should be rerolled
                                    if (value <= conModifier && conModifier < hitDieSides) {
                                      // This is a low roll that should have been rerolled
                                      // Allow it but warn the user
                                      setTotalHPGain(finalHP);
                                      setHpRolls([value]); // Show the original roll
                                    } else {
                                      setTotalHPGain(finalHP);
                                      setHpRolls([value]);
                                    }
                                  }
                                }
                              }
                            }}
                            disabled={!manualHPGain || isNaN(parseInt(manualHPGain)) || parseInt(manualHPGain) <= 0 ||
                              (advancedMode ? parseInt(manualHPGain) > 50 : parseInt(manualHPGain) > parseHitDie(character.class?.hitDie || '1d6'))}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Set HP
                          </button>
                        </div>
                        {/* Validation feedback */}
                        {manualHPGain && (
                          <div className="text-xs mt-1">
                            {(() => {
                              const value = parseInt(manualHPGain);
                              const hitDieSides = parseHitDie(character.class?.hitDie || '1d6');
                              const conModifier = getModifier(character.currentCON + attributeChanges.CON);

                              if (isNaN(value) || value <= 0) {
                                return <span className="text-red-600 dark:text-red-400">Enter a positive number</span>;
                              }

                              if (advancedMode) {
                                if (value > 50) {
                                  return <span className="text-red-600 dark:text-red-400">Maximum 50 HP in advanced mode</span>;
                                }
                                return <span className="text-green-600 dark:text-green-400">Valid HP gain</span>;
                              } else {
                                if (value > hitDieSides) {
                                  return <span className="text-red-600 dark:text-red-400">Maximum {hitDieSides} HP for {character.class?.hitDie || '1d6'}</span>;
                                }
                                if (value <= conModifier && conModifier < hitDieSides) {
                                  return <span className="text-yellow-600 dark:text-yellow-400">Low roll - would normally be rerolled</span>;
                                }
                                return <span className="text-green-600 dark:text-green-400">Valid HP gain</span>;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                      {!advancedMode && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Remember: Rolls ≤ {getModifier(character.currentCON + attributeChanges.CON)} (CON mod) should be rerolled
                        </div>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Or use automatic rolling:
                      </div>
                      <button
                        onClick={rollHitPoints}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        🎲 Roll Automatically
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Rolls:</p>
                        <div className="flex justify-center gap-2 mb-4">
                          {hpRolls.map((roll, index) => (
                            <span
                              key={index}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${index === hpRolls.length - 1 ? 'bg-green-600' : 'bg-gray-400'
                                }`}
                            >
                              {roll}
                            </span>
                          ))}
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          +{totalHPGain} HP
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          New Max HP: {character.maxHP + totalHPGain}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={rollHitPoints}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          🎲 Reroll
                        </button>
                        <button
                          onClick={() => {
                            setHpRolls([]);
                            setTotalHPGain(0);
                            setManualHPGain('');
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Change HP
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <div className="flex gap-2">
                    {/* <button
                      onClick={() => {
                        if (onCancel) {
                          onCancel();
                        }
                        onClose();
                      }}
                      className="cursor-pointer px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Cancel
                    </button> */}
                    <button
                      onClick={() => setStep('attributes')}
                      className="cursor-pointer px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Back
                    </button>
                  </div>
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={totalHPGain === 0}
                    className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Confirm
                  </button>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Confirm your level up changes:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Attribute Changes</h4>
                    {Object.entries(attributeChanges)
                      .filter(([_, change]) => change > 0)
                      .map(([attr, change]) => {
                        const currentValue = character[`current${attr}` as keyof typeof character] as number;
                        return (
                          <div key={attr} className="flex justify-between">
                            <span>{attr}:</span>
                            <span>{currentValue} → {currentValue + change}</span>
                          </div>
                        );
                      })}
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Hit Points</h4>
                    <div className="flex justify-between">
                      <span>HP Gained:</span>
                      <span>+{totalHPGain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Max HP:</span>
                      <span>{character.maxHP + totalHPGain}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="flex gap-2">
                    {/* <button
                      onClick={() => {
                        if (onCancel) {
                          onCancel();
                        }
                        onClose();
                      }}
                      disabled={isSubmitting}
                      className="cursor-pointer px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button> */}
                    <button
                      onClick={() => setStep('hitpoints')}
                      disabled={isSubmitting}
                      className="cursor-pointer px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Back
                    </button>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="cursor-pointer px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Applying Changes...' : '🎉 Level Up!'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}