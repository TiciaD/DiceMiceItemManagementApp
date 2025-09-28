'use client';

import { useState } from 'react';
import { PotionWithTemplate } from '@/types/potions';
import { UserPotionCard } from './UserPotionCard';
import { UserPotionDetailsModal } from './UserPotionDetailsModal';

interface MyPotionsSectionProps {
  potions: PotionWithTemplate[];
  onPotionConsumed: (potion: PotionWithTemplate) => void;
}

export function MyPotionsSection({ potions, onPotionConsumed }: MyPotionsSectionProps) {
  const [selectedPotion, setSelectedPotion] = useState<PotionWithTemplate | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'consumed'>('all');

  // Filter potions based on search and status
  const filteredPotions = potions.filter(potion => {
    const matchesSearch = potion.template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      potion.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      potion.craftedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'consumed' && !!potion.consumedBy) ||
      (filterStatus === 'available' && !potion.consumedBy);

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalPotions = potions.length;
  const availablePotions = potions.filter(p => !p.consumedBy).length;
  const consumedPotions = potions.filter(p => !!p.consumedBy).length;
  const totalValue = potions.reduce((sum, p) => sum + (p.template.cost || 0), 0);

  const handlePotionClick = (potion: PotionWithTemplate) => {
    setSelectedPotion(potion);
    setIsDetailsModalOpen(true);
  };

  const handleConsumePotion = async (potion: PotionWithTemplate) => {
    // The consumption is handled in the modal, we just need to update our local state
    // and trigger the parent component's callback
    onPotionConsumed(potion);
    setIsDetailsModalOpen(false);
  };

  if (potions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Potions Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Visit the compendium to add potions to your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPotions}</div>
          <div className="text-sm text-blue-800 dark:text-blue-200">Total Potions</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{availablePotions}</div>
          <div className="text-sm text-green-800 dark:text-green-200">Available</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{consumedPotions}</div>
          <div className="text-sm text-red-800 dark:text-red-200">Consumed</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalValue}</div>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">Total Value (gp)</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Potions
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, ID, or crafter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available' | 'consumed')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Potions</option>
              <option value="available">Available</option>
              <option value="consumed">Consumed</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredPotions.length} of {totalPotions} potions
        </div>
      </div>

      {/* Potions Grid */}
      {filteredPotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPotions.map(potion => (
            <UserPotionCard
              key={potion.id}
              potion={potion}
              onClick={handlePotionClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No potions match your current filters.
          </p>
        </div>
      )}

      {/* Details Modal */}
      <UserPotionDetailsModal
        potion={selectedPotion}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onConsume={handleConsumePotion}
      />
    </div>
  );
}
