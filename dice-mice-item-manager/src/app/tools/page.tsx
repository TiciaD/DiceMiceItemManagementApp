'use client';

import { useState } from 'react';
import SpellcastingCalculator from '@/components/tools/SpellcastingCalculator';
import PotionMixingCalculator from '@/components/tools/PotionMixingCalculator';
import PotionCraftingCalculator from '@/components/tools/PotionCraftingCalculator';

export default function ToolsPage() {
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);

  const calculators = [
    {
      id: 'spellcasting',
      name: 'Spellcasting Calculator',
      description: 'Calculate spellcraft check outcomes, willpower costs, and potential damage',
      icon: '🔮',
      component: SpellcastingCalculator,
    },
    {
      id: 'potion-mixing',
      name: 'Potion Mixing Calculator',
      description: 'Calculate mortality check outcomes when drinking multiple potions',
      icon: '🧪',
      component: PotionMixingCalculator,
    },
    {
      id: 'potion-crafting',
      name: 'Potion Crafting Calculator',
      description: 'Calculate crafting success rates for known and unknown potions',
      icon: '⚗️',
      component: PotionCraftingCalculator,
    },
    // Future calculators can be added here
    {
      id: 'combat',
      name: 'Combat Calculator',
      description: 'Coming soon - Calculate attack rolls and damage',
      icon: '⚔️',
      component: null,
    },
  ];

  const activeCalc = calculators.find(calc => calc.id === activeCalculator);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧮 Dice Mice Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A collection of calculators and tools to help you make informed decisions
            during your adventures in the world of Dice Mice.
          </p>
        </div>

        {!activeCalculator ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculators.map((calculator) => (
              <div
                key={calculator.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 ${calculator.component
                  ? 'hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
                  }`}
                onClick={() => calculator.component && setActiveCalculator(calculator.id)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{calculator.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {calculator.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {calculator.description}
                  </p>
                  {calculator.component && (
                    <button className="cursor-pointer mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
                      Open Calculator
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{activeCalc?.icon}</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeCalc?.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveCalculator(null)}
                className="cursor-pointer bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                ← Back to Tools
              </button>
            </div>

            {activeCalc?.component && (
              <activeCalc.component />
            )}
          </div>
        )}
      </div>
    </div>
  );
}