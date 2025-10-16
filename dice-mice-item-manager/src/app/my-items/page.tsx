'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { PotionWithTemplate } from '@/types/potions';
import { ScrollWithTemplate } from '@/types/spells';
import { MyPotionsSection } from '@/components/my-items/MyPotionsSection';
import { MyScrollsSection } from '@/components/my-items/MyScrollsSection';

type ItemCategory = 'potions' | 'scrolls' | 'spells' | 'weapons' | 'shields';

export default function MyItems() {
  const { data: session, status } = useSession();
  const [activeCategory, setActiveCategory] = useState<ItemCategory | null>(null);
  const [potions, setPotions] = useState<PotionWithTemplate[]>([]);
  const [scrolls, setScrolls] = useState<ScrollWithTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    {
      id: 'potions' as const,
      title: '🧪 Potions',
      description: 'Your alchemical collection',
      icon: '🧪',
      available: true
    },
    {
      id: 'scrolls' as const,
      title: '📜 Scrolls',
      description: 'Your spell scrolls',
      icon: '📜',
      available: true
    },
    {
      id: 'weapons' as const,
      title: '⚔️ Weapons',
      description: 'Your armaments',
      icon: '⚔️',
      available: false
    },
    {
      id: 'shields' as const,
      title: '🛡️ Shields',
      description: 'Your protective gear',
      icon: '🛡️',
      available: false
    }
  ];

  const fetchPotions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/my-potions');
      if (response.ok) {
        const userPotions = await response.json();
        setPotions(userPotions);
      }
    } catch (error) {
      console.error('Error fetching potions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScrolls = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/my-scrolls');
      if (response.ok) {
        const userScrolls = await response.json();
        setScrolls(userScrolls);
      }
    } catch (error) {
      console.error('Error fetching scrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (categoryId: ItemCategory) => {
    if (!categories.find(c => c.id === categoryId)?.available) {
      return; // Don't allow clicking on unavailable categories
    }

    if (activeCategory === categoryId) {
      setActiveCategory(null);
      return;
    }

    setActiveCategory(categoryId);

    // Load data based on category
    if (categoryId === 'potions') {
      await fetchPotions();
    } else if (categoryId === 'scrolls') {
      await fetchScrolls();
    }
  };

  const handlePotionConsumed = (potion: PotionWithTemplate) => {
    // Update the local state to reflect the consumption
    setPotions(potions.map(p =>
      p.id === potion.id
        ? { ...p, ...potion }  // Update with consumed data from the API
        : p
    ));
  };

  const handleScrollConsumed = (scroll: ScrollWithTemplate) => {
    // Update the local state to reflect the consumption
    setScrolls(scrolls.map(s =>
      s.id === scroll.id
        ? { ...s, ...scroll }  // Update with consumed data from the API
        : s
    ));
  };

  const renderCategoryContent = () => {
    if (!activeCategory) return null;

    switch (activeCategory) {
      case 'potions':
        return loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading potions...</span>
          </div>
        ) : (
          <MyPotionsSection
            potions={potions}
            onPotionConsumed={handlePotionConsumed}
          />
        );

      case 'scrolls':
        return loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading scrolls...</span>
          </div>
        ) : (
          <MyScrollsSection
            scrolls={scrolls}
            onScrollConsumed={handleScrollConsumed}
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {categories.find(c => c.id === activeCategory)?.title.replace(/^[^\s]+ /, '')} section coming soon...
            </p>
          </div>
        );
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <main className="container mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              🎒 My Items
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <p className="text-gray-600 dark:text-gray-300">
                Please sign in to view your personal item collection.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            🎒 My Items
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Manage your personal collection of Dice Mice items and equipment.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              disabled={!category.available}
              className={`
                p-6 rounded-lg border-2 transition-all duration-200 text-left
                ${activeCategory === category.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${!category.available
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">{category.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category.title.replace(/^[^\s]+ /, '')}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {category.description}
              </p>
              {!category.available && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active Category Content */}
        {activeCategory && (
          <div className="transition-all duration-300 ease-in-out">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to My Items
              </button>
              <div className="ml-4 flex items-center">
                <span className="text-2xl mr-2">
                  {categories.find(c => c.id === activeCategory)?.icon}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.find(c => c.id === activeCategory)?.title.replace(/^[^\s]+ /, '')}
                </h2>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {renderCategoryContent()}
            </div>
          </div>
        )}

        {/* Instructions when no category is selected */}
        {!activeCategory && (
          <div className="text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Select a category above to view your items.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your personal collection of potions, spells, weapons, and other items will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
