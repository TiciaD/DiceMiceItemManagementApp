'use client';

import { useSession } from 'next-auth/react';
import { SpellTemplateWithDetails, schoolColors, spellLevelColors } from '@/types/spells';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface SpellDetailsModalProps {
  template: SpellTemplateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateScroll: (template: SpellTemplateWithDetails) => void;
}

export function SpellDetailsModal({
  template,
  isOpen,
  onClose,
  onCreateScroll
}: SpellDetailsModalProps) {
  const { data: session, status } = useSession();

  if (!isOpen || !template) return null;

  const schoolClass = schoolColors[template.school as keyof typeof schoolColors] || schoolColors.evocation;
  const levelClass = spellLevelColors[template.level as keyof typeof spellLevelColors] || spellLevelColors[0];

  const handleCreateScroll = () => {
    if (!template) return;
    onCreateScroll(template);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h2>
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${levelClass}`}>
                  {template.level === 0 ? 'Cantrip' : `Level ${template.level}`}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${schoolClass}`}>
                  {template.school.charAt(0).toUpperCase() + template.school.slice(1)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Associated Skill */}
          {template.associatedSkill && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Associated Skill
              </h3>
              <p className="text-gray-900 dark:text-white">
                {template.associatedSkill}
              </p>
            </div>
          )}

          {/* Base Effect */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Base Effect
            </h3>
            <MarkdownRenderer
              content={template.baseEffect}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            />
          </div>

          {/* Inversion Effect */}
          {template.isInvertable && template.inversionEffect && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                Inversion Effect
                {!template.isInversionPublic && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Hidden
                  </span>
                )}
              </h3>
              <MarkdownRenderer
                content={template.inversionEffect}
                className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
              />
            </div>
          )}

          {/* Mastery Effect */}
          {template.masteryEffect && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Mastery Effect
              </h3>
              <MarkdownRenderer
                content={template.masteryEffect}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
              />
            </div>
          )}

          {/* Status Indicators */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Status
            </h3>
            <div className="flex gap-2 flex-wrap">
              {template.isInvertable && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
                  Invertable
                </span>
              )}
              {template.isDiscovered ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                  Discovered
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  Undiscovered
                </span>
              )}
              {template.isInversionPublic ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                  Inversion Public
                </span>
              ) : template.isInvertable && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  Inversion Hidden
                </span>
              )}
            </div>
          </div>

          {/* Additional Properties */}
          {template.propsData?.tags && template.propsData.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tags
              </h3>
              <div className="flex gap-2 flex-wrap">
                {template.propsData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            {status === 'loading' ? (
              <div className="flex-1 text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">
                Loading...
              </div>
            ) : session ? (
              <button
                onClick={handleCreateScroll}
                className="cursor-pointer flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📜 Create Scroll
              </button>
            ) : (
              <div className="flex-1 text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">
                Sign in to create scrolls
              </div>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
