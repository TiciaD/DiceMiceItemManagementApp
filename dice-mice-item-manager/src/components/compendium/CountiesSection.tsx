'use client';

import { County } from '@/types/counties';
import CountyCard from './CountyCard';

interface CountiesSectionProps {
  counties: County[];
}

export function CountiesSection({ counties }: CountiesSectionProps) {
  if (counties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏞️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Counties Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Counties have not been loaded yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Available Counties
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Explore the different counties of the realm. Each of the Counties of Squeakshire has its own trials, tribulations, triumphs and other things that don’t start with T.  A new mouse is more likely to be from the county where their house seat remains, but there are mice of every house in every county.  Each region has an Associated Stat and an Associated Check.
        </p>
      </div>

      {/* Counties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {counties.map((county) => (
          <CountyCard key={county.id} county={county} />
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-8">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            💡 Character Creation and Origin County Tip
          </h4>
          <p className="text-amber-700 dark:text-amber-300 text-sm max-w-3xl mx-auto">
            When creating a new house, you&apos;ll select one of these counties as your origin.
            Characters from your house will benefit from rolling 3d4 keep 3 for the county&apos;s associated stat,
            giving them an advantage in that attribute during character creation.
            <br />
            <br />
            Additionally, once per adventure a mouse from a given region can reroll a single check from one of the associated checks.  Once you have rerolled using this feature, you cannot reroll any other associated check with that feature that adventure.
          </p>
        </div>
      </div>
    </div>
  );
}