'use client';

import { useState } from 'react';
import { County } from '@/types/counties';
import CountyDetailsModal from './CountyDetailsModal';

interface CountyCardProps {
  county: County;
}

export default function CountyCard({ county }: CountyCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-start space-x-3">
          <div className="text-2xl flex-shrink-0">🏞️</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
              {county.name}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Associated Stat:
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                  {county.associatedStat}
                </span>
              </div>
              {county.associatedSkills && (
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                    Associated Checks:
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {county.associatedSkills}
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {county.description}
              </p>
            </div>
          </div>
        </div>

        {/* Click hint */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 text-center">
            Click to view full details
          </p>
        </div>
      </div>

      <CountyDetailsModal
        county={county}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}