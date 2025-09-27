'use client';

import { useState } from 'react';
import { PotionsSection } from '@/components/compendium/PotionsSection';
import { SpellsSection } from '@/components/compendium/SpellsSection';
import { PotionTemplateWithDetails } from '@/types/potions';
import { SpellTemplateWithDetails } from '@/types/spells';

type CompendiumSection = 'potions' | 'spells' | 'weapons' | 'shields';

export default function Compendium() {
  const [activeSection, setActiveSection] = useState<CompendiumSection | null>(null);
  const [potionTemplates, setPotionTemplates] = useState<PotionTemplateWithDetails[]>([]);
  const [spellTemplates, setSpellTemplates] = useState<SpellTemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const sections = [
    {
      id: 'potions' as const,
      title: '🧪 Potions',
      description: 'Magical brews and alchemical concoctions',
      icon: '🧪',
      available: true
    },
    {
      id: 'spells' as const,
      title: '✨ Spells',
      description: 'Magical incantations and enchantments',
      icon: '✨',
      available: true
    },
    {
      id: 'weapons' as const,
      title: '⚔️ Weapons',
      description: 'Swords, axes, bows, and other armaments',
      icon: '⚔️',
      available: false
    },
    {
      id: 'shields' as const,
      title: '🛡️ Shields',
      description: 'Protective gear and magical barriers',
      icon: '🛡️',
      available: false
    }
  ];

  const fetchPotionTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/potion-templates');
      if (response.ok) {
        const templates = await response.json();
        setPotionTemplates(templates);
      }
    } catch (error) {
      console.error('Error fetching potion templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpellTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/spell-templates');
      if (response.ok) {
        const templates = await response.json();
        // Parse propsJson for each template
        const templatesWithParsedProps = templates.map((template: any) => ({
          ...template,
          propsData: template.propsJson ? JSON.parse(template.propsJson) : undefined
        }));
        setSpellTemplates(templatesWithParsedProps);
      }
    } catch (error) {
      console.error('Error fetching spell templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionClick = async (sectionId: CompendiumSection) => {
    if (!sections.find(s => s.id === sectionId)?.available) {
      return; // Don't allow clicking on unavailable sections
    }

    if (activeSection === sectionId) {
      setActiveSection(null);
      return;
    }

    setActiveSection(sectionId);

    // Load data based on section
    if (sectionId === 'potions' && potionTemplates.length === 0) {
      await fetchPotionTemplates();
    } else if (sectionId === 'spells' && spellTemplates.length === 0) {
      await fetchSpellTemplates();
    }
  };

  const renderSectionContent = () => {
    if (!activeSection) return null;

    switch (activeSection) {
      case 'potions':
        return loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading potions...</span>
          </div>
        ) : (
          <PotionsSection templates={potionTemplates} />
        );

      case 'spells':
        return loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading spells...</span>
          </div>
        ) : (
          <SpellsSection templates={spellTemplates} />
        );

      case 'weapons':
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Weapons section coming soon...</p>
          </div>
        );

      case 'shields':
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Shields section coming soon...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            📚 Item Compendium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Browse through a comprehensive collection of D&D items and equipment.
          </p>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              disabled={!section.available}
              className={`
                p-6 rounded-lg border-2 transition-all duration-200 text-left
                ${activeSection === section.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${!section.available
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">{section.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {section.title.replace(/^[^\s]+ /, '')}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {section.description}
              </p>
              {!section.available && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active Section Content */}
        {activeSection && (
          <div className="transition-all duration-300 ease-in-out">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Compendium
              </button>
              <div className="ml-4 flex items-center">
                <span className="text-2xl mr-2">
                  {sections.find(s => s.id === activeSection)?.icon}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sections.find(s => s.id === activeSection)?.title.replace(/^[^\s]+ /, '')}
                </h2>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {renderSectionContent()}
            </div>
          </div>
        )}

        {/* Instructions when no section is selected */}
        {!activeSection && (
          <div className="text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Select a category above to browse available items.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click on any available section to explore items, learn about their properties, and add them to your inventory.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
