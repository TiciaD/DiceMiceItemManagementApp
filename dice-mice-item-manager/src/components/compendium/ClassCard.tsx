'use client';

interface ClassCardProps {
  id: string;
  name: string;
  description: string;
  hitDie: string;
  prerequisiteStat1: string;
  prerequisiteStat2?: string | null;
  onClick: (id: string) => void;
}

export function ClassCard({
  id,
  name,
  description,
  hitDie,
  prerequisiteStat1,
  prerequisiteStat2,
  onClick
}: ClassCardProps) {
  const prerequisites = prerequisiteStat2
    ? `${prerequisiteStat1}, ${prerequisiteStat2}`
    : prerequisiteStat1;

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
            {hitDie}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          <span className="font-medium">Prerequisites:</span> {prerequisites}
        </div>
        <div className="text-blue-600 dark:text-blue-400 font-medium">
          View Details →
        </div>
      </div>
    </div>
  );
}