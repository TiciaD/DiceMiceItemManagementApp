'use client';

import { useState } from 'react';
import { SpellCard } from './SpellCard';
import { SpellDetailsModal } from './SpellDetailsModal';
import type { SpellTemplateWithDetails } from '@/types/spells';
import { CreateScrollModal } from './CreateScrollModal';

interface SpellsSectionProps {
  templates: SpellTemplateWithDetails[];
}

export function SpellsSection({ templates }: SpellsSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SpellTemplateWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateScrollModalOpen, setIsCreateScrollModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [discoveredFilter, setDiscoveredFilter] = useState<string>('all');

  // Get unique levels and schools for filters
  const uniqueLevels = [...new Set(templates.map(t => t.level))].sort((a, b) => a - b);
  const uniqueSchools = [...new Set(templates.map(t => t.school))].sort();

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.baseEffect.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.school.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'all' || template.level === parseInt(selectedLevel);
    const matchesSchool = selectedSchool === 'all' || template.school === selectedSchool;
    const matchesDiscovered = discoveredFilter === 'all' ||
      (discoveredFilter === 'discovered' && template.isDiscovered) ||
      (discoveredFilter === 'undiscovered' && !template.isDiscovered);

    return matchesSearch && matchesLevel && matchesSchool && matchesDiscovered;
  });

  const handleTemplateClick = (template: SpellTemplateWithDetails) => {
    setSelectedTemplate(template);
    setIsDetailsModalOpen(true);
  };

  const handleCreateScroll = (template: SpellTemplateWithDetails) => {
    setSelectedTemplate(template);
    setIsDetailsModalOpen(false);
    setIsCreateScrollModalOpen(true);
  };

  const handleScrollCreated = () => {
    setIsCreateScrollModalOpen(false);
    setSelectedTemplate(null);
    // You might want to refresh data or show a success message here
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Spells Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No spell templates have been added to the database yet.
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search spells..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <select
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">All Levels</option>
              {uniqueLevels.map(level => (
                <option key={level} value={level.toString()}>
                  {level === 0 ? 'Cantrip' : `Level ${level}`}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <select
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
            >
              <option value="all">All Schools</option>
              {uniqueSchools.map(school => (
                <option key={school} value={school}>
                  {school.charAt(0).toUpperCase() + school.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Discovery Filter */}
          <div>
            <select
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={discoveredFilter}
              onChange={(e) => setDiscoveredFilter(e.target.value)}
            >
              <option value="all">All Spells</option>
              <option value="discovered">Discovered Only</option>
              <option value="undiscovered">Undiscovered Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredTemplates.length} of {templates.length} spells
      </div>

      {/* Spells Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <SpellCard
              key={template.id}
              template={template}
              onClick={handleTemplateClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No spells match your current filters.
          </p>
        </div>
      )}

      {/* Modals */}
      <SpellDetailsModal
        template={selectedTemplate}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTemplate(null);
        }}
        onCreateScroll={handleCreateScroll}
      />

      <CreateScrollModal
        template={selectedTemplate}
        isOpen={isCreateScrollModalOpen}
        onClose={() => {
          setIsCreateScrollModalOpen(false);
          setSelectedTemplate(null);
        }}
        onScrollCreated={handleScrollCreated}
      />
    </div>
  );
}
