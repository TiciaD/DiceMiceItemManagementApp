'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    id: string;
    name: string;
    classId: string;
    currentLevel: number;
    currentSTR: number;
    currentCON: number;
    currentDEX: number;
    currentINT: number;
    currentWIS: number;
    currentCHA: number;
    maxHP: number;
    hitDie?: string; // This might come from joined class data
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
  const [step, setStep] = useState<'attributes' | 'skills' | 'hitpoints' | 'confirm'>('attributes');
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
  const [skillAllocations, setSkillAllocations] = useState<Record<string, number>>({});
  const [newLevelSkillPoints, setNewLevelSkillPoints] = useState(0);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [loadingSkills, setLoadingSkills] = useState(false);

  const attributeCap = advancedMode ? 30 : getAttributeCap(newLevel); // Higher cap in advanced mode
  const pointsToSpend = advancedMode ? 20 : 2; // More flexible in advanced mode
  const pointsSpent = Object.values(attributeChanges).reduce((sum, val) => sum + val, 0);
  const canProceed = advancedMode ?
    pointsSpent >= 0 : // Any positive allocation in advanced mode
    (pointsSpent === pointsToSpend && Object.entries(attributeChanges).filter(([, val]) => val > 0).length === 2); const fetchNewLevelSkillPoints = useCallback(async () => {
      try {
        setLoadingSkills(true);
        // Get class base attributes for the new level to see how many skill points they get
        const response = await fetch(`/api/classes/${character.classId || ''}/base-attributes?level=${newLevel}`);
        if (response.ok) {
          const data = await response.json();
          setNewLevelSkillPoints(data.skillRanks || 0);
        }

        // Also fetch current skills data
        const skillsResponse = await fetch(`/api/character/${character.id}/skills`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setSkillsData(skillsData);

          // Initialize skill allocations with current values - only unspent points can be changed
          const allocations: Record<string, number> = {};
          skillsData.skills.forEach((skill: any) => {
            allocations[skill.id] = 0; // Only new points can be allocated in level up
          });
          setSkillAllocations(allocations);
        }
      } catch (error) {
        console.error('Error fetching skill data:', error);
      } finally {
        setLoadingSkills(false);
      }
    }, [character.classId, character.id, newLevel]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('attributes');
      setAttributeChanges({ STR: 0, CON: 0, DEX: 0, INT: 0, WIS: 0, CHA: 0 });
      setHpRolls([]);
      setTotalHPGain(0);
      setAdvancedMode(false);
      setManualHPGain('');
      setSkillAllocations({});
      setNewLevelSkillPoints(0);
      setSkillsData(null);
      fetchNewLevelSkillPoints();
    }
  }, [isOpen, newLevel, fetchNewLevelSkillPoints]);

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
        const attributesWithPoints = Object.entries(newChanges).filter(([, val]) => val > 0).length;

        // Rule: Exactly 2 points total, must be in different attributes (max 1 point per attribute)
        const maxPointsPerAttribute = 1;
        const wouldExceedAttributeLimit = newChanges[attr] > maxPointsPerAttribute;

        if (newPointsSpent <= pointsToSpend && attributesWithPoints <= 2 && !wouldExceedAttributeLimit) {
          setAttributeChanges(newChanges);
        }
      }
    }
  };

  const rollHitPoints = () => {
    const hitDieSides = parseHitDie(character.hitDie || '1d6');
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
          skillAllocations: Object.entries(skillAllocations)
            .filter(([, points]) => points > 0)
            .map(([skillId, points]) => ({ skillId, points })),
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
                        Object.entries(attributeChanges).filter(([, val]) => val > 0).length < 2); // Max 2 different attributes

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
                    onClick={() => setStep('skills')}
                    disabled={!canProceed}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Allocate Skill Points
                  </button>
                </div>
              </div>
            )}

            {step === 'skills' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You have {newLevelSkillPoints} skill points to allocate at level {newLevel}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You must spend all skill points before leveling up. These allocations will be locked once you complete the level up.
                  </p>
                </div>

                {loadingSkills ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Loading skills...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Skill Points Available:</span>
                        <span className="text-xl font-bold text-blue-900 dark:text-blue-100">{newLevelSkillPoints}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Points Allocated:</span>
                        <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          {Object.values(skillAllocations).reduce((sum, points) => sum + points, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Remaining:</span>
                        <span className={`text-xl font-bold ${(newLevelSkillPoints - Object.values(skillAllocations).reduce((sum, points) => sum + points, 0)) === 0
                          ? 'text-green-600'
                          : 'text-red-600'
                          }`}>
                          {newLevelSkillPoints - Object.values(skillAllocations).reduce((sum, points) => sum + points, 0)}
                        </span>
                      </div>
                    </div>

                    {skillsData && (
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {skillsData.skills.map((skill: any) => {
                          const currentAllocation = skillAllocations[skill.id] || 0;
                          const totalPoints = skill.pointsInvested + currentAllocation;
                          const remainingToAllocate = newLevelSkillPoints - Object.values(skillAllocations).reduce((sum, points) => sum + points, 0);

                          return (
                            <div key={skill.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h4>
                                    {skill.isClassSkill && (
                                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                                        Class Skill
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{skill.associatedStat}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Current: {skill.pointsInvested} points | New Total: {totalPoints} points
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (currentAllocation > 0) {
                                        setSkillAllocations(prev => ({
                                          ...prev,
                                          [skill.id]: currentAllocation - 1
                                        }));
                                      }
                                    }}
                                    disabled={currentAllocation <= 0}
                                    className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                                  >
                                    -
                                  </button>

                                  <div className="text-center min-w-[3rem]">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      +{currentAllocation}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (remainingToAllocate > 0) {
                                        setSkillAllocations(prev => ({
                                          ...prev,
                                          [skill.id]: currentAllocation + 1
                                        }));
                                      }
                                    }}
                                    disabled={remainingToAllocate <= 0}
                                    className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('attributes')}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('hitpoints')}
                    disabled={Object.values(skillAllocations).reduce((sum, points) => sum + points, 0) !== newLevelSkillPoints}
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
                      `Roll for hit points using your ${character.hitDie || '1d6'}`
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
                            max={advancedMode ? "50" : parseHitDie(character.hitDie || '1d6').toString()}
                            value={manualHPGain}
                            onChange={(e) => setManualHPGain(e.target.value)}
                            placeholder={advancedMode ? "Enter HP gain" : `1-${parseHitDie(character.hitDie || '1d6')}`}
                            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                          />
                          <button
                            onClick={() => {
                              const value = parseInt(manualHPGain);
                              const hitDieSides = parseHitDie(character.hitDie || '1d6');
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
                              (advancedMode ? parseInt(manualHPGain) > 50 : parseInt(manualHPGain) > parseHitDie(character.hitDie || '1d6'))}
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
                              const hitDieSides = parseHitDie(character.hitDie || '1d6');
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
                                  return <span className="text-red-600 dark:text-red-400">Maximum {hitDieSides} HP for {character.hitDie || '1d6'}</span>;
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
                      onClick={() => setStep('skills')}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Attribute Changes</h4>
                    {Object.entries(attributeChanges)
                      .filter(([, change]) => change > 0)
                      .map(([attr, change]) => {
                        const currentValue = character[`current${attr}` as keyof typeof character] as number;
                        return (
                          <div key={attr} className="flex justify-between">
                            <span>{attr}:</span>
                            <span>{currentValue} → {currentValue + change}</span>
                          </div>
                        );
                      })}
                    {Object.entries(attributeChanges).filter(([, change]) => change > 0).length === 0 && (
                      <p className="text-sm text-gray-500">No changes</p>
                    )}
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">Skill Point Allocations</h4>
                    {skillsData && Object.entries(skillAllocations)
                      .filter(([, points]) => points > 0)
                      .map(([skillId, points]) => {
                        const skill = skillsData.skills.find((s: any) => s.id === skillId);
                        return (
                          <div key={skillId} className="flex justify-between text-sm">
                            <span>{skill?.name}:</span>
                            <span>+{points} points</span>
                          </div>
                        );
                      })}
                    {Object.entries(skillAllocations).filter(([, points]) => points > 0).length === 0 && (
                      <p className="text-sm text-gray-500">No allocations</p>
                    )}
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