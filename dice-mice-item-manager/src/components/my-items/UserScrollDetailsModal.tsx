'use client';

import { useState, useEffect } from 'react';
import { ScrollWithTemplate, schoolColors, spellLevelColors, materialColors } from '@/types/spells';
import { formatInGameDate, getCurrentInGameDate } from '@/lib/dateUtils';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface UserScrollDetailsModalProps {
  scroll: ScrollWithTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onScrollConsumed: (scroll: ScrollWithTemplate) => void;
}

export function UserScrollDetailsModal({
  scroll,
  isOpen,
  onClose,
  onScrollConsumed
}: UserScrollDetailsModalProps) {
  const [isConsuming, setIsConsuming] = useState(false);
  const [consumedBy, setConsumedBy] = useState('');
  const [consumedAt, setConsumedAt] = useState('');

  // Initialize the consumedAt field when the modal first opens
  useEffect(() => {
    if (isOpen && scroll && !scroll.consumedBy && consumedAt === '') {
      setConsumedAt(getCurrentInGameDate()); // Get current date in Eastern Time
    }
  }, [isOpen, scroll, consumedAt]);

  if (!isOpen || !scroll) return null;

  const schoolClass = schoolColors[scroll.template.school as keyof typeof schoolColors] || schoolColors.evocation;
  const levelClass = spellLevelColors[scroll.template.level as keyof typeof spellLevelColors] || spellLevelColors[0];
  const materialClass = materialColors[scroll.material as keyof typeof materialColors] || materialColors.paper;

  const isConsumed = !!scroll.consumedBy;
  const consumedDate = scroll.consumedAt ? new Date(scroll.consumedAt) : null;
  const craftedDate = scroll.craftedAt ? new Date(scroll.craftedAt) : null;

  const handleConsume = async () => {
    if (!scroll || isConsuming || isConsumed || !consumedBy.trim() || !consumedAt) return;

    setIsConsuming(true);
    try {
      const response = await fetch(`/api/scrolls/${scroll.id}/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumedBy: consumedBy.trim(),
          consumedAt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to consume scroll');
      }

      const result = await response.json();
      onScrollConsumed(result.scroll);
      onClose();
    } catch (error) {
      console.error('Error consuming scroll:', error);
      alert('Failed to consume scroll. Please try again.');
    } finally {
      setIsConsuming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📜 {scroll.template.name} Scroll
              </h2>
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${levelClass}`}>
                  {scroll.template.level === 0 ? 'Cantrip' : `Level ${scroll.template.level}`}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${schoolClass}`}>
                  {scroll.template.school.charAt(0).toUpperCase() + scroll.template.school.slice(1)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${materialClass}`}>
                  {scroll.material.charAt(0).toUpperCase() + scroll.material.slice(1)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scroll Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Crafted By
              </h3>
              <p className="text-gray-900 dark:text-white mb-4">{scroll.craftedBy}</p>

              {craftedDate && (
                <>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    In-Game Crafted Date
                  </h3>
                  <p className="text-gray-900 dark:text-white mb-4">{formatInGameDate(craftedDate)}</p>
                </>
              )}

              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Weight
              </h3>
              <p className="text-gray-900 dark:text-white">{scroll.weight} lbs</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Status
              </h3>
              {isConsumed ? (
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300 mb-2">
                    Consumed
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    <span className="font-medium">Consumed by:</span> {scroll.consumedBy}
                  </p>
                  {consumedDate && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">In-Game Date:</span> {formatInGameDate(consumedDate)}
                    </p>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                  Ready to Use
                </span>
              )}
            </div>
          </div>

          {/* Associated Skill */}
          {scroll.template.associatedSkill && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Associated Skill
              </h3>
              <p className="text-gray-900 dark:text-white">
                {scroll.template.associatedSkill}
              </p>
            </div>
          )}

          {/* Spell Effect */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Spell Effect
            </h3>
            <MarkdownRenderer
              content={scroll.template.baseEffect}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            />
          </div>

          {/* Inversion Effect */}
          {scroll.template.isInvertable && scroll.template.inversionEffect && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                Inversion Effect
                {!scroll.template.isInversionPublic && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Hidden
                  </span>
                )}
              </h3>
              <MarkdownRenderer
                content={scroll.template.inversionEffect}
                className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
              />
            </div>
          )}

          {/* Mastery Effect */}
          {scroll.template.masteryEffect && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Mastery Effect
              </h3>
              <MarkdownRenderer
                content={scroll.template.masteryEffect}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
              />
            </div>
          )}

          {/* Status Indicators */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Spell Properties
            </h3>
            <div className="flex gap-2 flex-wrap">
              {scroll.template.isInvertable && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
                  Invertable
                </span>
              )}
              {scroll.template.isDiscovered ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                  Discovered
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  Undiscovered
                </span>
              )}
            </div>
          </div>

          {/* Additional Properties */}
          {scroll.template.propsData?.tags && scroll.template.propsData.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tags
              </h3>
              <div className="flex gap-2 flex-wrap">
                {scroll.template.propsData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            {!isConsumed ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Use Scroll
                </h3>

                {/* Consumer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Who is using this scroll? *
                  </label>
                  <input
                    type="text"
                    value={consumedBy}
                    onChange={(e) => setConsumedBy(e.target.value)}
                    placeholder="Character name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Usage Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    In-Game Date Used *
                  </label>
                  <input
                    type="date"
                    value={consumedAt}
                    onChange={(e) => setConsumedAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleConsume}
                    disabled={isConsuming || !consumedBy.trim() || !consumedAt}
                    className="cursor-pointer bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {isConsuming ? 'Using...' : '🔥 Use Scroll'}
                  </button>
                  <button
                    onClick={onClose}
                    className="cursor-pointer px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
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
