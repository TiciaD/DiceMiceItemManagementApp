'use client';

import { SpellTemplateWithDetails, schoolColors, spellLevelColors } from '@/types/spells';

interface SpellCardProps {
  template: SpellTemplateWithDetails;
  onClick: (template: SpellTemplateWithDetails) => void;
}

export function SpellCard({ template, onClick }: SpellCardProps) {
  const schoolClass = schoolColors[template.school as keyof typeof schoolColors] || schoolColors.evocation;
  const levelClass = spellLevelColors[template.level as keyof typeof spellLevelColors] || spellLevelColors[0];
  const isDiscovered = template.isDiscovered;

  const handleClick = () => {
    if (isDiscovered) {
      onClick(template);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200 dark:border-gray-700 ${isDiscovered ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
        }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isDiscovered ? template.name : 'Unknown'}
        </h3>
        <div className="flex gap-2">
          {/* Spell Level Badge */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${levelClass}`}>
            {template.level === 0 ? 'Cantrip' : `Level ${template.level}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {/* School Badge */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${schoolClass}`}>
          {isDiscovered ? template.school.charAt(0).toUpperCase() + template.school.slice(1) : '???'}
        </span>

        {/* Associated Skill */}
        {isDiscovered && template.associatedSkill && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {template.associatedSkill}
          </span>
        )}
      </div>

      {/* Base Effect Preview */}
      {isDiscovered ? (
        <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {template.baseEffect.length > 150
            ? `${template.baseEffect.substring(0, 150)}...`
            : template.baseEffect
          }
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic">
          This spell has not been discovered yet...
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          {isDiscovered && template.isInvertable && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
              Invertable
            </span>
          )}
          {template.isDiscovered && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
              Discovered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
