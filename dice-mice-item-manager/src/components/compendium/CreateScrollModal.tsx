'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SpellTemplateWithDetails, materialDisplayNames, MaterialType } from '@/types/spells';

interface CreateScrollModalProps {
  template: SpellTemplateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onScrollCreated: () => void;
}

export function CreateScrollModal({
  template,
  isOpen,
  onClose,
  onScrollCreated
}: CreateScrollModalProps) {
  const { data: session } = useSession();
  const [material, setMaterial] = useState<MaterialType>('paper');
  const [craftedBy, setCraftedBy] = useState('');
  const [weight, setWeight] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/scrolls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spellTemplateId: template.id,
          material,
          craftedBy: craftedBy || session.user.name || 'Unknown',
          weight: Number(weight),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create scroll');
      }

      // Reset form
      setMaterial('paper');
      setCraftedBy('');
      setWeight(0.1);

      onScrollCreated();
    } catch (error) {
      console.error('Error creating scroll:', error);
      setError('Failed to create scroll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Scroll: {template.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Material Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Material
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as MaterialType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {Object.entries(materialDisplayNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Crafted By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Crafted By
              </label>
              <input
                type="text"
                value={craftedBy}
                onChange={(e) => setCraftedBy(e.target.value)}
                placeholder={session?.user?.name || 'Enter crafter name'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weight (lbs)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Scroll'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
