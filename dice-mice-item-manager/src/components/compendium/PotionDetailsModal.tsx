'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { PotionTemplateWithDetails, rarityColors } from '@/types/potions';

interface PotionDetailsModalProps {
  template: PotionTemplateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToInventory: (template: PotionTemplateWithDetails) => void;
}

export function PotionDetailsModal({
  template,
  isOpen,
  onClose,
  onAddToInventory
}: PotionDetailsModalProps) {
  const { data: session, status } = useSession();
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen || !template) return null;

  const rarityClass = rarityColors[template.rarity] || rarityColors.common;

  const handleAddToInventory = async () => {
    setIsAdding(true);
    try {
      await onAddToInventory(template);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className={`px-3 py-1 rounded-full font-medium border ${rarityClass}`}>
                  {template.rarity.replace('_', ' ')}
                </span>
                <span>Level {template.level}</span>
                <span>•</span>
                <span>{template.school}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          {template.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {template.description}
              </p>
            </div>
          )}

          {/* Effects */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Potency Effects
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Failure</h4>
                <p className="text-red-700 dark:text-red-300 text-sm">{template.potencyFailEffect}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Success</h4>
                <p className="text-green-700 dark:text-green-300 text-sm">{template.potencySuccessEffect}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Critical Success</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">{template.potencyCriticalSuccessEffect}</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Cost</h4>
              <p className="text-gray-600 dark:text-gray-300">{template.cost} gold pieces</p>
            </div>
            {template.splitAmount && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Split Amount</h4>
                <p className="text-gray-600 dark:text-gray-300">{template.splitAmount}</p>
              </div>
            )}
            {template.specialIngredient && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Special Ingredient</h4>
                <p className="text-gray-600 dark:text-gray-300">{template.specialIngredient}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {template.propsData?.tags && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {template.propsData.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            {status === 'loading' ? (
              <div className="flex-1 text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">
                Loading...
              </div>
            ) : session ? (
              <button
                onClick={handleAddToInventory}
                disabled={isAdding}
                className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isAdding ? 'Adding...' : '+ Add to My Items'}
              </button>
            ) : (
              <div className="flex-1 text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">
                Sign in to add items to your inventory
              </div>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
