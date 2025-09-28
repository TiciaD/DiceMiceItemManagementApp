'use client';

import { useState } from 'react';
import { ScrollWithTemplate } from '@/types/spells';
import { UserScrollCard } from './UserScrollCard';
import { UserScrollDetailsModal } from './UserScrollDetailsModal';

interface MyScrollsSectionProps {
  scrolls: ScrollWithTemplate[];
  onScrollConsumed: (scroll: ScrollWithTemplate) => void;
}

export function MyScrollsSection({ scrolls, onScrollConsumed }: MyScrollsSectionProps) {
  const [selectedScroll, setSelectedScroll] = useState<ScrollWithTemplate | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get unique levels and schools for filters
  const uniqueLevels = [...new Set(scrolls.map(s => s.template.level))].sort((a, b) => a - b);
  const uniqueSchools = [...new Set(scrolls.map(s => s.template.school))].sort();

  // Filter scrolls based on search and filters
  const filteredScrolls = scrolls.filter(scroll => {
    const matchesSearch = scroll.template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scroll.template.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scroll.craftedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'all' || scroll.template.level === parseInt(selectedLevel);
    const matchesSchool = selectedSchool === 'all' || scroll.template.school === selectedSchool;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'available' && !scroll.consumedBy) ||
      (statusFilter === 'consumed' && scroll.consumedBy);

    return matchesSearch && matchesLevel && matchesSchool && matchesStatus;
  });

  const handleScrollClick = (scroll: ScrollWithTemplate) => {
    setSelectedScroll(scroll);
    setIsDetailsModalOpen(true);
  };

  const handleScrollConsumed = (scroll: ScrollWithTemplate) => {
    setIsDetailsModalOpen(false);
    setSelectedScroll(null);
    onScrollConsumed(scroll);
  };

  if (scrolls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Scrolls Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          You haven&apos;t created any scrolls yet. Visit the Compendium to create some!
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
                placeholder="Search scrolls..."
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

          {/* Status Filter */}
          <div>
            <select
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Scrolls</option>
              <option value="available">Available</option>
              <option value="consumed">Consumed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredScrolls.length} of {scrolls.length} scrolls
      </div>

      {/* Scrolls Grid */}
      {filteredScrolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredScrolls.map((scroll) => (
            <UserScrollCard
              key={scroll.id}
              scroll={scroll}
              onClick={handleScrollClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No scrolls match your current filters.
          </p>
        </div>
      )}

      {/* Details Modal */}
      <UserScrollDetailsModal
        scroll={selectedScroll}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedScroll(null);
        }}
        onScrollConsumed={handleScrollConsumed}
      />
    </div>
  );
}
