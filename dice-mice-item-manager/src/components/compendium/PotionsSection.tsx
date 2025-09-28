'use client';

import { useState } from 'react';
import { PotionTemplateWithDetails, CreatePotionFormData } from '@/types/potions';
import { PotionCard } from './PotionCard';
import { PotionDetailsModal } from './PotionDetailsModal';
import { AddPotionModal } from './AddPotionModal';

interface PotionsSectionProps {
  templates: PotionTemplateWithDetails[];
}

export function PotionsSection({ templates }: PotionsSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PotionTemplateWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddPotionModalOpen, setIsAddPotionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');

  // Get unique values for filters
  const levels = [...new Set(templates.map(t => t.level))];
  const schools = [...new Set(templates.map(t => t.school))];

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || template.level.toString() === selectedLevel;
    const matchesSchool = selectedSchool === 'all' || template.school === selectedSchool;

    return matchesSearch && matchesLevel && matchesSchool;
  });

  const handleTemplateClick = (template: PotionTemplateWithDetails) => {
    setSelectedTemplate(template);
    setIsDetailsModalOpen(true);
  };

  const handleAddToInventory = async (template: PotionTemplateWithDetails) => {
    // Close the details modal and open the add potion modal
    setIsDetailsModalOpen(false);
    setSelectedTemplate(template);
    setIsAddPotionModalOpen(true);
  };

  const handleCreatePotion = async (formData: CreatePotionFormData) => {
    try {
      const response = await fetch('/api/potions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create potion');
      }

      const result = await response.json();
      console.log('Potion created successfully:', result);

      // Show success message
      alert(`${selectedTemplate?.name} has been added to your inventory!`);

      // Reset selected template
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error creating potion:', error);
      alert('Failed to add potion to inventory. Please try again.');
      throw error; // Re-throw to let the modal handle the loading state
    }
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Potions Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No potion templates have been added to the database yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Level Filter */}
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Level
            </label>
            <select
              id="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Levels</option>
              {levels.sort().map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <label htmlFor="school" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              School
            </label>
            <select
              id="school"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Schools</option>
              {schools.map(school => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTemplates.length} of {templates.length} potions
        </div>
      </div>

      {/* Potions Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <PotionCard
              key={template.id}
              template={template}
              onClick={handleTemplateClick}
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
      <PotionDetailsModal
        template={selectedTemplate}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onAddToInventory={handleAddToInventory}
      />

      {/* Add Potion Modal */}
      <AddPotionModal
        isOpen={isAddPotionModalOpen}
        onClose={() => setIsAddPotionModalOpen(false)}
        onSubmit={handleCreatePotion}
        selectedTemplate={selectedTemplate}
        availableTemplates={templates}
      />
    </div>
  );
}
