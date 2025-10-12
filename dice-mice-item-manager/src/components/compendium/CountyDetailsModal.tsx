'use client';

import { County } from '@/types/counties';

interface CountyDetailsModalProps {
  county: County;
  isOpen: boolean;
  onClose: () => void;
}

export default function CountyDetailsModal({ county, isOpen, onClose }: CountyDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-3xl flex-shrink-0">🏞️</div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">
                  {county.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  County Information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Character Creation Benefits */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                <span className="text-xl mr-2">🎲</span>
                Character Origin County Benefits
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Characters from {county.name} roll 3d4 keep 3 for {county.associatedStat} during character creation
                  </p>
                </div>
                {county.associatedSkills && (
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Characters from {county.name} can reroll a single check, once per adventure, from one of the associated checks: {county.associatedSkills}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="text-xl mr-2">📖</span>
                Description
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {county.description}
                </p>
              </div>
            </div>

            {/* County Stats Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Quick Reference
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Name:</span>
                    <span className="text-sm text-blue-900 dark:text-blue-100">{county.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Associated Stat:</span>
                    <span className="text-sm text-blue-900 dark:text-blue-100 font-semibold">{county.associatedStat}</span>
                  </div>
                </div>
                {county.associatedSkills && (
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Associated Checks:</span>
                      <span className="text-sm text-blue-900 dark:text-blue-100">{county.associatedSkills}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="cursor-pointer w-full sm:w-auto px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}