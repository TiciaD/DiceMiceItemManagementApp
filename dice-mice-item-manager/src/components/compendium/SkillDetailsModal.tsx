'use client';

import type { SkillWithDetails } from '@/types/skills';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface SkillDetailsModalProps {
  skillData: SkillWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SkillDetailsModal({ skillData, isOpen, onClose }: SkillDetailsModalProps) {
  if (!isOpen || !skillData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {skillData.name}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              Associated Stat: <span className="font-medium">{skillData.associatedStat}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-6 sm:pb-8">
          {/* Skill Description */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Description
            </h3>
            <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              <MarkdownRenderer content={skillData.description} />
            </div>
          </div>

          {/* Skill Abilities */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Skill Abilities
            </h3>
            {skillData.abilities.length > 0 ? (
              <div className="space-y-4">
                {skillData.abilities.map((ability) => (
                  <div
                    key={ability.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {ability.name}
                      </h4>
                      <span className="flex-shrink-0 ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded">
                        Cost: {ability.level + 1} Skill Points
                      </span>
                    </div>
                    <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      <MarkdownRenderer content={ability.description} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No skill abilities defined for this skill.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}