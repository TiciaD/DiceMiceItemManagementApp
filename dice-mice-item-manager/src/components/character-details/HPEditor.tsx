'use client';

import { useState } from 'react';

interface HPEditorProps {
  currentHP: number;
  maxHP: number;
  onHPChange: (newHP: number) => Promise<void>;
  isEditing: boolean;
  onToggleEdit: () => void;
  isLoading?: boolean;
}

export function HPEditor({ currentHP, maxHP, onHPChange, isEditing, onToggleEdit, isLoading = false }: HPEditorProps) {
  const [hpValue, setHpValue] = useState(currentHP);
  const [damageValue, setDamageValue] = useState('');
  const [healValue, setHealValue] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleDirectHPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      const clampedHP = Math.max(0, Math.min(maxHP, value));
      setHpValue(clampedHP);
    }
  };

  const handleDamage = async () => {
    const damage = parseInt(damageValue);
    if (!isNaN(damage) && damage > 0) {
      const newHP = Math.max(0, currentHP - damage);
      setLocalLoading(true);
      try {
        await onHPChange(newHP);
        setDamageValue('');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleHeal = async () => {
    const heal = parseInt(healValue);
    if (!isNaN(heal) && heal > 0) {
      const newHP = Math.min(maxHP, currentHP + heal);
      setLocalLoading(true);
      try {
        await onHPChange(newHP);
        setHealValue('');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleDirectSave = async () => {
    setLocalLoading(true);
    try {
      await onHPChange(hpValue);
      onToggleEdit();
    } finally {
      setLocalLoading(false);
    }
  };

  const hpPercent = (currentHP / maxHP) * 100;

  const getHPBarColor = (percent: number) => {
    if (percent <= 25) return 'bg-red-500';
    if (percent <= 50) return 'bg-yellow-500';
    if (percent <= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (!isEditing) {
    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Health</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {currentHP}/{maxHP}
            </span>
            <button
              onClick={onToggleEdit}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isLoading || localLoading}
            >
              Edit
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getHPBarColor(hpPercent)}`}
            style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
          />
        </div>
        {(isLoading || localLoading) && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 relative">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Health</span>
        <button
          onClick={onToggleEdit}
          className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
          disabled={isLoading || localLoading}
        >
          Cancel
        </button>
      </div>

      {/* Current HP Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Current</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentHP}/{maxHP}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getHPBarColor(hpPercent)}`}
            style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
          />
        </div>
      </div>

      {/* Quick Damage/Heal */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">
            Take Damage
          </label>
          <div className="flex gap-1">
            <input
              type="number"
              min="1"
              max={currentHP}
              value={damageValue}
              onChange={(e) => setDamageValue(e.target.value)}
              placeholder="0"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleDamage}
              disabled={!damageValue || parseInt(damageValue) <= 0 || localLoading || isLoading}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Damage
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">
            Heal
          </label>
          <div className="flex gap-1">
            <input
              type="number"
              min="1"
              max={maxHP - currentHP}
              value={healValue}
              onChange={(e) => setHealValue(e.target.value)}
              placeholder="0"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleHeal}
              disabled={!healValue || parseInt(healValue) <= 0 || currentHP >= maxHP || localLoading || isLoading}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Heal
            </button>
          </div>
        </div>
      </div>

      {/* Direct HP Setting */}
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">
          Set HP Directly
        </label>
        <div className="flex gap-1">
          <input
            type="number"
            min="0"
            max={maxHP}
            value={hpValue}
            onChange={handleDirectHPChange}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleDirectSave}
            disabled={localLoading || isLoading}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {(isLoading || localLoading) && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-700/80 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Updating HP...</span>
          </div>
        </div>
      )}
    </div>
  );
}