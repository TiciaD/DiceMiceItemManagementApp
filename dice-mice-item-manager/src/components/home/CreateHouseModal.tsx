'use client';

import { useState, useEffect } from 'react';
import { HouseWithCounty } from '@/types/houses';
import { County } from '@/types/counties';

interface CreateHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (house: HouseWithCounty) => void;
}

export default function CreateHouseModal({ isOpen, onClose, onSuccess }: CreateHouseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    motto: '',
    bio: '',
    countyId: '',
  });
  const [counties, setCounties] = useState<County[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCounties, setIsLoadingCounties] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch counties when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCounties();
    }
  }, [isOpen]);

  const fetchCounties = async () => {
    setIsLoadingCounties(true);
    try {
      const response = await fetch('/api/counties');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch counties');
      }

      setCounties(data.counties);
    } catch (error) {
      console.error('Error fetching counties:', error);
      setError('Failed to load counties');
    } finally {
      setIsLoadingCounties(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/house', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create house');
      }

      onSuccess(data.house);
      setFormData({ name: '', motto: '', bio: '', countyId: '' });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create house');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Create Your House
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="houseName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                House Name *
              </label>
              <input
                type="text"
                id="houseName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white text-base"
                placeholder="Enter your house name"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="originCounty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Origin County *
              </label>
              {isLoadingCounties ? (
                <div className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Loading counties...
                </div>
              ) : (
                <select
                  id="originCounty"
                  value={formData.countyId}
                  onChange={(e) => setFormData({ ...formData, countyId: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white text-base"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select your house&apos;s origin county</option>
                  {counties.map((county) => (
                    <option key={county.id} value={county.id}>
                      {county.name} (Associated Stat: {county.associatedStat})
                    </option>
                  ))}
                </select>
              )}
              {formData.countyId && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>County Benefits:</strong>
                    {(() => {
                      const selectedCounty = counties.find(c => c.id === formData.countyId);
                      if (!selectedCounty) return null;
                      return (
                        <div className="mt-1">
                          <div>• Characters roll 3d4 keep 3 for {selectedCounty.associatedStat}</div>
                          {selectedCounty.associatedSkills && (
                            <div>• Associated skills: {selectedCounty.associatedSkills}</div>
                          )}
                          <div className="mt-2 text-xs text-amber-700 dark:text-amber-300 italic">
                            {selectedCounty.description}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="houseMotto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                House Words
              </label>
              <input
                type="text"
                id="houseMotto"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white text-base"
                placeholder="Enter your house words (optional)"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="houseBio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                House Bio
              </label>
              <textarea
                id="houseBio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white text-base resize-none"
                placeholder="Describe your house's history, values, or character"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="cursor-pointer flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim() || !formData.countyId}
                className="cursor-pointer flex-1 px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create House'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
