'use client';

import { useState } from 'react';
import { WeaponWithDetails } from '@/types/weapons';
import { UserWeaponCard } from './UserWeaponCard';

interface MyWeaponsSectionProps {
  weapons: WeaponWithDetails[];
  onWeaponDeleted: (weapon: WeaponWithDetails) => void;
  onCreateClick: () => void;
}

export function MyWeaponsSection({ weapons, onWeaponDeleted, onCreateClick }: MyWeaponsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDelete, setPendingDelete] = useState<WeaponWithDetails | null>(null);

  // Filter weapons based on search
  const filteredWeapons = weapons.filter(weapon => {
    const matchesSearch = 
      weapon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (weapon.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      weapon.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Stats
  const totalWeapons = weapons.length;
  const oneHandedCount = weapons.filter(w => w.handedness === '1H').length;
  const twoHandedCount = weapons.filter(w => w.handedness === '2H').length;
  const dualDamageCount = weapons.filter(w => w.damageMode === 'dual').length;

  const handleDeleteClick = (weapon: WeaponWithDetails) => {
    setPendingDelete(weapon);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      const response = await fetch(`/api/weapons/${pendingDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onWeaponDeleted(pendingDelete);
      } else {
        console.error('Failed to delete weapon');
      }
    } catch (error) {
      console.error('Error deleting weapon:', error);
    } finally {
      setPendingDelete(null);
    }
  };

  if (weapons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Weapons Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Use the Weapon Builder to create your first custom weapon.
        </p>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          <span>⚔️</span>
          <span>Create Weapon</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalWeapons}</div>
          <div className="text-sm text-indigo-800 dark:text-indigo-200">Total Weapons</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{oneHandedCount}</div>
          <div className="text-sm text-blue-800 dark:text-blue-200">1-Handed</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{twoHandedCount}</div>
          <div className="text-sm text-purple-800 dark:text-purple-200">2-Handed</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{dualDamageCount}</div>
          <div className="text-sm text-amber-800 dark:text-amber-200">Dual Damage</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="flex-1 w-full md:w-auto">
            <label htmlFor="weapon-search" className="sr-only">Search Weapons</label>
            <input
              id="weapon-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search weapons..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          {/* Create Button */}
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            <span>⚔️</span>
            <span>Create Weapon</span>
          </button>
        </div>
      </div>

      {/* Weapon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWeapons.map(weapon => (
          <UserWeaponCard
            key={weapon.id}
            weapon={weapon}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {filteredWeapons.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No weapons match &ldquo;{searchTerm}&rdquo;
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Weapon?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete &ldquo;{pendingDelete.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
