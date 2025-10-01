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
  const [consumptionType, setConsumptionType] = useState<'partial' | 'full'>('partial');
  const [customAmount, setCustomAmount] = useState('');
  const [isSelling, setIsSelling] = useState(false);
  const [sellPrice, setSellPrice] = useState(0);
  const [updateHouseGold, setUpdateHouseGold] = useState(true);

  if (!isOpen || !potion) return null;

  const rarityClass = rarityColors[potion.template.rarity] || rarityColors.common;
  const potencyClass = potencyColors[potion.craftedPotency] || potencyColors.success;

  const hasSplitAmount = !!potion.template.splitAmount;
  const isPartiallyConsumed = !!potion.usedAmount && !potion.isFullyConsumed;
  const isFullyConsumed = potion.isFullyConsumed || (potion.consumedBy && !hasSplitAmount);

  const formatDate = (date: Date | string | number | null) => {
    return formatInGameDate(date);
  };

  const handleStartConsume = () => {
    setIsConsuming(true);
    setConsumedAt(getCurrentInGameDate()); // Get current date in Eastern Time
    // For partially consumed potions, pre-fill the consumer name
    if (isPartiallyConsumed && potion.consumedBy) {
      setConsumedBy(potion.consumedBy);
    }
    // Default to partial consumption if split amount is available
    if (hasSplitAmount) {
      setConsumptionType('partial');
    } else {
      setConsumptionType('full');
    }
  };

  const handleStartSell = () => {
    setIsSelling(true);
    setSellPrice(potion.template.cost); // Default to template cost
  };

  const handleConsume = async () => {
    if (!consumedBy.trim() || !consumedAt) return;

    const isFullConsumption = consumptionType === 'full';
    const amountUsed = isFullConsumption ? 'Full Potion' : (customAmount.trim() || potion.template.splitAmount);

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
          amountUsed,
          isFullConsumption,
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
    setConsumptionType('partial');
    setCustomAmount('');
  };

  const handleSell = async () => {
    if (sellPrice < 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/potions/${potion.id}/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellPrice,
          updateHouseGold,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sell potion');
      }

      const result = await response.json();
      alert(`Potion sold for ${sellPrice} gold pieces!${updateHouseGold ? ` Added to house treasury.` : ''}`);
      onClose();
      // Refresh the page or call a callback to update the list
      window.location.reload();
    } catch (error) {
      console.error('Error selling potion:', error);
      alert(error instanceof Error ? error.message : 'Failed to sell potion. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSell = () => {
    setIsSelling(false);
    setSellPrice(potion.template.cost);
    setUpdateHouseGold(true);
  };

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
          {isFullyConsumed && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-red-800 dark:text-red-200 font-medium mb-1">Fully Consumed</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                This potion was consumed by <strong>{potion.consumedBy}</strong> on {formatDate(potion.consumedAt)}
              </p>
            </div>
          )}

          {isPartiallyConsumed && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">Partially Consumed</h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                <strong>{potion.usedAmount}</strong> used by <strong>{potion.consumedBy}</strong> on {formatDate(potion.consumedAt)}
              </p>
              {potion.remainingAmount && (
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  <strong>Remaining:</strong> {potion.remainingAmount}
                </p>
              )}
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
            {potion.specialIngredientDetails && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Special Ingredient</h4>
                <p className="text-gray-600 dark:text-gray-300">{potion.specialIngredientDetails}</p>
              </div>
            )}
            {potion.template.splitAmount && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Split Amount</h4>
                <p className="text-gray-600 dark:text-gray-300">{potion.template.splitAmount}</p>
                {isPartiallyConsumed && (
                  <div className="mt-2 text-sm">
                    <p className="text-yellow-600 dark:text-yellow-400">
                      Used: {potion.usedAmount}
                    </p>
                  </div>
                )}
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
            {!isFullyConsumed && onConsume && !isSelling && (
              <>
                {!isConsuming ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleStartConsume}
                      className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      🍺 {isPartiallyConsumed ? 'Use More' : 'Consume Potion'}
                    </button>
                    <button
                      onClick={handleStartSell}
                      className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      💰 Sell Potion
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
                      {isPartiallyConsumed ? 'Use More of Potion' : 'Consume Potion'}
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

                    {/* Consumption Type for Split Amount Potions */}
                    {hasSplitAmount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          How much are you consuming? *
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          This potion can be split into multiple uses ({potion.template.splitAmount} each).
                        </p>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="partial"
                              checked={consumptionType === 'partial'}
                              onChange={(e) => setConsumptionType(e.target.value as 'partial' | 'full')}
                              className="mr-2"
                            />
                            <span className="text-gray-900 dark:text-white">
                              Partial use ({potion.template.splitAmount})
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="full"
                              checked={consumptionType === 'full'}
                              onChange={(e) => setConsumptionType(e.target.value as 'partial' | 'full')}
                              className="mr-2"
                            />
                            <span className="text-gray-900 dark:text-white">
                              Consume entire potion
                            </span>
                          </label>
                        </div>

                        {/* Custom Amount Input for Partial Consumption */}
                        {consumptionType === 'partial' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Custom amount (optional)
                            </label>
                            <input
                              type="text"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder={`Default: ${potion.template.splitAmount}`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              e.g., "1 Dose", "2 die+1", "1 Turn"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

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
                        className="cursor-pointer disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        {isProcessing ? 'Processing...' :
                          consumptionType === 'full' ? 'Consume Entire Potion' : 'Use Partial Amount'}
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

            {/* Sell Modal */}
            {isSelling && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sell Potion
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">⚠️ Warning</p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Once you sell this potion, it will be permanently removed from your inventory and cannot be recovered.
                  </p>
                </div>

                {/* Sell Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sell Price (gold pieces) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Default value: {potion.template.cost} gp (template cost)
                  </p>
                </div>

                {/* Update House Gold */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={updateHouseGold}
                      onChange={(e) => setUpdateHouseGold(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">
                      Add gold to house treasury
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {updateHouseGold
                      ? "The gold will be added to your house treasury. You must have a house to enable this option."
                      : "The gold will not be tracked in the system."}
                  </p>
                </div>

                {/* Confirm Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSell}
                    disabled={isProcessing || sellPrice < 0}
                    className="cursor-pointer disabled:cursor-not-allowed bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {isProcessing ? 'Selling...' : `Sell for ${sellPrice} gp`}
                  </button>
                  <button
                    onClick={handleCancelSell}
                    disabled={isProcessing}
                    className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isFullyConsumed && (
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
