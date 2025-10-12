'use client';

import { useState } from 'react';
import { HouseWithCounty } from '@/types/houses';
import GoldManager from './GoldManager';

interface HouseCardProps {
  house: HouseWithCounty;
  onUpdate: (updatedHouse: HouseWithCounty) => void;
}

export default function HouseCard({ house, onUpdate }: HouseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: house.name,
    motto: house.motto || '',
    bio: house.bio || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/house', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update house');
      }

      onUpdate(data.house);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update house');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: house.name,
      motto: house.motto || '',
      bio: house.bio || '',
    });
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-700 to-amber-800 p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          {/* House Info Section */}
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="text-3xl sm:text-4xl flex-shrink-0">🏰</div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-white text-white placeholder-amber-200 focus:outline-none w-full min-w-0"
                  placeholder="House name"
                  disabled={isLoading}
                />
              ) : (
                <h3 className="text-xl sm:text-2xl font-bold text-white break-words">{house.name}</h3>
              )}
              <div className="flex items-center mt-2">
                <span className="text-lg sm:text-xl mr-2">🪙</span>
                <span className="text-base sm:text-lg font-semibold text-white">
                  {house.gold.toLocaleString()} Gold
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex justify-end">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="cursor-pointer bg-white text-amber-800 hover:bg-amber-50 px-4 py-2 rounded-lg transition-colors font-medium border-2 border-white"
              >
                Edit
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading || !formData.name.trim()}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Origin County
            </label>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏞️</span>
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {house.county.name}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Associated Stat: {house.county.associatedStat}
                  </p>
                  {house.county.associatedSkills && (

                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Associated skills: {house.county.associatedSkills}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              House Words
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter house motto"
                disabled={isLoading}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 italic break-words">
                {house.motto ? `"${house.motto}"` : 'No motto set'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              House Bio
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Describe your house"
                disabled={isLoading}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {house.bio || 'No description available'}
              </p>
            )}
          </div>
        </div>

        {/* Gold Manager - only show when not editing */}
        {!isEditing && (
          <div className='mt-2'>
            <GoldManager house={house} onUpdate={onUpdate} />
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
