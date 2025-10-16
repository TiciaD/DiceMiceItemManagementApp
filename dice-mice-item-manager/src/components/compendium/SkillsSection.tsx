'use client';

import { useState, useMemo } from 'react';
import { SkillCard } from './SkillCard';
import { SkillDetailsModal } from './SkillDetailsModal';
import type { SkillWithDetails } from '@/types/skills';

interface SkillsSectionProps {
  skills: SkillWithDetails[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStat, setSelectedStat] = useState('');

  // Get unique associated stats for filter
  const uniqueStats = useMemo(() => {
    const stats = skills.map(skill => skill.associatedStat);
    return Array.from(new Set(stats)).sort();
  }, [skills]);

  // Filter and search skills
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // Filter by associated stat
      if (selectedStat && skill.associatedStat !== selectedStat) {
        return false;
      }

      // Search in skill name, description, and skill abilities
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();

        // Search in skill name and description
        const nameMatch = skill.name.toLowerCase().includes(searchLower);
        const descMatch = skill.description.toLowerCase().includes(searchLower);

        // Search in skill abilities descriptions
        const abilityMatch = skill.abilities.some(ability =>
          ability.description.toLowerCase().includes(searchLower)
        );

        return nameMatch || descMatch || abilityMatch;
      }

      return true;
    });
  }, [skills, searchTerm, selectedStat]);

  const handleSkillClick = (skillId: string) => {
    const skillData = skills.find(s => s.id === skillId);
    if (skillData) {
      setSelectedSkill(skillData);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSkill(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStat('');
  };

  if (skills.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No skills available</p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search skills, descriptions, and abilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Associated Stat Filter */}
          <div className="sm:w-48">
            <select
              value={selectedStat}
              onChange={(e) => setSelectedStat(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Stats</option>
              {uniqueStats.map((stat) => (
                <option key={stat} value={stat}>
                  {stat}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || selectedStat) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredSkills.length} of {skills.length} skills
          {searchTerm && (
            <span> matching &quot;{searchTerm}&quot;</span>
          )}
          {selectedStat && (
            <span> for {selectedStat}</span>
          )}
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No skills found matching your search criteria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Clear filters to see all skills
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              id={skill.id}
              name={skill.name}
              description={skill.description}
              associatedStat={skill.associatedStat}
              abilitiesCount={skill.abilities.length}
              onClick={handleSkillClick}
            />
          ))}
        </div>
      )}

      <SkillDetailsModal
        skillData={selectedSkill}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}