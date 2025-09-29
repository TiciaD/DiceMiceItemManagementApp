'use client';

import { useState, useEffect } from 'react';
import { PotionTemplateWithDetails, CreatePotionFormData, PotencyType, potencyDisplayNames, potencyColors } from '@/types/potions';
import { createId } from '@paralleldrive/cuid2';

interface AddPotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePotionFormData) => Promise<void>;
  selectedTemplate?: PotionTemplateWithDetails | null;
  availableTemplates: PotionTemplateWithDetails[];
}

export function AddPotionModal({
  isOpen,
  onClose,
  onSubmit,
  selectedTemplate,
  availableTemplates
}: AddPotionModalProps) {
  const [formData, setFormData] = useState<CreatePotionFormData>({
    potionTemplateId: selectedTemplate?.id || '',
    customId: '',
    hasCustomId: false,
    craftedBy: '',
    craftedAt: new Date(),
    craftedPotency: 'success',
    weight: 0.33, // Default weight of all potions
    specialIngredientDetails: '' // Default empty for special ingredient details
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreatePotionFormData, string>>>({});

  // Reset form when modal opens/closes or selectedTemplate changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        potionTemplateId: selectedTemplate?.id || '',
        customId: '',
        hasCustomId: false,
        craftedBy: '',
        craftedAt: new Date(),
        craftedPotency: 'success',
        weight: 0.33, // Default weight of all potions
        specialIngredientDetails: '' // Default empty for special ingredient details
      });
      setErrors({});
    }
  }, [isOpen, selectedTemplate]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreatePotionFormData, string>> = {};
    const selectedTemplateData = availableTemplates.find(t => t.id === formData.potionTemplateId);

    if (!formData.potionTemplateId) {
      newErrors.potionTemplateId = 'Please select a potion template';
    }
    if (formData.hasCustomId && !formData.customId.trim()) {
      newErrors.customId = 'Custom ID is required when enabled';
    }
    if (!formData.craftedBy.trim()) {
      newErrors.craftedBy = 'Crafter name is required';
    }
    // Require special ingredient details if the template has a special ingredient
    if (selectedTemplateData?.specialIngredient && !formData.specialIngredientDetails?.trim()) {
      newErrors.specialIngredientDetails = 'Special ingredient details are required for this potion';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        customId: formData.hasCustomId ? formData.customId : createId()
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error creating potion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTemplateData = availableTemplates.find(t => t.id === formData.potionTemplateId);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Potion to Inventory
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Potion Template Selection */}
            <div>
              <label htmlFor="potionTemplate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Potion Type *
              </label>
              <select
                id="potionTemplate"
                value={formData.potionTemplateId}
                onChange={(e) => setFormData({ ...formData, potionTemplateId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a potion type...</option>
                {availableTemplates
                  .filter(template => template.isDiscovered)
                  .map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} (Level {template.level})
                    </option>
                  ))}
              </select>
              {errors.potionTemplateId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.potionTemplateId}</p>
              )}
            </div>

            {/* Selected Template Preview */}
            {selectedTemplateData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Selected Potion</h3>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p><strong>{selectedTemplateData.name}</strong></p>
                  <p>Level {selectedTemplateData.level} • {selectedTemplateData.school} • {selectedTemplateData.cost} gp</p>
                  {selectedTemplateData.description && (
                    <p className="mt-1 italic">{selectedTemplateData.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Custom ID Section */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  id="hasCustomId"
                  type="checkbox"
                  checked={formData.hasCustomId}
                  onChange={(e) => setFormData({
                    ...formData,
                    hasCustomId: e.target.checked,
                    customId: e.target.checked ? formData.customId : ''
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasCustomId" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use Custom ID (from Excel sheet)
                </label>
              </div>
              {formData.hasCustomId && (
                <input
                  type="text"
                  placeholder="Enter custom ID (e.g., HP001)"
                  value={formData.customId}
                  onChange={(e) => setFormData({ ...formData, customId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
              {!formData.hasCustomId && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  A random ID will be generated automatically
                </p>
              )}
              {errors.customId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customId}</p>
              )}
            </div>

            {/* Crafter */}
            <div>
              <label htmlFor="craftedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Crafted By *
              </label>
              <input
                id="craftedBy"
                type="text"
                placeholder="Enter crafter name or character"
                value={formData.craftedBy}
                onChange={(e) => setFormData({ ...formData, craftedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.craftedBy && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.craftedBy}</p>
              )}
            </div>

            {/* Crafted Date */}
            <div>
              <label htmlFor="craftedAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Crafted Date *
              </label>
              <input
                id="craftedAt"
                type="date"
                value={formatDate(formData.craftedAt)}
                onChange={(e) => setFormData({ ...formData, craftedAt: parseDate(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Crafted Potency */}
            <div>
              <label htmlFor="craftedPotency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Crafting Result *
              </label>
              <div className="space-y-2">
                {(Object.keys(potencyDisplayNames) as PotencyType[]).map(potency => {
                  const colorClass = potencyColors[potency];
                  return (
                    <label key={potency} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="craftedPotency"
                        value={potency}
                        checked={formData.craftedPotency === potency}
                        onChange={(e) => setFormData({ ...formData, craftedPotency: e.target.value as PotencyType })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClass} mr-3`}>
                          {potencyDisplayNames[potency]}
                        </span>
                        {potency === 'success_unknown' && (
                          <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                            Successful, but degree unknown until consumed
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Special Ingredient Details - Only show if template has special ingredient */}
            {selectedTemplateData?.specialIngredient && (
              <div>
                <label htmlFor="specialIngredientDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Ingredient Details
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                    (Required: {selectedTemplateData.specialIngredient})
                  </span>
                </label>
                <input
                  id="specialIngredientDetails"
                  type="text"
                  placeholder="e.g., 'Bird', 'Weasel', 'Perception', 'Survival'"
                  value={formData.specialIngredientDetails || ''}
                  onChange={(e) => setFormData({ ...formData, specialIngredientDetails: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Specify the exact ingredient used (e.g., &quot;Weasel&quot; for Bane potion, &quot;Perception&quot; for Talent potion)
                </p>
                {errors.specialIngredientDetails && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.specialIngredientDetails}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Adding Potion...' : 'Add to My Items'}
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
