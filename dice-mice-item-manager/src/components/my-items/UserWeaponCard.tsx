'use client';

import { WeaponWithDetails, DAMAGE_TYPE_META, SPECIAL_MODES } from '@/types/weapons';

interface UserWeaponCardProps {
  weapon: WeaponWithDetails;
  onClick?: (weapon: WeaponWithDetails) => void;
  onDelete?: (weapon: WeaponWithDetails) => void;
}

export function UserWeaponCard({ weapon, onClick, onDelete }: UserWeaponCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(weapon);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200 dark:border-gray-700 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onClick?.(weapon)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {weapon.name}
          </h3>
          {weapon.templateName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Based on: {weapon.templateName}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
            {weapon.handedness === '1H' ? '1-Handed' : '2-Handed'}
          </span>
          {/* Material badge - only show if not steel (default) */}
          {weapon.material !== 'steel' && weapon.materialMeta && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${weapon.materialMeta.bgClass} ${weapon.materialMeta.colorClass} border ${weapon.materialMeta.borderClass}`}>
              {weapon.materialMeta.name}
            </span>
          )}
        </div>
      </div>

      {/* Damage Types with Dice */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Damage
        </div>
        <div className="flex flex-wrap gap-2">
          {weapon.damageTypes.map((dt) => {
            const meta = DAMAGE_TYPE_META[dt.damageTypeCode];
            return (
              <div
                key={dt.damageTypeCode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${meta.bgClass} border ${meta.borderClass}`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.dotColor }}
                />
                <span className={meta.colorClass}>{meta.name}</span>
                <span className="font-bold text-white">{dt.finalDie}</span>
                {dt.statThreshold && (
                  <span className="text-xs text-gray-400">
                    ({meta.stat} {dt.statThreshold})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Mode */}
      {weapon.modeCode !== 'none' && (
        <div className="mb-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
            {SPECIAL_MODES[weapon.modeCode].name}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Created by {weapon.createdBy}
        </div>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
