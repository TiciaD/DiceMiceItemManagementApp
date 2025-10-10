'use client';

interface SkillCardProps {
  id: string;
  name: string;
  description: string;
  associatedStat: string;
  abilitiesCount: number;
  onClick: (id: string) => void;
}

export function SkillCard({
  id,
  name,
  description,
  associatedStat,
  abilitiesCount,
  onClick
}: SkillCardProps) {
  return (
    <div
      onClick={() => onClick(id)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {name}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {associatedStat}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          <span className="font-medium">Abilities:</span> {abilitiesCount}
        </div>
        <div className="text-blue-600 dark:text-blue-400 font-medium">
          View Details →
        </div>
      </div>
    </div>
  );
}