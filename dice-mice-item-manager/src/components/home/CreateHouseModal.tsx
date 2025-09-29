'use client';

import { useState } from 'react';
import { House } from '@/types/houses';

interface CreateHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (house: House) => void;
}

export default function CreateHouseModal({ isOpen, onClose, onSuccess }: CreateHouseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    motto: '',
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setFormData({ name: '', motto: '', bio: '' });
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
                disabled={isLoading || !formData.name.trim()}
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
