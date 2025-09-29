'use client';

import { PotionWithTemplate, rarityColors, potencyColors, potencyDisplayNames } from '@/types/potions';
import { formatInGameDateShort } from '@/lib/dateUtils';

interface UserPotionCardProps {
  potion: PotionWithTemplate;
  onClick: (potion: PotionWithTemplate) => void;
}

export function UserPotionCard({ potion, onClick }: UserPotionCardProps) {
  const rarityClass = rarityColors[potion.template.rarity] || rarityColors.common;
  const potencyClass = potencyColors[potion.craftedPotency] || potencyColors.success;

  const formatDate = (date: Date | string | number | null) => {
    return formatInGameDateShort(date);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4 border border-gray-200 dark:border-gray-700"
      onClick={() => onClick(potion)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {potion.template.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID: {potion.customId}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${rarityClass}`}>
            {potion.template.rarity.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${potencyClass}`}>
            {potencyDisplayNames[potion.craftedPotency]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600 dark:text-gray-300">
        <div>
          <span className="font-medium">Level:</span> {potion.template.level}
        </div>
        <div>
          <span className="font-medium">School:</span> {potion.template.school}
        </div>
        <div>
          <span className="font-medium">Weight:</span> {potion.weight} lbs
        </div>
        <div>
          <span className="font-medium">Value:</span> {potion.template.cost} gp
        </div>
        {potion.specialIngredientDetails && (
          <div className="col-span-2">
            <span className="font-medium">Special Ingredient:</span> {potion.specialIngredientDetails}
          </div>
        )}
      </div>

      <div className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="mb-1">
          <span className="font-medium">Crafted by:</span> {potion.craftedBy}
        </div>
        <div>
          <span className="font-medium">In-Game Date:</span> {formatDate(potion.craftedAt)}
        </div>
      </div>

      {potion.consumedBy && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 text-sm">
          <div className="text-red-800 dark:text-red-200">
            <strong>Consumed</strong> by {potion.consumedBy} on {formatDate(potion.consumedAt)} (In-Game)
          </div>
        </div>
      )}

      {potion.template.propsData?.tags && (
        <div className="flex flex-wrap gap-1 mt-3">
          {potion.template.propsData.tags.map((tag: string, index: number) => (
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
