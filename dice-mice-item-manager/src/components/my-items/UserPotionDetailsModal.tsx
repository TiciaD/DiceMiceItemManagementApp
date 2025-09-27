'use client';

import { useState } from 'react';
import { PotionWithTemplate, rarityColors, potencyColors, potencyDisplayNames } from '@/types/potions';

interface UserPotionDetailsModalProps {
  potion: PotionWithTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onConsume?: (potion: PotionWithTemplate) => void;
  onEdit?: (potion: PotionWithTemplate) => void;
}

export function UserPotionDetailsModal({
  potion,
  isOpen,
  onClose,
  onConsume,
  onEdit
}: UserPotionDetailsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !potion) return null;

  const rarityClass = rarityColors[potion.template.rarity] || rarityColors.common;
  const potencyClass = potencyColors[potion.craftedPotency] || potencyColors.success;

  const formatDate = (date: Date | string | number | null) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const formatDateTime = (date: Date | string | number | null) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleString();
  };

  const handleConsume = async () => {
    if (!onConsume) return;
    setIsProcessing(true);
    try {
      await onConsume(potion);
    } finally {
      setIsProcessing(false);
    }
  };

  const isConsumed = !!potion.consumedBy;

  // Get the appropriate effect text based on crafted potency
  const getEffectText = () => {
    switch (potion.craftedPotency) {
      case 'critical_fail':
      case 'fail':
        return potion.template.potencyFailEffect;
      case 'success':
        return potion.template.potencySuccessEffect;
      case 'critical_success':
        return potion.template.potencyCriticalSuccessEffect;
      case 'success_unknown':
        return `Unknown effect (${potion.template.potencySuccessEffect} or ${potion.template.potencyCriticalSuccessEffect})`;
      default:
        return 'Unknown effect';
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
                {potion.template.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className={`px-3 py-1 rounded-full font-medium border ${rarityClass}`}>
                  {potion.template.rarity.replace('_', ' ')}
                </span>
                <span>Level {potion.template.level}</span>
                <span>•</span>
                <span>{potion.template.school}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Potion ID: {potion.customId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status Alert */}
          {isConsumed && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-red-800 dark:text-red-200 font-medium mb-1">Consumed</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                This potion was consumed by <strong>{potion.consumedBy}</strong> on {formatDateTime(potion.consumedAt)}
              </p>
            </div>
          )}

          {/* Description */}
          {potion.template.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {potion.template.description}
              </p>
            </div>
          )}

          {/* Crafting Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Crafting Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Crafted By</h4>
                <p className="text-gray-600 dark:text-gray-300">{potion.craftedBy}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Crafted Date</h4>
                <p className="text-gray-600 dark:text-gray-300">{formatDate(potion.craftedAt)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Crafting Result</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${potencyClass}`}>
                  {potencyDisplayNames[potion.craftedPotency]}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Weight</h4>
                <p className="text-gray-600 dark:text-gray-300">{potion.weight} lbs</p>
              </div>
            </div>
          </div>

          {/* Effect */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Effect When Consumed
            </h3>
            <div className={`p-3 border rounded ${potencyClass.replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', 'border-')}`}>
              <p className="font-medium">{getEffectText()}</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Value</h4>
              <p className="text-gray-600 dark:text-gray-300">{potion.template.cost} gold pieces</p>
            </div>
            {potion.template.splitAmount && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Split Amount</h4>
                <p className="text-gray-600 dark:text-gray-300">{potion.template.splitAmount}</p>
              </div>
            )}
            {potion.template.specialIngredient && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Special Ingredient</h4>
                <p className="text-gray-600 dark:text-gray-300">{potion.template.specialIngredient}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {potion.template.propsData?.tags && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {potion.template.propsData.tags.map((tag: string, index: number) => (
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
            {!isConsumed && onConsume && (
              <button
                onClick={handleConsume}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isProcessing ? 'Consuming...' : '🍺 Consume Potion'}
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(potion)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ✏️ Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
