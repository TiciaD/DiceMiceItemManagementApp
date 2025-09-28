'use client';

import { ScrollWithTemplate, schoolColors, spellLevelColors, materialColors } from '@/types/spells';
import { formatInGameDateShort } from '@/lib/dateUtils';

interface UserScrollCardProps {
  scroll: ScrollWithTemplate;
  onClick: (scroll: ScrollWithTemplate) => void;
}

export function UserScrollCard({ scroll, onClick }: UserScrollCardProps) {
  const schoolClass = schoolColors[scroll.template.school as keyof typeof schoolColors] || schoolColors.evocation;
  const levelClass = spellLevelColors[scroll.template.level as keyof typeof spellLevelColors] || spellLevelColors[0];
  const materialClass = materialColors[scroll.material as keyof typeof materialColors] || materialColors.paper;

  const isConsumed = !!scroll.consumedBy;
  const consumedDate = scroll.consumedAt ? new Date(scroll.consumedAt) : null;
  const craftedDate = scroll.craftedAt ? new Date(scroll.craftedAt) : null;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4 border border-gray-200 dark:border-gray-700 ${isConsumed ? 'opacity-60' : ''
        }`}
      onClick={() => onClick(scroll)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📜 {scroll.template.name}
        </h3>
        <div className="flex gap-2">
          {/* Spell Level Badge */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${levelClass}`}>
            {scroll.template.level === 0 ? 'Cantrip' : `Level ${scroll.template.level}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {/* School Badge */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${schoolClass}`}>
          {scroll.template.school.charAt(0).toUpperCase() + scroll.template.school.slice(1)}
        </span>

        {/* Material Badge */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${materialClass}`}>
          {scroll.material.charAt(0).toUpperCase() + scroll.material.slice(1)}
        </span>

        {/* Weight */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {scroll.weight} lbs
        </span>
      </div>

      {/* Crafter and Date Info */}
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        <p>
          <span className="font-medium">Crafted by:</span> {scroll.craftedBy}
        </p>
        {craftedDate && (
          <p>
            <span className="font-medium">Crafted:</span> {formatInGameDateShort(craftedDate)}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {scroll.template.isInvertable && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
              Invertable
            </span>
          )}
        </div>

        {isConsumed ? (
          <div className="text-right">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
              Consumed
            </span>
            {consumedDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatInGameDateShort(consumedDate)}
              </p>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            Ready to Use
          </span>
        )}
      </div>
    </div>
  );
}
