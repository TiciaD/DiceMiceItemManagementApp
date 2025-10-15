'use client';

import {
  CalculatedCharacterStats,
  formatModifier,
  shouldDisplayOptionalStat
} from '@/lib/character-stats-utils'; interface StatsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function StatsSection({ title, children, className = '' }: StatsSectionProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  description?: string;
}

function StatItem({ label, value, description }: StatItemProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        {description && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
      <span className="font-mono text-lg text-gray-700 dark:text-gray-300">
        {value}
      </span>
    </div>
  );
}

interface BaseStatsProps {
  baseStats: {
    STR: number;
    CON: number;
    DEX: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  modifiers: CalculatedCharacterStats['baseModifiers'];
}

export function BaseStatsSection({ baseStats, modifiers }: BaseStatsProps) {
  return (
    <StatsSection title="Base Stats & Modifiers">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(baseStats).map(([stat, score]) => (
          <div key={stat} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-bold text-lg text-gray-900 dark:text-white">
              {stat}
            </div>
            <div className="text-2xl font-mono text-indigo-600 dark:text-indigo-400">
              {score}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {formatModifier(modifiers[stat as keyof typeof modifiers])}
            </div>
          </div>
        ))}
      </div>
    </StatsSection>
  );
}

interface OffensiveStatsProps {
  stats: CalculatedCharacterStats['offensiveStats'];
}

export function OffensiveStatsSection({ stats }: OffensiveStatsProps) {
  return (
    <StatsSection title="Offensive Stats">
      <div className="space-y-1">
        <StatItem label="Attack" value={formatModifier(stats.attack)} />
        <StatItem label="Spell Attack" value={formatModifier(stats.spellAttack)} />
        <StatItem label="Damage Bonus" value={stats.damageBonus} />
        <StatItem
          label="Initiative"
          value={stats.initiative}
          description="Dice + DEX modifier"
        />
      </div>
    </StatsSection>
  );
}

interface DefensiveStatsProps {
  stats: CalculatedCharacterStats['defensiveStats'];
}

export function DefensiveStatsSection({ stats }: DefensiveStatsProps) {
  return (
    <StatsSection title="Defensive Stats">
      <div className="space-y-1">
        <StatItem
          label="Armor Class"
          value={stats.ac}
          description="Class AC + max(DEX, INT) mod"
        />
        <StatItem
          label="Fortitude"
          value={formatModifier(stats.fortitude)}
          description="Class Fort + max(STR, CON) mod"
        />
        <StatItem
          label="Reflex"
          value={formatModifier(stats.reflex)}
          description="Class Reflex + max(DEX, INT) mod"
        />
        <StatItem
          label="Will"
          value={formatModifier(stats.will)}
          description="Class Will + max(WIS, CHA) mod"
        />
      </div>
    </StatsSection>
  );
}

interface MiscellaneousStatsProps {
  stats: CalculatedCharacterStats['miscellaneousStats'];
  willpowerDescription?: string;
}

export function MiscellaneousStatsSection({ stats, willpowerDescription }: MiscellaneousStatsProps) {
  return (
    <StatsSection title="Miscellaneous Stats">
      <div className="space-y-1">
        <StatItem
          label="Willpower"
          value={stats.willpower}
          description={willpowerDescription}
        />
        <StatItem label="Leadership" value={stats.leadership} />
        <StatItem label="Skill Ranks" value={stats.skillRanks} />
        {shouldDisplayOptionalStat(stats.slayer) && (
          <StatItem label="Slayer" value={stats.slayer!} />
        )}
        {shouldDisplayOptionalStat(stats.rage) && (
          <StatItem label="Rage" value={stats.rage!} />
        )}
        {shouldDisplayOptionalStat(stats.brutalAdvantage) && (
          <StatItem label="Brutal Advantage" value={stats.brutalAdvantage!} />
        )}
      </div>
    </StatsSection>
  );
}

interface ClassAbility {
  id: string;
  name: string;
  description: string;
  level: number;
}

interface ClassAbilitiesProps {
  availableAbilities: ClassAbility[];
  futureAbilities: ClassAbility[];
  currentLevel: number;
}

export function ClassAbilitiesSection({ availableAbilities, futureAbilities }: ClassAbilitiesProps) {
  return (
    <StatsSection title="Class Abilities" className="md:col-span-2">
      {/* Abilities Count */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {availableAbilities.length} available, {futureAbilities.length} future abilities
        </div>
      </div>

      {/* Available Abilities */}
      {availableAbilities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-green-600 dark:text-green-400 mb-3">
            Available Abilities
          </h4>
          <div className="space-y-3">
            {availableAbilities.map((ability) => (
              <div key={ability.id} className="border border-green-200 dark:border-green-800 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {ability.name}
                  </h5>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                    Level {ability.level}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {ability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Future Abilities */}
      {futureAbilities.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3">
            Future Abilities
          </h4>
          <div className="space-y-3">
            {futureAbilities.map((ability) => (
              <div key={ability.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300">
                    {ability.name}
                  </h5>
                  <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                    Level {ability.level}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {availableAbilities.length === 0 && futureAbilities.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No class abilities found.
        </p>
      )}
    </StatsSection>
  );
}