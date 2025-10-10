'use client';

import type { ClassWithDetails, AttributeTableColumn } from '@/types/classes';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface ClassDetailsModalProps {
  classData: ClassWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClassDetailsModal({ classData, isOpen, onClose }: ClassDetailsModalProps) {
  if (!isOpen || !classData) return null;

  // Map willpower progression values to human-readable text
  const getWillpowerAdvancement = (progression: string): string => {
    switch (progression.toUpperCase()) {
      case 'EVEN':
        return 'Even Levels';
      case 'EVERY':
        return 'Every Level';
      case 'NONE':
        return 'None';
      default:
        return progression; // fallback to original value
    }
  };

  // Define the table columns based on what should be shown
  const getTableColumns = (): AttributeTableColumn[] => [
    { key: 'level', header: 'Level', show: true },
    { key: 'attack', header: 'Attack', show: true },
    { key: 'spellAttack', header: 'Spell', show: true },
    { key: 'ac', header: 'AC', show: true },
    { key: 'fortitude', header: 'Fortitude', show: true },
    { key: 'reflex', header: 'Reflex', show: true },
    { key: 'will', header: 'Will', show: true },
    { key: 'damageBonus', header: 'Damage Bonus', show: true },
    { key: 'leadership', header: 'Leadership', show: true },
    { key: 'skillRanks', header: 'Skill Ranks', show: true },
    { key: 'slayer', header: 'Slayer', show: classData.hasSlayer },
    { key: 'rage', header: 'Rage', show: classData.hasRage },
    { key: 'brutalAdvantage', header: 'Brutal Advantage', show: classData.hasBrutalAdvantage },
  ];

  const tableColumns = getTableColumns().filter(col => col.show);

  // Format prerequisites
  const prerequisites = classData.prerequisiteStat2
    ? `13 ${classData.prerequisiteStat1}, 13 ${classData.prerequisiteStat2}`
    : '13 ' + classData.prerequisiteStat1;

  // Format skill names
  const skillNames = classData.skills.map(skill => skill.name).join(', ');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {classData.name}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {classData.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-6 sm:pb-8">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Class Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Hit Die:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{classData.hitDie}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Prerequisites:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{prerequisites}</span>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Willpower Advancement:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{getWillpowerAdvancement(classData.willpowerProgression)}</span>
              </div>
            </div>
          </div>

          {/* Class Skills */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Class Skills
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {skillNames || 'No class skills defined'}
            </p>
          </div>

          {/* Base Attributes Table */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Base Attributes by Level
            </h3>
            {classData.baseAttributes.length > 0 ? (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {tableColumns.map((column) => (
                          <th
                            key={column.key}
                            className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 last:border-r-0 whitespace-nowrap"
                          >
                            {column.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {classData.baseAttributes.map((attr) => (
                        <tr key={attr.level} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {tableColumns.map((column) => (
                            <td
                              key={column.key}
                              className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0 whitespace-nowrap"
                            >
                              {column.key === 'level' ? attr.level :
                                column.key === 'attack' ? attr.attack :
                                  column.key === 'spellAttack' ? attr.spellAttack :
                                    column.key === 'ac' ? attr.ac :
                                      column.key === 'fortitude' ? attr.fortitude :
                                        column.key === 'reflex' ? attr.reflex :
                                          column.key === 'will' ? attr.will :
                                            column.key === 'damageBonus' ? attr.damageBonus :
                                              column.key === 'leadership' ? attr.leadership :
                                                column.key === 'skillRanks' ? attr.skillRanks :
                                                  column.key === 'slayer' ? (attr.slayer || '') :
                                                    column.key === 'rage' ? (attr.rage || '') :
                                                      column.key === 'brutalAdvantage' ? (attr.brutalAdvantage || '') :
                                                        ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No base attributes defined for this class.</p>
            )}
          </div>

          {/* Class Abilities */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Class Abilities
            </h3>
            {classData.abilities.length > 0 ? (
              <div className="space-y-4">
                {classData.abilities.map((ability) => (
                  <div
                    key={ability.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4"
                  >
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                      Level {ability.level}: {ability.name}
                    </h4>
                    <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      <MarkdownRenderer content={ability.description} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No class abilities defined for this class.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}