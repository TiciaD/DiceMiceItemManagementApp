'use client';

import { PotionTemplateWithDetails, rarityColors } from '@/types/potions';

interface PotionCardProps {
  template: PotionTemplateWithDetails;
  onClick: (template: PotionTemplateWithDetails) => void;
}

export function PotionCard({ template, onClick }: PotionCardProps) {
  const rarityClass = rarityColors[template.rarity] || rarityColors.common;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4 border border-gray-200 dark:border-gray-700"
      onClick={() => onClick(template)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {template.name}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${rarityClass}`}>
          {template.rarity.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-300">
        <span>Level {template.level}</span>
        <span>•</span>
        <span>{template.school}</span>
        <span>•</span>
        <span>{template.cost} gp</span>
      </div>

      {template.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
          {template.description}
        </p>
      )}

      {template.propsData?.tags && (
        <div className="flex flex-wrap gap-1">
          {template.propsData.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
