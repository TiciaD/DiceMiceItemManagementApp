'use client';

import { useState, useEffect } from 'react';
import { HouseWithCounty } from '@/types/houses';
import CreateHouseModal from './CreateHouseModal';
import HouseCard from './HouseCard';

export default function HouseSection() {
  const [house, setHouse] = useState<HouseWithCounty | null | undefined>(undefined); // undefined = loading, null = no house, HouseWithCounty = has house
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHouse();
  }, []);

  const fetchHouse = async () => {
    try {
      const response = await fetch('/api/house');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch house');
      }

      setHouse(data.house);
    } catch (error) {
      console.error('Error fetching house:', error);
      setError(error instanceof Error ? error.message : 'Failed to load house');
      setHouse(null);
    }
  };

  const handleHouseCreated = (newHouse: HouseWithCounty) => {
    setHouse(newHouse);
  };

  const handleHouseUpdated = (updatedHouse: HouseWithCounty) => {
    setHouse(updatedHouse);
  };

  // Loading state
  if (house === undefined) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <div className="text-4xl mb-4">⚠️</div>
          <p>{error}</p>
          <button
            onClick={fetchHouse}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {house ? (
        <HouseCard house={house} onUpdate={handleHouseUpdated} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🏰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Create Your House
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Every adventurer needs a home base. Create your house to store your gold and establish your legacy.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl border-2 border-amber-700 hover:border-amber-800"
          >
            Create House
          </button>
        </div>
      )}

      <CreateHouseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleHouseCreated}
      />
    </>
  );
}
