'use client';

import { useState } from 'react';
import { PotionWithTemplate, rarityColors, potencyColors, potencyDisplayNames } from '@/types/potions';
import { formatInGameDate, formatInGameDateTime, getCurrentInGameDate } from '@/lib/dateUtils';

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
  const [isConsuming, setIsConsuming] = useState(false);
  const [consumedBy, setConsumedBy] = useState('');
  const [consumedAt, setConsumedAt] = useState('');
  const [actualPotency, setActualPotency] = useState<'success' | 'critical_success'>('success');

  if (!isOpen || !potion) return null;

  const rarityClass = rarityColors[potion.template.rarity] || rarityColors.common;
  const potencyClass = potencyColors[potion.craftedPotency] || potencyColors.success;

  const formatDate = (date: Date | string | number | null) => {
    return formatInGameDate(date);
  };

  const handleStartConsume = () => {
    setIsConsuming(true);
    setConsumedAt(getCurrentInGameDate()); // Get current date in Eastern Time
  };

  const handleConsume = async () => {
    if (!consumedBy.trim() || !consumedAt) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/potions/${potion.id}/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumedBy: consumedBy.trim(),
          consumedAt,
          ...(potion.craftedPotency === 'success_unknown' ? { actualPotency } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to consume potion');
      }

      const result = await response.json();
      onConsume?.(result.potion);
      onClose();
    } catch (error) {
      console.error('Error consuming potion:', error);
      alert('Failed to consume potion. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelConsume = () => {
    setIsConsuming(false);
    setConsumedBy('');
    setConsumedAt('');
    setActualPotency('success');
  };

  const isConsumed = !!potion.consumedBy;

  // Get the appropriate effect text based on crafted potency
  const getEffectText = () => {
    switch (potion.craftedPotency) {
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
              className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
                This potion was consumed by <strong>{potion.consumedBy}</strong> on {formatInGameDateTime(potion.consumedAt)} (Eastern Time)
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
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">In-Game Crafted Date</h4>
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
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            {!isConsumed && onConsume && (
              <>
                {!isConsuming ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleStartConsume}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      🍺 Consume Potion
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(potion)}
                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="cursor-pointer px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Consume Potion
                    </h3>

                    {/* Consumer Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Who is consuming this potion? *
                      </label>
                      <input
                        type="text"
                        value={consumedBy}
                        onChange={(e) => setConsumedBy(e.target.value)}
                        placeholder="Character name..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {/* Consumption Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        In-Game Date Consumed *
                      </label>
                      <input
                        type="date"
                        value={consumedAt}
                        onChange={(e) => setConsumedAt(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {/* Success Unknown Handling */}
                    {potion.craftedPotency === 'success_unknown' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          What was the actual result? *
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Your DM will tell you if it was a success or critical success.
                        </p>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="success"
                              checked={actualPotency === 'success'}
                              onChange={(e) => setActualPotency(e.target.value as 'success' | 'critical_success')}
                              className="mr-2"
                            />
                            <span className="text-gray-900 dark:text-white">Success</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="critical_success"
                              checked={actualPotency === 'critical_success'}
                              onChange={(e) => setActualPotency(e.target.value as 'success' | 'critical_success')}
                              className="mr-2"
                            />
                            <span className="text-gray-900 dark:text-white">Critical Success</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Confirm Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleConsume}
                        disabled={isProcessing || !consumedBy.trim() || !consumedAt}
                        className="cursor-pointer bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        {isProcessing ? 'Consuming...' : 'Confirm Consumption'}
                      </button>
                      <button
                        onClick={handleCancelConsume}
                        disabled={isProcessing}
                        className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {isConsumed && (
              <div className="flex gap-3">
                {onEdit && (
                  <button
                    onClick={() => onEdit(potion)}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    ✏️ Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="cursor-pointer px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
